// var app = require("http").createServer(handler);
var io = require("socket.io").listen(8888, {log: false});
var url = require("url");
var fs = require("fs");

function log(str) {
  console.log("css-sync > " + str);
}

// app.listen(8888);

// function serveJS(response, fileName) {
//   fs.readFile(fileName, function(error, data) {
//     if (error) {
//       log("Error: " + error);
//       response.writeHead(500);
//       response.end("");
//     } else {
//       response.writeHead(200, { "Content-Type": "text/javascript" });
//       response.end(data);
//     }
//   });
// }

// function handler(request, response) {
//   var path = url.parse(request.url).pathname;
//   if (path === "/css-sync-client.js") {
//     serveJS(response, __dirname + "/css-sync-client.js");
//   }
// }

var fileNameToClients = {};
var urlToWatcher = {};

function urlToFileName(url) {
  return {
    "/css/rf.css": "/home/ubolonton/Programming/cogini/bidandbuy-vagrant/bidandbuy/web/html/css/rf.css"
  }[url];
}

function createWatcher(url) {
  // Get the file
  var fileName = urlToFileName(url);
  if (!fileName) {
    log("Don't know what file " + url +  " is mapped to");
    // TODO: Raise exception instead
    return undefined;
  }

  // List of sockets interested in this file
  var clientSockets = [];

  // Start watching
  var w = fs.watch(fileName, {
    persistent: true,
    interval: 0
  }, function(event, file_name) {
    log("[" + event + " " + clientSockets.length + "] " + url);
    // Notify clients that this file has changed
    if (event === "change" ||
        event === "rename") {   // Hmm...
      for (var i = 0; i < clientSockets.length; i++) {
        clientSockets[i].emit("change", {
          url: url
        });
      }
    }
  });

  log("Start watching {" + url + " " + fileName + "}");

  // Watcher API
  return {
    addClient: function(socket) {
      if (clientSockets.indexOf(socket) === -1)
        clientSockets.push(socket);
      log("[ +++++ " + clientSockets.length + "] " + url);
      return this;
    },
    removeClient: function(socket) {
      var index = clientSockets.indexOf(socket);
      if (index > -1)
        clientSockets.splice(index, 1);
      log("[ ----- " + clientSockets.length + "] " + url);
      return this;
    },
    stopWatching: function() {
      log("Stop watching  {" + url + " " + fileName + "}");
      w.close(); return this;
    },
    countClient: function() {
      return clientSockets.length;
    }
  };
}

function register(socket, url) {
  // Create or get the watcher watching the file
  var watcher = urlToWatcher[url];
  if (!watcher) {
    try {
      watcher = createWatcher(url);
    } catch (exception) {
      log("Failed to watch " + url);
      return;
    }
    // If no watcher was created, don't do anything
    if (!watcher)
      return;

    urlToWatcher[url] = watcher;
  }

  // Add this socket to the list to be notified
  watcher.addClient(socket);
}

function unregister(socket, url) {
  var watcher = urlToWatcher[url];
  if (!watcher) {
    log("Not currently watching " + url);
    return;
  }

  watcher.removeClient(socket);

  // If no client left, stop watching and remove it
  if (watcher.countClient() < 1) {
    watcher.stopWatching();
    delete urlToWatcher[url];
  }
}

io.sockets.on("connection", function(socket) {
  log("Client connected");

  socket.emit("hi", "Hello there!");

  socket.on("register", function(data) {
    var urls = data.urls;
    for (var i = 0; i < urls.length; i++) {
      register(socket, urls[i]);
    }
  });

  socket.on("unregister", function(data) {
    var urls = data.urls;
    for (var i = 0; i < urls.length; i++) {
      unregister(socket, urls[i]);
    }
  });

  socket.on("disconnect", function() {
    log("Disconnect");
    for (var url in urlToWatcher) {
      unregister(socket, url);
    }
  });

});
