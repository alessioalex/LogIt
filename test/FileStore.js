var LogIt = require('../'),
    fs    = require('fs');

describe('FileStore', function() {
  var tmpFile = new LogIt.stores.file('/tmp/logit_' + Date.now() + '.log');
  require('./shared/Store')(tmpFile);

  describe('#clear()', function() {
    it('should .clear() the logs from the file', function(done) {
      var store, log, path;

      path  = '/tmp/logit2_' + Date.now() + '.log';
      store = new LogIt.stores.file(path);
      log   = new LogIt({ store: store });

      log.info('test1');
      log.warn('test2');

      setTimeout(function() {
        log.clear(function(err) {
          if (err) { throw err; }

          fs.exists(path, function(exists) {
            exists.should.be.false;
            done();
          });
        });
      }, 750);
    });
  });
});
