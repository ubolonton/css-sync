/*global: io: true, $: true, _: true */

// XXX: Remove jQuery & underscore dependencies

var css_sync = css_sync || {};

(function(io, $, _) {
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

        return this;
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

        return this;
      }
    };

    s.on("hi", function(data) {
      console.log("From server: " + JSON.stringify(data));
      listener.register(_.values(urlToEl));
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
  _.defaults(css_sync, {
    config: {
      links: [],                // css link elements whose changes we are interested in
      hostname: "",
      port: 8888
    }
  });

  // Start registering
  $(function() {
    var c = css_sync.config;
    var links = c.links;
    var host = c.hostname + ":" + c.port;

    $.extend(css_sync, {
      listener: createListener(host).register(links)
    });
  });

}(io, jQuery, _));

