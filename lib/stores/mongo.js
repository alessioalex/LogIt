/**
 * Module dependencies.
 */
var Db           = require('mongodb').Db,
    Connection   = require('mongodb').Connection,
    Server       = require('mongodb').Server,
    mongo        = require('mongodb'),
    colors       = require('colors'),
    Cls          = require('Cls'),
    util         = require('util'),
    debug        = require('debug')('logitMongo'),
    EventEmitter = require('events').EventEmitter,
    db, MongoStore, methods;

methods = {
  /**
   * Initialize a `MongoStore` with mongodb settings `opts` (host, port, user,
   * pass, database, collection, indexes) and optional callback `cb` that
   * gets fired after connecting to the db.
   *
   * Ex:
   *  `opts` = {
   *    host       : 'myMongoServer.com',
   *    port       : '7327',
   *    user       : 'admin',
   *    pass       : 'pwdpass',
   *    database   : 'mongodb_database',
   *    collection : 'collection_name',
   *    indexes    : '["index_field1", "index_field2"]'
   *  };
   *  `opts.database` && `opts.collection` are required
   *
   * @param {opts} Object
   * @param {cb} Function
   * @api public
   */
  constructor: function(opts, cb) {
    var that, callback, required;

    opts = opts || {};

    // set MongoDB connection details, use default opts if none provided
    this.host       = opts.host || 'localhost';
    this.port       = opts.port || Connection.DEFAULT_PORT;
    this.user       = opts.user || '';
    this.pass       = opts.pass || '';
    this.database   = opts.database   || 'logs';
    this.collection = opts.collection || 'logs';

    this._ready       = false;
    this._queue       = [];
    this._clearOnInit = false;

    that = this;

    callback = function(err) {
      if (err) { throw err; }

      debug('firing init callback');

      that._ready = true;

      // if clear() was called before db connection was established
      if (that._clearOnInit) {
        that.clear(function(err) {
          that._clearOnInit(err);

          // write from queue, but after the db was clear() -ed
          that._writeFromQueue();
        });
      } else {
        that._writeFromQueue();
      }

      // optional callback
      if (cb) { cb(); }
    }

    if (opts.indexes) { this.indexes = opts.indexes; }

    this._connect(callback);
  },

  /**
   * Clear and invoke `cb()`.
   *
   * @param {Function} cb
   * @api public
   */
  clear: function(cb) {
    cb = cb || (function() {});
    debug('deleting all previous records');

    // if the connection to the db hasn't been set already, queue up `clear`
    if (!this._ready) {
      this._clearOnInit = cb;
    } else {
      this._collection.remove(cb);
    }
  },

  /**
   * Close database connection
   *
   * @api private
   */
  close: function() {
    debug('closing db connection');
    this._db.close();
  },

  /**
   * Add `obj` to mongo and invoke `cb()` when finished.
   *
   * @param {Object} obj
   * @param {Function} cb
   * @api private
   */
  write: function(obj, cb) {
    cb = cb || function() {};

    // if the connection to the db hasn't been set already, queue up the logs
    if (!this._ready) {
      debug('pushing "' + obj.msg + '" to queue');
      return this._queue.push(obj);
    }

    debug('inserting log(s) into db');
    this._collection.insert(obj, cb);
  },

  /**
   * Write all objects that are in the queue to db
   *
   * @api private
   */
  _writeFromQueue: function() {
    var that = this;

    if (that._queue.length) {
      debug('inserting from queue' + JSON.stringify(that._queue));
      // insert the queued logs into the db
      that.write(that._queue, function(err) {
        that._queue = [];
      });
    }
  },

  /**
   * Return an `EventEmitter` which emits "data" event. It pulls data from
   * MongoDB every `opts.interval` seconds (by default it's 5 seconds).
   *
   * @param {Object} options
   * @return {EventEmitter}
   * @api private
   */
  stream: function(opts) {
    var emitter, that, when, stopStream, interval;

    opts     = opts || {};
    interval = opts.interval || 5000;
    emitter  = new EventEmitter(),
    that     = this;

    function emit(vals) {
      vals.forEach(function(val) {
        emitter.emit('data', val);
      });
    }

    function fetch() {
      if (stopStream) { return false; }

      debug('fetching new records from db');

      // find entries that are newer than the last time we checked
      that._collection.find({ timestamp: { $gt: when } }).toArray(function(err, items) {
        if (err) { return emitter.emit('error', err); }

        // only emit data and modify `when` if items found
        if (items.length) {
          emit(items);
          when = (items[items.length - 1]) ? items[items.length - 1].timestamp : Date.now();
        }
        setTimeout(fetch, opts.interval);
      });
    }

    // remember last time data was 'checked'
    when = Date.now();

    (function firstFetch() {
      setTimeout(function() {
        // being careful not to stream if the connection to the db
        // hasn't been established yet
        if (that._collection) {
          fetch();
        } else {
          firstFetch();
        }
      }, interval);
    }());

    emitter.once('stop', function() {
      stopStream = true;
      emitter.emit('end');
    });

    return emitter;
  },

  /**
   * Connect to MongoDB database, invoke `cb()` when finished.
   *
   * @param {Function} cb
   * @api private
   */
  _connect: function(callback) {
      var url, that;

      that = this;
      if (this.user && this.pass) {
        url  = 'mongodb://%s:%s@%s:%s/%s?safe=true';
        url  = util.format(url, this.user, this.pass, this.host, this.port, this.database);
      } else {
        url  = 'mongodb://%s:%s/%s?safe=true';
        url  = util.format(url, this.host, this.port, this.database);
      }

      Db.connect(url, function(err, db) {
        if (err) {
          callback(err);
        } else {
          debug('connected to db');
          that._db = db;
          that._selectCollection(function(err) {
            debug('selected collection');
            if (err) { return callback(err); }

            that._ensureIndexes(callback);
          });
        }
      });
  },

  /**
   * Select the MongoDB assigned log collection
   *
   * @param {Function} callback
   * @api private
   */
  _selectCollection: function(callback) {
    var that;

    that = this;

    this._db.collection(this.collection, function(err, collection) {
      if (!err) {
        debug('selected collection ' + that.collection);
        that._collection = collection;
      }

      callback(err);
    });
  },

  /**
   * Ensure indexes on the collection, if they exist.
   *
   * @param {Function} callback
   * @api private
   */
  _ensureIndexes: function(callback) {
    var left, done, that;

    debug('ensuring indexes');

    if (this.indexes) {
      that = this;
      left = this.indexes.length;
      done = false;

      this.indexes.forEach(function(index) {
        that._collection.ensureIndex(index, { safe: true }, function(err) {
          if (err && !done) {
            done = true;
            callback(err);
          } else if (!done) {
            if (!--left) {
              done = true;
              debug('ensured indexes');
              callback();
            }
          }
        });
      });
    } else {
      callback();
    }
  }
};

/**
 * 'Class-ify' MongoStore
 */
MongoStore = Cls({
  methods: methods
});

/**
 * Expose `MongoStore`.
 */
module.exports = MongoStore;
