/*global: io: true, $: true */

// XXX: Remove jQuery dependency

var css_sync = css_sync || {};

(function($) {
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

  var createListener = function(server) {
    function removeParams(href) {
      return href.split("?")[0];
    }

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
      console.log("From server: " + JSON.stringify(data));
      listener.register(values(urlToEl));
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
      }
    });

    return listener;
  };

  $.extend(css_sync, {
    createListener: createListener
  });
  css_sync.config = $.extend({
    links: [],                // css link elements whose changes we are interested in
    hostname: "",
    port: 8888
  }, css_sync.config);

  // Start registering
  $(function() {
    var c = css_sync.config;
    var links = c.links;
    var host = c.hostname + ":" + c.port;

    $.extend(css_sync, {
      listener: createListener(host).register(links)
    });
  });

}(jQuery));

