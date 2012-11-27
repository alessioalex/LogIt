var LogIt        = require('../'),
    Db           = require('mongodb').Db,
    Connection   = require('mongodb').Connection,
    Server       = require('mongodb').Server,
    mongo        = require('mongodb'),
    port         = Connection.DEFAULT_PORT;

describe('MongoStore', function() {
  var store = new LogIt.stores.mongo();

  require('./shared/Store')(store);

  describe('#clear()', function() {
    it('should .clear() the logs from the db', function(done) {
      var log = new LogIt({ store: store });

      log.info('test1');
      log.info('test2');

      setTimeout(function() {
        log.clear(function(err) {
          if (err) { throw err; }

          Db.connect('mongodb://localhost:' + port + '/logs?safe=true', function(err, db) {
            if (err) { throw err; }

            db.collection('logs', function(err, collection) {
              if (err) { throw err; }

              collection.find({}).toArray(function(err, docs) {
                docs.length.should.equal(0);
                done();
              });
            });
          });
        });
      }, 2000);
    });

    // TODO: make sure that clear isn't called before 'ready'
    // once('ready', ..)
    // log.clear(function() );
    // log.store._collection.find({}, function(err,items) {});
  });
});
