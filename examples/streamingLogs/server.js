var http    = require('http'),
    LogIt   = require('logit'),
    debug   = require('debug')('app'),
    connect = require('connect'),
    EventEmitter    = require('events').EventEmitter,
    emitter         = new EventEmitter(),
    port            = process.env.PORT || 8000,
    poolingInterval = process.env.INTERVAL || 5000,
    storeOpts, log, server, htmlFile;

function _getProcessData() {
  return {
    pid         : process.pid,
    memory      : process.memoryUsage(),
    uptime      : process.uptime(),
    connections : server.connections
  };
}

function sendSSE(res) {
  return function(data) {
    var id;

    debug('sending sse data to the client');

    id = (new Date()).toLocaleTimeString();
    res.write('id: ' + id + '\n');
    res.write("data: " + data + "\n\n");
  };
}

function emitLogEvent(req) {
  return function(data) {
    debug('emitting newLog event');
    req.emit('newLog', data);
  };
}

var app = connect();

// app.use(connect.logger('dev'));
app.use(connect.static('public'));
app.use(function(req, res) {
  var emitLog = emitLogEvent(req),
      sendLog = sendSSE(res);

  debug('new request: ' + req.url);

  if (req.url === '/events' && (req.headers.accept && req.headers.accept == 'text/event-stream')) {
    req.on('newLog', sendLog);
    req.on('close', function() {
      emitter.removeListener('newLog', emitLog);
      debug('closing request: ' + req.url);
    });

    res.writeHead(200, {
      'Content-Type'  : 'text/event-stream',
      'Cache-Control' : 'no-cache',
      'Connection'    : 'keep-alive'
    });

    emitter.on('newLog', emitLog);
  } else {
    res.writeHead(404);
    res.end();
  }
});
server = http.createServer(app);
server.listen(port);
console.log('Server started on port ' + port);

// LogIt setup {
log = new LogIt({
  // needs localhost MongoDB
  store: new LogIt.stores.mongo()
});

log.stream({ end: false, interval: poolingInterval }).on('data', function(obj) {
  debug('streaming data');
  emitter.emit('newLog', JSON.stringify(obj));
});
// }

// put some logs into the database every 3 seconds
setInterval(function putSomeLogs(err) {
  var now;

  debug('inserting data');

  now = (new Date()).toString();
  log.info({ msg: 'Process stats - ' + now, details: _getProcessData() });
}, 3000);
