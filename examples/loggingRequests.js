var http   = require('http'),
    LogIt  = require('logit'),
    util   = require('util'),
    format = util.format,
    port   = (process.env.PORT || process.argv[2]) || 8080,
    env    = process.env.NODE_ENV || 'development',
    log, logFile;

// boot logit
logFile = '/tmp/logit' + Date.now() + '.log';
log     = new LogIt({ store: new LogIt.stores.file(logFile) });

function logRequest(log, req) {
  var method, ip, logMessage, time;

  ip         = req.connection.remoteAddress;
  method     = req.method;
  url        = req.url;
  time       = (new Date()).toString();

  logMessage = format('%s - [%s] "%s %s HTTP/1.1" 200', ip, time, method, url);

  // log incoming requests with custom level `request` and message `logMessage`
  log.write('request', logMessage);
}

// start the server
http.createServer(function(req, res) {
  res.writeHead(200, { 'Content-Type': 'text/html' });
  res.end('<h1>Hello there, your ip is ' + req.connection.remoteAddress + '</h1>');
  logRequest(log, req);
}).listen(port);

console.log('Server running on port ' + port);
console.log("logit will write logs to file '%s'", logFile);
console.log('------------------------------------------------------------');
console.log('Make some CURL requests to the server to see this in action:');
console.log('curl http://localhost:%s/index.html', port);
console.log('curl --data "param1=val" http://localhost:%s/postRequest', port);
console.log('------------------------------------------------------------');

// if you run the server in development mode you can
// tail the logs to the console
if (env === 'development') {
  log.stream({ end: false, interval: 1000 }).on('data', function(data) {
    console.log(data.msg);
  });
}
