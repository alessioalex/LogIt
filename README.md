     __                      ______   __
    /\ \                    /\__  _\ /\ \__
    \ \ \        ___      __\/_/\ \/ \ \ ,_\
     \ \ \  __  / __`\  /'_ `\ \ \ \  \ \ \/
      \ \ \L\ \/\ \L\ \/\ \L\ \ \_\ \__\ \ \_
       \ \____/\ \____/\ \____ \/\_____\\ \__\
        \/___/  \/___/  \/___L\ \/_____/ \/__/
                          /\____/
                          \_/__/

  Node.js JSON logging module with multiple stores, inspired by [Jog](https://github.com/visionmedia/jog) & [Tracer](https://github.com/baryon/tracer).

## Installation

    $ npm install logit

## Features

  - json logging
  - customizable log levels, default levels are: info, warn, debug, error
  - multiple stores: console, file, MongoDB
  - realtime document streaming
  - error stacktrace
  - current line stacktrace

## Usage

### Writing logs - log.write(level, loggingData[, errorObj])

  Write to the logs:

```js
log.write(level, loggingData[, errorObj]);
log.debug(loggingData[, errorObj]);
log.info(loggingData[, errorObj]);
log.warn(loggingData[, errorObj]);
log.error(loggingData[, errorObj]);
```
  `loggingData` can be either:

  a) {String} containing the message to log
  b) {Object} with logging settings (the message is mandatory, the rest of the settings are optional):
  - details {Object}   = Put whatever you want here
  - msg {String}       = Log message
  - stack {Boolean}    = If the call stack should be logged or not (will log the following props: ['stack', 'method', 'path', 'line', 'pos', 'file']). By default this option is enabled for the `debug` and `error` levels.
  - errStack {Boolean} = Similar to the above, use this if you also want the stacktrace of the error also. The stack props will be logged to the `errorData` property. By default it's disabled for all logging levels.

  `errorObj` contains the error you want to log. By default only the message will be logged to the `errorData`. If you want the stacktrace of the error to be also logged, look at the `errStack` property above.

  Basic example:

```js
var LogIt = require('logit'),
    log   = LogIt({ store: new log.stores.file('/tmp/it.log') });

log.info('Server started on port 8080');
// same as: log.write('info', 'Server started on port 8080');

// custom logging level
log.write('memoryUsage', process.memoryUsage().rss);
```

  By default there are 4 logging levels (info, warn, debug, error) but you can change that easily:

```js
var LogIt = require('logit'),
    log   = LogIt({ store: new log.stores.file('/tmp/it.log') }),
    // creating logit instance with custom levels
    log2  = LogIt({ levels: ['panic', 'forFun'] }, { store: new log.stores.file('/tmp/it2.log') });

log.warn('there is a memory spike happening now');
log.error('something bad happened while saving to db', new Error('dbfail'));

log2.panic('what am I going to do? :-s');
log2.forFun('tic');
```

  When want to log other details besides the message, use the 'details' property:

```js
var LogIt = require('logit'),
    log = LogIt({ store: new log.stores.file('/tmp/it.log') });

var user = { id: '14421', name: 'John Doe', username: 'johndoe' };

// log the message, along with the user object
log.info({ msg: 'login', details: user });
```

  Log the call stack && the error stacktrace:

```js
var LogIt = require('logit'),
    log = LogIt({ store: new log.stores.file('/tmp/it.log') });

// ... somewhere deep in your code

// log the call stack for the following line, as well as the stacktrace for the error
// the call stack is automatically logged for 'error' and 'debug' levels
// if you want to use another level/custom level and you need the call stack can pass `stack: true`
log.error({
  msg      : 'Something happened when saving item to db.',
  errStack : true,
  details  : {
    node      : 'Saturn',
    processId : '1000'
  }
}, err);
```

  The above log would look something like this:

```js
{
  level  : 'error',
  msg    : 'memory usage',
  stack: [
    '    at Timer.<anonymous> (/home/youruser/www/appfolder/server.js:14:7)',
    '    at Timer.exports.setInterval.timer.ontimeout (timers.js:234:14)'
  ],
  method : 'Timer.<anonymous>',
  path   : '/home/youruser/www/appfolder/server.js',
  line   : '14',
  pos    : '7',
  file   : 'server.js',
  errorData: {
    stack  : [
      '    at Timer.<anonymous> (/home/youruser/www/appfolder/server.js:14:54)',
      '    at Timer.exports.setInterval.timer.ontimeout (timers.js:234:14)'
    ],
    msg    : 'Error: DB_ERR 102 - Weird desc here',
    method : 'Timer.<anonymous>',
    path   : '/home/youruser/www/appfolder/server.js',
    line   : '14',
    pos    : '54',
    file   : 'server.js'
  },
  details  : {
    node      : 'Saturn',
    processId : '1000'
  },
  timestamp: 1354024190645
}
```

### Streaming logs - log.stream(options)

  Stream the logs if the store supports it.

```js
// Note: you can log messages on your server and setup the stream elsewhere
// you don't need to log and stream from the same instance, just the database
// connection details must be the same
log = new LogIt({
  store: new LogIt.stores.mongo()
});

// log memory usage every second
setInterval(function() {
  log.info({ msg: 'memory usage', details: process.memoryUsage() });
}, 1000);

// streaming logs every second
log.stream({ interval: 1000 }).on('data', function(data) {
  var currentRss;

  currentRss = parseInt(data.details.rss, 10);
  if (currentRss !== lastKnownRss) {
    console.log('rss', currentRss);
    lastKnownRss = currentRss;
  }
});
```

### More

  If you want to find out more about this module, look in the tests and example folders.

## Running Tests

  To run the test suite first invoke the following command within the repo, installing the development dependencies:

    $ npm install

  ..and make sure you have MongoDB running on localhost so that the MongoStore can be tested:

    $ sudo mongod

  ..then run the tests:

    $ npm test

## License

>(The MIT License)
>
>Copyright (c) 2012 Alexandru Vl&#259;du&#355;u &lt;alexandru.vladutu@gmail.com&gt;
>
>Permission is hereby granted, free of charge, to any person obtaining
>a copy of this software and associated documentation files (the
>'Software'), to deal in the Software without restriction, including
>without limitation the rights to use, copy, modify, merge, publish,
>distribute, sublicense, and/or sell copies of the Software, and to
>permit persons to whom the Software is furnished to do so, subject to
>the following conditions:
>
>The above copyright notice and this permission notice shall be
>included in all copies or substantial portions of the Software.
>
>THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND,
>EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
>MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
>IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY
>CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT,
>TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
>SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
