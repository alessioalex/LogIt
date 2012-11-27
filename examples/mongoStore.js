var LogIt = require('../'),
    log, stream, lastKnownRss;

lastKnownRss = 0;

// by default MongoStore will connect to localhost
// db 'logs' and collection 'logs'
log = new LogIt({
  store: new LogIt.stores.mongo()
});

// log memory usage every second
setInterval(function() {
  log.info({ msg: 'memory usage', details: process.memoryUsage() });
}, 1000);

// streaming logs every second
log.stream({ interval: 1000 }).on('data', function(data) {
  var currentRss;

  currentRss = parseInt(data.details.rss, 10);
  if (currentRss !== lastKnownRss) {
    console.log('rss', currentRss);
    lastKnownRss = currentRss;
  }
});

// clear the db every minute
setInterval(function() {
  log.clear();
}, 60000);
