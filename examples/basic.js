var LogIt = require('../index'),
    logit;

var logit = new LogIt({
    store: new LogIt.stores.console()
});

// notice logit will always include a timestamp by default
logit.info('App started');

(function generateError(param) {
    logit.info("generateError('" + param.toString() + "')");

    try {
        JSON.parse(param);
    }
    catch(err) {
        logit.error("Couldn't parse object", err);
    }
}('{asdasd: }'));
