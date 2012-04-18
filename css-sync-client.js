/*global: io: true, $: true, _: true */
/*jshint: browser: true */

// var s = io.connect("127.0.0.1:8888");

// var Listener = function(server) {
//   var s = io.connect(server);

//   this.socket = s;
//   this.tags = [];

//   s.on("hi", function(data) {
//     console.log("From server: " + JSON.stringify(data));
//   });
// };


var createListener = function(server) {
  function removeParams(href) {
    return href.split("?")[0];
  }

  var s = io.connect(server);
  var urlToEl = {};

  s.on("hi", function(data) {
    // console.log("From server: " + JSON.stringify(data));
  });

  s.on("change", function(data) {
    var url = data.url;
    var el = urlToEl[url];
    // Reload
    if (el) {
      // TODO: Randomize?
      var date = new Date();
      url = url + "?ts=" + encodeURIComponent(date);
      el.setAttribute("href", url);
      // console.log("change:" + url + "?ts=" + date);
    };
  });

  return {
    socket: s,
    urlToEl: urlToEl,

    // TODO: Register/unregister urls, with callbacks instead (remote
    // file watching).

    register: function(elements) {
      _.each(elements, function(e) {
        var url = removeParams(e.getAttribute("href"));
        if (url) {
          var el = urlToEl[url];
          if (!el) {
            el = urlToEl[url] = e;
          }
        }
      });

      s.emit("register", {
        urls: _.keys(urlToEl)
      });
    },

    unregister: function(elements) {
      var urls = _.map(elements, function(e) {
        return removeParams(e.getAttribute("href"));
      });

      _.each(urls, function(url) {
        delete urlToEl[url];
      });

      s.emit("unregister", {
        urls: urls
      });
    }
  };
};

$(function() {
  window.l = createListener("192.168.1.106:8888")
    .register($("link[href^='/css/rf.css']"));
});
