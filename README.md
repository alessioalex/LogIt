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
  - customizable log levels
  - multiple stores: console, file, MongoDB
  - realtime document streaming
  - error stacktrace
  - current line stacktrace

## API

### log.write(level, loggingData, optionalErrorObject)

  Basic example:

```js
var LogIt = require('logit'),
    log = LogIt({ store: new log.stores.file('/tmp/it.log') });

log.info('Server started on port 8080');
// same as: log.write('info', 'Server started on port 8080');

// custom logging level
log.write('memoryUsage', process.memoryUsage().rss);
```

  By default there are 4 logging levels: info, warn, debug, error:

```js
var LogIt = require('logit'),
    log = LogIt({ store: new log.stores.file('/tmp/it.log') });

log.warn('there is a memory spike happening now');
log.error('something bad happened while saving to db', new Error('dbfail'));
```

  When want to log other details besides the message, use the 'details' property:

```js
var LogIt = require('logit'),
    log = LogIt({ store: new log.stores.file('/tmp/it.log') });

var user = { id: '14421', name: 'John Doe', username: 'johndoe' };

// log the message, along with the user object
log.info({ msg: 'login', details: user });
```

### log.stream(options)

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
