var watch = require('watch'),
    fs = require('fs'),
    path = require('path'),
    http = require('http');


var Watcher = function(url) {
  this.url = {
    url: url + '/hotload',
    host: url.replace(/https?:\/\//, '').split(':')[0],
    port: url.replace(/https?:\/\//, '').split(':')[1] || 80,
    path: '/hotload'
  };
  this.monitorOptions = {
    'ignoreDotFiles': true,
    'ignoreUnreadableDir': true
  };

  this.initialize();
};


Watcher.prototype.initialize = function() {
  var dir = path.resolve("./"),
      self = this;

  watch.createMonitor(dir, this.monitorOptions, function(monitor) {
    console.log("meteor-hot-loader watching in", dir);

    monitor.on('changed', function(file) {
      self.handleFileChange(file);
    });

    monitor.on('created', function(file) {
      self.handleFileChange(file);
    });

    monitor.on('removed', function(file) {
      self.handleFileChange(file, {removed: true});
    });
  });
};

Watcher.prototype.handleFileChange = function(file, options) {
  options = options || {};

  var content,
      url = this.url,
      type = file.split('.').reverse()[0];

  if (!! options.removed)
    content = '';
  else
    content = fs.readFileSync(file, 'utf-8');

  var data = {
    path: file,
    type: type,
    content: content
  };

  this.pushCode(data);
};

Watcher.prototype.pushCode = function(data) {
  var dataString = JSON.stringify(data);
  var headers = {
    'Content-Type': 'application/json',
    'Content-Length': dataString.length
  };
  var options = {
    host: this.url.host,
    port: this.url.port,
    path: this.url.path,
    method: 'POST',
    headers: headers
  };

  var req = http.request(options, function(res) {
    res.setEncoding('utf-8');

    var responseString = '';

    res.on('data', function(data) {
      responseString += data;
    });

    res.on('end', function() {
      var res = JSON.parse(responseString);
      if (res.status === 'success') {
        console.log("Hot-Pushed", data.path);
      }
    });
  });

  req.on('error', function(e) {
    console.error("Hot push failed", e.message);
  });

  req.write(dataString);
  req.end();
};

module.exports = Watcher;
