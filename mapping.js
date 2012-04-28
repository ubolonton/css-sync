module.exports.urlToFileName = urlToFileName;

function urlToFileName(url) {
  return {
    // Custom mapping here
    "/css/rf.css": "/home/ubolonton/Programming/cogini/bidandbuy-vagrant/bidandbuy/web/html/css/rf.css"
  }[url];
}

