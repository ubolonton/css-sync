// Dependencies
var app = require("http").createServer(handler);
var io = require("socket.io").listen(app);
var url = require("url");
var fs = require("fs");

// Config
var config = require("./config.js");
var port = config.port || 8888;
var urlToFileName = config.urlToFileName || function(url) {
  return undefined;
};

// Keep track of which watcher handles which url
var urlToWatcher = {};

function log(str) {
  console.log("css-sync > " + str);
}

// Serve file as javascript
function serveJS(response, fileName) {
  fs.readFile(fileName, function(error, data) {
    if (error) {
      log("Error: " + error);
      response.writeHead(500);
      response.end("");
    } else {
      response.writeHead(200, { "Content-Type": "text/javascript" });
      response.end(data);
    }
  });
}

// Host the client-side js
function handler(request, response) {
  var path = url.parse(request.url).pathname;
  if (path === "/css-sync-client.js")
    serveJS(response, __dirname + "/css-sync-client.js");
}

// A watcher has multiple clients, which are notified everytime the
// watched file (url) is changed
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

  // XXX: Find out why fs.watch has problem with "git reset --hard"
  // (stop watching) & "git checkout --" (crash) on OS X
  fs.watchFile(fileName, {
    persistent: true, interval: 50
  }, function(prev, curr) {
    if (prev.mtime.getTime() !== curr.mtime.getTime()) {
      log("[ change " + clientSockets.length + "] " + url);
      // Notify clients that this file has changed
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
      log("[ ++++++ " + clientSockets.length + "] " + url);
      return this;
    },
    removeClient: function(socket) {
      var index = clientSockets.indexOf(socket);
      if (index > -1)
        clientSockets.splice(index, 1);
      log("[ ------ " + clientSockets.length + "] " + url);
      return this;
    },
    stopWatching: function() {
      log("Stop watching  {" + url + " " + fileName + "}");
      fs.unwatchFile(fileName);
      return this;
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

app.listen(port);

io.sockets.on("connection", function(socket) {
  log("Client connected");

  socket.emit("hi", "Hello there! You can register css links whose changes you are interested in. I'll tell you when they do.");

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
