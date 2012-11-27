var LogIt = require('../');

describe('LogIt', function() {
  it('should expose stores', function() {
    var stores = ['console', 'file', 'mongo'];

    LogIt.should.have.property('stores');

    stores.forEach(function(store) {
      LogIt.stores.should.have.property(store);
    });
  });

  it('should have static props/methods', function() {
    LogIt.should.have.property('defaults');
    LogIt.should.have.property('setErrorStackLimit');
  });

  it('should have default logging levels', function() {
    LogIt.defaults.should.have.property('levels');
    LogIt.defaults.levels.should.have.lengthOf(4);
    LogIt.defaults.levels.should.eql(['debug', 'info', 'warn', 'error']);
  });

  describe('new LogIt()', function() {

    describe('#constructor(opts)', function() {
      it('should require a store param', function() {
        (function() {
          var log = new LogIt();
        }).should.throw(/Missing store parameter/);
      });

      it('should check for store methods: write(), clear()', function() {
        var fn, log;

        (function(){
          var log = new LogIt({ store: {} });
        }).should.throw(/Missing store methods!/);

        fn = function() {};
        log = new LogIt({ store: { write: fn, clear: fn } });
      });

      it('should have expected properties', function() {
        var log, log2, props, fn;

        fn = function() {};
        log = new LogIt({ store: { write: fn, clear: fn } });
        props = ['store', 'stream', 'needStack', 'debug', 'info', 'warn', 'error'];

        props.forEach(function(prop) {
          log.should.have.property(prop);
        });
        log.needStack.should.eql(['debug', 'error']);

        log2 = new LogIt({ store: { write: fn, clear: fn }, needStack: ['info', 'error'] });
        log2.needStack.should.eql(['info', 'error']);
      });
    });

    describe('#write(level, logData, obj)', function() {
      it('should .write() to the store', function() {
        var store, log, done;

        store = {
          write: function(obj) {
            obj.msg.should.equal('something happened');
            obj.timestamp.should.be.a('number');
            done = true;
          },
          clear: function() {}
        };

        log = new LogIt({ store: store });
        log.write('info', 'something happened');
        done.should.be.true;
      });

      it('should .write() the details and error stack when needed', function() {
        var store, store2, log, log2, done;

        store = {
          write: function(obj) {
            obj.should.have.property('details');
            obj.details.should.eql({ a: 1, b: 2});
            obj.should.have.property('errorData');
            obj.errorData.should.eql({ msg: 'Error: OMG' });
            done = 1;
          },
          clear: function() {}
        };

        log = new LogIt({ store: store });
        log.write('info', {
          msg: 'something happened',
          details: { a: 1, b: 2 }
        }, new Error('OMG'));
        done.should.eql(1);

        store2 = {
          write: function(obj) {
            obj.should.have.property('errorData');
            obj.errorData.should.have.keys(['stack', 'msg', 'method', 'path', 'line', 'pos', 'file']);
            done += 1;
          },
          clear: function() {}
        };

        log2 = new LogIt({ store: store2 });
        log2.write('info', {
          msg      : 'something happened',
          errStack : true
        }, new Error('OMG'));
        done.should.eql(2);

        // throw since the last param isn't an error, so no errStack there
        (function(){
          log2.write('error', 'OMG NO', {});
        }).should.throw();
      });

      it('should .write() the stack if level in [needStack] or logData.stack', function() {
        var store, log, done;

        done = 0;

        store = {
          write: function(obj) {
            var fields = ['stack', 'msg', 'method', 'path', 'line', 'pos', 'file']

            fields.forEach(function(field) {
              obj.should.have.property(field);
            });
            done += 1;
          },
          clear: function() {}
        };

        // by default 'debug' and 'error' require the stack automatically
        log = new LogIt({ store: store });
        log.write('error', {
          msg: 'something happened'
        });
        done.should.eql(1);

        log.write('debug', {
          msg: 'something happened'
        });
        done.should.eql(2);

        // explicitely require the stack by providing 'stack': true prop
        log.write('myCustomLevel', {
          msg   : 'something happened',
          stack : true
        });
        done.should.eql(3);

        (function() {
          log.write('myCustomLevel2', {
            msg   : 'something happened'
          });
        }).should.throw();
      });
    });

    describe('#getStackData(dataObject, optionalErrorObject)', function() {
      it('should add stack info to the data object', function() {
        var store, log, fn, data;

        fn = function() {};
        store = {
          write: fn,
          clear: fn
        };
        log = new LogIt({ store: store });
        data = {};

        (log.getStackData(data)).should.have.keys(
          ['path', 'file', 'stack', 'line', 'pos', 'method']
        );
      });

      it('should add error stack info to the data object', function() {
        var store, log, fn, data;

        fn = function() {};
        store = {
          write: fn,
          clear: fn
        };
        log = new LogIt({ store: store });
        data = {};

        (log.getStackData(data, new Error('test'))).should.have.keys(
          ['msg', 'path', 'file', 'stack', 'line', 'pos', 'method']
        );
      });
    });

    describe('#clear()', function() {
      it('should .clear() to the store', function() {
        var store, log, fn, data, done;

        fn = function() {};
        store = {
          write: fn,
          clear: function() { done = true; }
        };
        log = new LogIt({ store: store });
        log.clear();

        done.should.equal.true;
      });
    });
  });

});
