/*jshint: browser: true */

// Include this file in, or copy its content into the page

var css_sync = css_sync || {};

(function() {
  // Put configuration here
  var c = css_sync.config = css_sync.config || {};
  // Host name & port of the watching server
  c.hostname = location.hostname == "localhost" ? "127.0.0.1" : location.hostname,
  c.port = 8888;
  // Link elements to watch, (default to watching all css links with relative url
  // c.links = $("link[href^='/css/rf.css']").toArray();

  // Load css-sync-client
  var el = document.createElement("script");
  el.setAttribute("type", "text/javascript");
  el.setAttribute("src", "http://" + c.hostname + ":" + c.port + "/css-sync-client.js");
  document.getElementsByTagName("body")[0].appendChild(el);
}());
