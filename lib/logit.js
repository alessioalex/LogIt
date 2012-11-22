var Cls    = require('Cls'),
    moment = require('moment'),
    colors = require('colors'),
    _      = require('underscore'),
    LogIt, statics, methods, stores;

/**
 * 'Class' static methods
 */
statics = {
  /**
   * Default log levels, they can be overridden in the `LogIt` constructor
   */
  defaults: {
    levels: ['debug', 'info', 'warn', 'error']
  },

  /**
   * Customize the stack trace limit (globally in your app).
   * By default that limit is set to 10.
   *
   * @param {Number} limit
   * @api public
   */
  setErrorStackLimit: function(limit) {
    Error.stackTraceLimit = limit;
  }
};

/**
 * Include all the logging stores
 */
stores = {};
['console', 'file', 'mongo'].forEach(function(store) {
  stores[store] = require('./stores/' + store);
});
statics.stores = stores;

/**
 * 'Instance' methods
 */
methods = {
  /**
   * opts = { dateformat, store, stacktrace depth, levels }
   */

  /**
   * Initialize a `LogIt` with an `opts` object, containing the `store`,
   * optional params:
   * - {Array} `levels` (that override the default ones, info, debug, error, warn)
   * - {Array} `needStack` (to determine which levels need the stack to be logged)
   *
   * @param {Object} opts
   * @api public
   */
  constructor: function(opts) {
    var levels, that;

    that           = this;
    opts           = opts || {};

    // Make sure a proper store has been passed in
    if (!opts.store) { throw new Error("#LogIt: Missing store parameter!"); }
    if (!opts.store.write || !opts.store.clear) {
      throw new Error('#LogIt: Missing store methods!');
    }

    this.store     = opts.store;
    this.stream    = (this.store.stream) ? _.bind(this.store.stream, this.store) : false;
    this.needStack = opts.needStack || ['debug', 'error'];
    levels         = opts.levels || LogIt.defaults.levels;

    levels.forEach(function(level) {
      that[level] = function(logData, obj) {
        that.write(level, logData, obj);
      };
    });
  },

  /**
   * Log data to the store, using a logging `level`, a `logData` string message
   * and an optional error `obj`.
   *
   * `logData` can be an object also, with the (optional) keys `stack`
   * (to override the 'global' level stack inclusion) and `errStack`
   * (to also include the error stack, not only the stack trace generated
   * by LogIt).
   * If `errStack` isn't set, only the error message will be logged.
   *
   * @param {String} level
   * @param {String} OR {Object} logData
   * @param {Object} errorObject
   * @api private
   */
  write: function(level, logData, errorObject) {
    var data, isError, stack;

    data = { level: level };

    if (typeof logData === 'object') {
      data.msg = logData.msg;
    } else {
      // logData is a string, a message
      data.msg = logData;
    }

    if (logData.stack || (this.needStack.indexOf(level) > -1)) {
      data = this.getStackData(data);
    }

    isError = errorObject && (errorObject instanceof Error);

    if (logData.errStack && isError) {
      data.errorData = this.getStackData({}, errorObject);
    } else if (isError) {
      // only store the error message
      data.errorData = {
        msg: errorObject.toString()
      };
    }
    if (logData.details) { data.details = logData.details; }

    // implicit timestamp
    data.timestamp = Date.now();

    this.store.write(data);
  },

  /**
   * Called with logging `data`, which it will enhance with the stack trace
   * data (or error stack trace) and return.
   *
   * @param {Object} data
   * @param {Object} customErr
   * @api private
   */
  getStackData: function(data, customErr) {
    var errObj, s, sp, paths;

    // get call stack, and analyze it
    // get all file,method and line number
    if (customErr) {
      data.stack = customErr.stack.split('\n');
      data.msg = data.stack.shift();
    } else {
      data.stack = new Error().stack.split('\n').slice(4);
    }

    // Stack trace format :
    // http://code.google.com/p/v8/wiki/JavaScriptStackTraceApi
    s = data.stack[0];
    sp = /at\s+(.*)\s+\((.*):(\d*):(\d*)\)/gi.exec(s) || /at\s+()(.*):(\d*):(\d*)/gi.exec(s);

    if (sp && sp.length) {
      data.method = sp[1];
      data.path   = sp[2];
      data.line   = sp[3];
      data.pos    = sp[4];
      paths       = data.path.split('/');
      data.file   = paths[paths.length - 1];
    }

    return data;
  },

  /**
   * Clear and invoke callback function.
   *
   * @param {Function} callback
   * @api public
   */
  clear: function(callback) {
    this.store.clear(callback);
  }
};

/**
 * 'Class-ify' LogIt
 */
LogIt = Cls({
  methods : methods,
  statics : statics
});

/**
 * Expose `LogIt`.
 */
module.exports = LogIt;
