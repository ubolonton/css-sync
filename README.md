# Why

We want to shorten the feedback loop as much as possible.

Changes in edited css files are reflected immediately in browsers,
without having to refresh them. The advantages are:

-   No refresh needed. On pages where multiple steps must be performed
    to get to the state we are interested in styling, refresh is a
    huge waste of time.
-   Debug styles in multiple browsers at once. This also allows
    more collaboration.

# Setup

-   Install npm.
-   Install `socket.io` under `css-sync/`.
```bash
    npm install socket.io
```

# Usage

-   Edit `config.js` to tell the server which url should map to which
    file on disk. For example:
```javascript
    function urlToFileName(url) {
      return {
        "/css/foo.css": "/home/ubolonton/my-project/css/foo.css"
      }[url];
    }
```
-   Run the watching server
```bash
    node css-sync
```
-   Include `css-reload.js`, or copy its content to the page that needs
    to reload its css files on change, optionally specifying which css
    link elements should be watched (default to all those with relative
    URL). For example:
```javascript
    c.links = $("link[href^='/css/foo.css']");
```
-   Load the page. Anytime a css file is saved the browser will reload
    the associated css link without refreshing.

# TODO Features to be considered

-   Sync changes from browser css editors back to server (they have
    niceties, after all)?
