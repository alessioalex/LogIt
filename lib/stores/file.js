// Parts of the code reused from https://github.com/visionmedia/jog licence MIT

var colors = require('colors'),
    Cls    = require('Cls'),
    fs     = require('fs'),
    path   = require('path'),
    EventEmitter = require('events').EventEmitter,
    FileStore, methods, fileExists;

fileExists = path.existsSync || fs.existsSync;

methods = {
    /**
    * Initialize a `FileStore` with the given `path`.
    *
    * @param {String} path
    * @api public
    */

    constructor: function(path) {
        if (!path) { throw new Error('#LogIt: FileStore path missing!'); }
        if (!fileExists(path)) { throw new Error('#LogIt: no such file!'); }

        this.path = path;
        this.file = fs.createWriteStream(path, { flags: 'a' });
    },

    /**
    * Add `data` to the file.
    *
    * @param {Object} data
    * @api private
    */

    write: function(data) {
        this.file.write(JSON.stringify(data) + '\n');
    },

    /**
    * Clear and invoke `cb()`.
    *
    * @param {Function} cb
    * @api private
    */
    clear: function(cb) {
        var that = this;

        fs.exists(this.path, function(exists) {
            if (!exists) { return cb(); }
            fs.unlink(that.file, fn);
        });
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
      var emitter = options.emitter || new EventEmitter
        , options = options || {}
        , buf = options.buf || ''
        , self = this
        , substr
        , obj
        , i;

      // options
      options.offset = options.offset || 0;

      // stream
      var stream = fs.createReadStream(this.path, {
        flags: 'a+',
        start: options.offset
      });

      stream.on('error', function(err) {
        console.log('Err: '.red, err);
        stream.emit('end');
      })

      stream.setEncoding('utf8');
      stream.on('data', function(chunk) {
        buf += chunk;
        options.offset += chunk.length;
        while (~(i = buf.indexOf('\n'))) {
          substr = buf.slice(0, i);
          if ('' == substr) { break; }
          obj = JSON.parse(substr);
          emitter.emit('data', obj);
          buf = buf.slice(i + 1);
        }
      });

      stream.on('end', function() {
        if (false === options.end) {
          setTimeout(function() {
            options.buf = buf;
            options.emitter = emitter;
            self.stream(options);
          }, options.interval);
        } else {
          emitter.emit('end');
        }
      });

      return emitter;
    }
};

/**
 * 'Class-ify' FileStore
 */

FileStore = Cls({
    methods: methods
});

/**
 * Expose `FileStore`.
 */

module.exports = FileStore;
