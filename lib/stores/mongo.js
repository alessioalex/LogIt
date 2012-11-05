var Db       = require('mongodb').Db,
    Connection = require('mongodb').Connection,
    Server     = require('mongodb').Server,
    mongo      = require('mongodb'),
    colors     = require('colors'),
    Cls        = require('cls'),
    util       = require('util'),
    debug      = require('debug')('logitMongo'),
    EventEmitter = require('events').EventEmitter,
    db, MongoStore, methods;

methods = {
    constructor: function(opts, cb) {
        var that, callback, required;

        this.host   = opts.host || 'localhost';
        this.port   = opts.port || Connection.DEFAULT_PORT;
        this.user   = opts.user || '';
        this.pass   = opts.pass || '';
        this._queue = [];
        this._ready = false;

        that = this;
        callback = function(err) {
            if (err) { throw err; }

            debug('firing init callback');

            that._ready = true;
            if (that._queue.length) {
                // insert the queued logs into the db
                that.write(that._queue, function(err) {
                    that._queue = [];
                });
            }

            // optional callback
            if (cb) { cb(); }
        }

        required = ['collection', 'database'];

        required.forEach(function(param) {
            if (!opts[param]) {
                throw new Error('#LogIt: Missing ' + param + ' parameter!');
            } else {
                that[param] = opts[param];
            }
        });

        if (opts.indexes) { this.indexes = opts.indexes; }

        this._connect(callback);
    },
    clear: function(cb) {
        debug('deleting all previous records');
        this._collection.remove(cb);
    },
    close: function() {
        debug('closing db connection');
        this._db.close();
    },
    write: function(obj, cb) {
        cb = cb || function() {};

        if (!this._ready) {
            debug('pushing "' + obj.msg + '" to queue');
            return this._queue.push(obj);
        }

        debug('inserting log(s) into db');
        this._collection.insert(obj, cb);
    },
    stream: function(opts) {
        var emitter, that, when;

        emitter = new EventEmitter(),
        opts = opts || {};
        interval = opts.interval || 5000;
        that = this;

        function emit(vals) {
            vals.forEach(function(val) {
                emitter.emit('data', val);
            });
        }

        function fetch() {
            that._collection.find({ timestamp: { $gt: when } }).toArray(function(err, items) {
                if (err) { return emitter.emit('error', err); }

                emit(items);
                when = (items[items.length - 1]) ? items[items.length - 1].timestamp : Date.now();
                setTimeout(fetch, opts.interval);
            });
        }

        // remember last time data was 'checked'
        when = Date.now();

        setTimeout(function() {
            fetch();
        }, interval);

        return emitter;
    },
    _connect: function(callback) {
        var url, that;

        that = this;
        url  = 'mongodb://%s:%s@%s:%s/%s?safe=true';
        url  = util.format(url, this.user, this.pass, this.host, this.port, this.database);

        Db.connect(url, function(err, db) {
            if (err) {
                callback(err);
            } else {
                debug('connected to db');
                that._db = db;
                that._selectCollection(function(err) {
                    if (err) { return callback(err); }

                    that._ensureIndexes(callback);
                });
            }
        });
    },
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
    _ensureIndexes: function(callback) {
        var left, done, that;

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
    }
};

MongoStore = Cls({
    methods: methods
});

module.exports = MongoStore;
