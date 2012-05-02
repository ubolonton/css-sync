/*global: io: true, window: true */

// This file, and socket.io.js are served by the watching server

var css_sync = css_sync || {};

(function(document) {
  // Quick, dirty & incorrect functions to avoid depending on underscore
  function keys(obj) {
    var ks = [];
    for (var key in obj) {
      if (obj.hasOwnProperty(key))
        ks.push(key);
    }
    return ks;
  }
  function values(obj) {
    var vs = [];
    for (var key in obj) {
      if (obj.hasOwnProperty(key))
        vs.push(obj[key]);
    }
    return vs;
  }

  // TODO: Randomize?
  function addReloadParam(url) {
    return url + "?css_sync_ts=" + encodeURIComponent(new Date());
  }

  function removeParams(href) {
    return href.split("?")[0];
  }

  // FIX: Something more sensible
  function getRelativeCssLinks() {
    var all = document.getElementsByTagName("link");
    var links = [];
    for (var i = 0; i < all.length; i++) {
      var el = all[i];
      if (el.getAttribute("rel") === "stylesheet" &&
          el.getAttribute("type") === "text/css" &&
          el.getAttribute("href").search("http") !== 0) {
        links.push(el);
      }
    }
    return links;
  }

  var createListener = function(server) {
    var s = io.connect(server);
    var urlToEl = {};

    var listener = {
      socket: s,
      urlToEl: urlToEl,

      // TODO: Register/unregister urls, with callbacks instead (remote
      // file watching).

      register: function(elements) {
        for (var i = 0; i < elements.length; i++) {
          var url = removeParams(elements[i].getAttribute("href"));
          if (url) {
            var el = urlToEl[url];
            if (!el) {
              el = urlToEl[url] = elements[i];
            }
          }
        }

        s.emit("register", {
          urls: keys(urlToEl)
        });

        return this;
      },

      unregister: function(elements) {
        var urls = [];
        var i;
        for (i = 0; i < elements.length; i++) {
          urls.push(removeParams(elements[i].getAttribute("href")));
        }

        for (i = 0; i < urls.length; i++) {
          delete urlToEl[urls[i]];
        }

        s.emit("unregister", {
          urls: urls
        });

        return this;
      }
    };

    s.on("hi", function(data) {
      if (console && console.log)
        console.log("From server: " + JSON.stringify(data));
      listener.register(values(urlToEl));
    });

    s.on("change", function(data) {
      var url = data.url;
      var el = urlToEl[url];
      // Reload
      if (el)
        el.setAttribute("href", addReloadParam(url));
    });

    return listener;
  };

  css_sync.createListener = createListener;

  // Default config
  var c = css_sync.config = css_sync.config || {};
  // TODO: default to watching all css links with relative url
  var links = c.links = c.links || getRelativeCssLinks(); // css link elements whose changes we are interested in
  var port = c.port = c.port || 8888;
  // FIX: duplicated code in css-reload.js
  var hostname = c.hostname = (
    !c.hostname || c.hostname === "localhost" ?
      "127.0.0.1" :             // default to 127.0.0.1 if no sensible host name is specified
      c.hostname
  );

  var host = hostname + ":" + port;

  // Load socket.io, then create a listener
  function loadJS(src, callback) {
    // Create script tag
    var el = document.createElement("script");
    el.setAttribute("type", "text/javascript");
    el.setAttribute("src", src);

    // Register callback
    el.onload = callback;
    el.onreadystatechange = function() {
      if (["complete", "loaded"].indexOf(this.readyState) > -1)
        callback();
    };

    // Add the tag to <head></head>
    document.head.appendChild(el);
  }
  loadJS("http://" + host + "/socket.io/socket.io.js", function() {
    css_sync.listener = createListener(host).register(links);
  });

}(window.document));

