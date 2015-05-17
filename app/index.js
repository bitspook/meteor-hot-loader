var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var bodyParser = require('body-parser');
var HotLoaderColl = require('./db').HotLoaderColl;
var baseDir = __dirname ;

app.use(bodyParser.json()); // support json encoded bodies
app.use(bodyParser.urlencoded({ extended: true })); // support encoded bodies

app.use('/public', express.static(baseDir + '/public'));

app.get('/', function(req, res) {
  res.sendFile("dispatcher.js", {root: baseDir + "/public"});
});
app.get('/meteor-hot-loader-running', function(req, res) {
  res.header({"Access-Control-Allow-Origin": "*"});
  res.status(200);
  res.send(JSON.stringify({status: "running"}));
});

app.post('/hotload', function(req, res) {
  var filepath = req.body.path,
      filetype = req.body.type,
      filecontent = req.body.content,
      oldContent = req.body.oldContent || '',
      prePush = req.body.prePush || false;

  if (!(filepath && filetype && filecontent)) {
    sendFailed(res);
  }

  HotLoaderColl.findOne({filepath: filepath}, function(err, doc) {
    if (err) {
      console.error(err.message);
      return;
    }

    var savedOldContent = doc ? doc.content : null;
    oldContent = !!oldContent ? oldContent : savedOldContent;

    try {
      if (!doc) {
        HotLoaderColl.insert({
          filepath: filepath,
          filetype: filetype,
          content: filecontent,
          oldContent: oldContent,
          createdAt: new Date(),
          updatedAt: new Date().getTime(),
          dontEval: filetype === 'js' ? true : false, //old content is required for js files only
          prePush: prePush
        }, function(err, doc) {
          if(err) sendFailed(res);

          sendSuccess(res, doc);
        });
      } else {
        var updates = {
          content: filecontent,
          oldContent: oldContent,
          updatedAt: new Date().getTime(),
          dontEval: false,
          prePush: prePush
        };

        HotLoaderColl.updateById(doc._id, {$set: updates}, function(err, count) {
          if(err) sendFailed(res);
          HotLoaderColl.findOne({_id: doc._id}, function(err, doc) {
            sendSuccess(res, doc);
          });
        });
      }
    } catch(e) {
      console.error(e.message);
      sendError(res);
    }
  });
});

var responses = {
  success: {status: "success"},
  invalid: {status: "invalid", message: "Must have path, type, content" },
  error: {status: "failed", message: "Something went wrong on server. Please resend the request"}
};

var sendFailed = function(res) {
  res.status(400);
  res.send(JSON.stringify(responses.invalid));
};

var sendSuccess = function(res, doc) {
  if (doc) {
    Sockets.pushDoc(doc);
  }

  res.status(200);
  res.send(JSON.stringify(responses.success));
};

var sendError = function(res) {
  res.status(500);
  res.end(responses.error);
};

io.on('connection', function(socket) {
  console.log("A CLIENT CONNECTED");
});

var Sockets = {
  pushDoc: function(doc) {
    io.emit('push code', doc);
  }
};

module.exports = http;
