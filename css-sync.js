var io = require("socket.io").listen(8888);
var fs = require("fs");

var urlToFileName = function(url) {
  return {
    "/css/rf.css": "/home/ubolonton/Programming/cogini/bidandbuy-vagrant/bidandbuy/web/html/css/rf.css"
  }[url];
};

// XXX: Attach many clients to 1 file watcher instead
// XXX: Stop watching appropriately

io.sockets.on("connection", function(socket) {
  socket.emit("hi", "Hello there!");

  socket.on("register", function(data) {
    var urls = data.urls;

    for (var i = 0; i < urls.length; i++) {
      var url = urls[i];
      var fileName = urlToFileName(url);
      if (fileName) {
        try {
          fs.watch(fileName, {
            persistent: true,
            interval: 0
          }, function(event, fileName) {
            console.log(event + " : " + fileName + " : " + url);
            socket.emit("change", {
              url: url
            });
          });
          console.log("Watching: " + fileName);
        } catch (exception) {
          console.log("Failed to watch file " + fileName);
        }
      }
    }
  });

})
