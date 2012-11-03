var LogIt = require('../index'),
    logit;

var logit = new LogIt({
    store: new LogIt.stores.file('./sample.log')
});

logit.info('App Start');

function generateErr(requiredParam) {
    if (!requiredParam) {
        throw new Error('Please provide the param!!');
    }
}

(function() {
    try {
        generateError();
    }
    catch(err) {
        logit.error({
            msg: 'Sample custom message',
            // log error stack also, besides the current stack
            errStack: true,
            details: {
                node: "Saturn",
                user: "Jones"
            }
        }, err)
    }
}());
