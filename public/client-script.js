(function () {
  var baseUrl = 'http://localhost:3333';
  var socketScriptsrc = baseUrl + '/public/socket.io-1.3.5.js';
  var socketScript = document.createElement('script');
  socketScript.src = socketScriptsrc;
  document.head.appendChild(socketScript);

  var socketInterval = setInterval(function() {
    if (typeof window.io === 'undefined')
      return;

    clearInterval(socketInterval);
    putSocketsToWork();
  }, 100);

  function putSocketsToWork() {
    var socket = io(baseUrl);

    socket.on("push code", function(doc) {
      console.warn("Hot Pushing file", doc.filepath);
    });
  }


}());
