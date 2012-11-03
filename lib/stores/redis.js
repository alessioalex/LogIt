// Parts of the code reused from https://github.com/visionmedia/jog licence MIT

/**
 * Module dependencies.
 */

var EventEmitter = require('events').EventEmitter,
    redis        = require('redis'),
    Cls          = require('Cls'),
    RedisStore, methods;

methods = {
    /**
     * Initialize a `RedisStore` with optional `client` and `key`.
     *
     * @param {RedisClient} client
     * @param {String} key
     * @api public
     */

    constructor: function(client, key) {
        this.db = client || redis.createClient();
        this.key = key || 'jog';
        this.rangeSize = 300;
    },

    /**
     * Add `obj` to redis.
     *
     * @param {Object} obj
     * @api private
     */

    write: function(obj) {
      this.db.rpush(this.key, JSON.stringify(obj));
    },

    /**
     * Clear and invoke `fn()`.
     *
     * @param {Function} fn
     * @api private
     */

    clear: function(fn) {
      this.db.del(this.key, fn);
    },

    /**
     * Return an `EventEmitter` which emits "data"
     * and "end" events.
     *
     * @param {Object} options
     * @return {EventEmitter}
     * @api private
     */

    stream: function(options) {
      var emitter = new EventEmitter
        , options = options || {}
        , size = this.rangeSize
        , key = this.key
        , db = this.db
        , self = this
        , start = 0;

      function emit(vals) {
        vals.forEach(function(val){
          emitter.emit('data', JSON.parse(val));
        });
      }

      function fetch() {
        var stop = start + size;
        db.lrange(key, start, stop, function(err, vals) {
          if (err) { return emitter.emit('error', err); }
          emit(vals);
          start += vals.length;
          if (false === options.end) {
            setTimeout(fetch, options.interval);
          } else {
            if (vals.length) { return fetch(); }
            else { emitter.emit('end'); }
          }
        });
      }

      fetch();

      return emitter;
    }
};

/**
 * 'Class-ify' RedisStore
 */

RedisStore = Cls({
    methods: methods
});

/**
 * Expose `RedisStore`.
 */

module.exports = RedisStore;
