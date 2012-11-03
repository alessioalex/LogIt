var colors = require('colors'),
    Cls    = require('Cls'),
    fs     = require('fs'),
    ConsoleStore, methods;

methods = {
    /**
    * Initialize a `ConsoleStore` with an optional `colors` object.
    *
    * @param {Object} colors
    * @api public
    */
    constructor: function(colors) {
        this.colors = colors || {
            error   : 'red',
            warn    : 'red',
            info    : 'green',
            debug   : 'yellow',
            default : 'white'
        };
    },

    /**
    * Log the `data` to the console.
    *
    * @param {Object} obj
    * @api private
    */

    write: function(data) {
        var color = this.colors[data.level] || this.colors.default;
        console.log(JSON.stringify(data)[color]);
        console.log('=========================');
    },

    /**
    * Clear the console.
    *
    * @api private
    */

    clear: function() {
        console.log('\033[2J');
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
