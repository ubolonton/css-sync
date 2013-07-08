/*jshint: browser: true */

// Include this file in, or copy its content into the page. This is
// the bootstrapping script that contains config, and loads the main
// client script from the watcher server. For convenience it also
// tries to sensibly guess the default location of the watcher server
// (this can be overridden).

var css_sync = css_sync || {};

(function(location, document) {
  // Put configuration here
  var c = css_sync.config = css_sync.config || {
    "port": 8888
  };
  // Host name & port of the watching server
  c.hostname = (!location.hostname || location.hostname == "localhost" ?
                "127.0.0.1" :
                location.hostname);
  // Link elements to watch, (default to watching all css links with relative url
  // c.links = $("link[href^='/css/rf.css']").toArray();

  // Load the main client
  document.onload = function() {
    var el = document.createElement("script");
    el.setAttribute("type", "text/javascript");
    el.setAttribute("src", "http://" + c.hostname + ":" + c.port + "/css-sync-client.js");
    document.body.appendChild(el);
  };
}(window.location, window.document));
