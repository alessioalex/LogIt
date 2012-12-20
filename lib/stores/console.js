var colors = require('colors'),
    Cls    = require('Cls'),
    fs     = require('fs'),
    util   = require('util'),
    ConsoleStore, methods;

methods = {
  /**
  * Initialize a `ConsoleStore` with an optional `colors` object.
  *
  * @param {Object} colors
  * @api public
  */
  constructor: function(colors, separator) {
    this.colors = colors || {
      error   : 'red',
      warn    : 'red',
      info    : 'green',
      debug   : 'yellow',
      default : 'white'
    };
    this.separator = separator || '=========================';
  },

  /**
  * Log the `data` to the console.
  *
  * @param {Object} obj
  * @api private
  */
  write: function(data) {
    var color = this.colors[data.level] || this.colors.default;
    process.stdout.write(util.inspect(data, false, null)[color] + '\n');
    // console.log(JSON.stringify(data)[color]);
    console.log(this.separator);
  },

  /**
  * Clear the console.
  *
  * @api public
  */
  clear: function() {
    process.stdout.write('\033[2J');
  }
};

/**
 * 'Class-ify' ConsoleStore
 */
ConsoleStore = Cls({
  methods: methods
});

/**
 * Expose `ConsoleStore`.
 */
module.exports = ConsoleStore;
