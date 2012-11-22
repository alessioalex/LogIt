// Parts of the code reused from https://github.com/visionmedia/jog licence MIT

var colors = require('colors'),
    Cls    = require('Cls'),
    fs     = require('fs'),
    path   = require('path'),
    EventEmitter = require('events').EventEmitter,
    FileStore, methods;

methods = {
  /**
  * Initialize a `FileStore` with the given `path`. If file doesn't exist it's
  * created automatically.
  *
  * @param {String} path
  * @api public
  */
  constructor: function(path) {
    if (!path) { throw new Error('#LogIt: FileStore path missing!'); }

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
  * @api public
  */
  clear: function(cb) {
    var that = this;

    fs.exists(that.path, function(exists) {
      if (!exists) { return cb(); }
      fs.unlink(that.path, cb);
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
    var options    = options || {},
        emitter    = options.emitter || new EventEmitter,
        buf        = options.buf || '',
        that       = this,
        stopStream = false,
        substr, obj, i;

    // options
    options.offset = options.offset || 0;

    // stream
    var stream = fs.createReadStream(this.path, {
      flags: 'a+',
      start: options.offset
    });

    stream.on('error', function(err) {
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

    stream.on('end', function(stopped) {
      if (stopped) {
        emitter.emit('end');
        stopStream = true;
        return;
      } else if (options.end === false) {
        emitter.removeAllListeners('stop');
        emitter.on('stop', onStopStream);
        setTimeout(function() {
          options.buf = buf;
          options.emitter = emitter;
          if (!stopStream) { that.stream(options); }
        }, options.interval);
      } else {
        emitter.emit('end');
      }
    });

    function onStopStream() {
      stream.emit('end', true);
    }

    emitter.on('stop', onStopStream);

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
