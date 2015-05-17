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
    checkForLiveUpdate();

    socket.on("push code", function(doc) {
      if (! checkForLiveUpdate())
        return;

      console.warn("Hot Pushing file", doc.filepath);
      var LiveUpdate = window.LiveUpdate;

      var filepath = doc.filepath,
          filetype = doc.filetype,
          content = doc.content,
          oldContent = doc.oldContent,
          dontEval = doc.dontEval,
          prePush = doc.prePush;

      if (!filetype || !content) {
        console.error('Invalid doc for Dispatching to LiveUpdate');
        return;
      }

      if (dontEval) {
        if (prePush) {
          return;
        }

        console.warn("First time pushing file, has to reload. It'll be hot-pushed for any further changes");
        LiveUpdate.forceRefreshPage();
        return;
      }

      console.warn("Hot pushing ", filepath);
      LiveUpdate.refreshFile({
        fileType: filetype,
        newContent: content,
        oldContent: oldContent
      });

    });
  }

  function checkForLiveUpdate() {
    if (typeof window.LiveUpdate === 'undefined') {
      console.warn("You don't have LiveUpdate installed. Please install it with `meteor add nucleuside:live-update` for hot-push");
      return false;
    }
    return true;
  }


}());
