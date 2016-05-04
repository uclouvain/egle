var model   = require('../models/log').logModel;
var fs      = require('fs');
var bristol = require('bristol');
var nconf   = require('nconf');

const logPath = nconf.get('log').path;

require('../databases/mongodb');

// check whether we are in debugging context
var debug = false;
process.execArgv.forEach(function(arg) {
    if ((arg === '--debug') || (arg === '--debug-brk')) debug = true;
});

// create the logfiles dir
if (! fs.existsSync(logPath)) {
    fs.mkdirSync(logPath, 0750);
}

// configure bristol
// List in order from MOST to LEAST severe:
bristol.setSeverities(['fatal', 'error', 'warn', 'info', 'debug']);

// ISO-8601 date format in momentjs syntax: 'YYYY-MM-DDTHH:mm:ss.SSSZ'
// Add targets
// console
bristol.addTarget('console')
    .withFormatter('human', {dateFormat: 'YYYY-MM-DD HH:mm:ss.SSSZ'})
    .withLowestSeverity('debug');

// a file for all
bristol.addTarget('file', {file: logPath+'egle.log'} )
    .withFormatter('human', {dateFormat: 'YYYY-MM-DD HH:mm:ss.SSSZ'})
    .withLowestSeverity('info')

// and a file for each level
bristol.addTarget('file', {file: logPath+'egle.fatal'})
    .withFormatter('human', {dateFormat: 'YYYY-MM-DD HH:mm:ss.SSSZ'})
    .withLowestSeverity('fatal')
    .withHighestSeverity('fatal');

bristol.addTarget('file', {file: logPath+'egle.error'})
    .withFormatter('human', {dateFormat: 'YYYY-MM-DD HH:mm:ss.SSSZ'})
    .withLowestSeverity('error')
    .withHighestSeverity('error');

bristol.addTarget('file', {file: logPath+'egle.warn'})
    .withFormatter('human', {dateFormat: 'YYYY-MM-DD HH:mm:ss.SSSZ'})
    .withLowestSeverity('warn')
    .withHighestSeverity('warn');

bristol.addTarget('file', {file: logPath+'egle.info'})
    .withFormatter('human', {dateFormat: 'YYYY-MM-DD HH:mm:ss.SSSZ'})
    .withLowestSeverity('info')
    .withHighestSeverity('info');

if (debug) {
    bristol.addTarget('file', {file: logPath+'egle.debug'})
        .withFormatter('human', {dateFormat: 'YYYY-MM-DD HH:mm:ss.SSSZ'})
        .withLowestSeverity('debug')
        .withHighestSeverity('debug');
}

var mongooseTarget = function (options, severity, date, message) {
    var msg = JSON.parse(message);
    var document = new model(
        {
            severity: severity,
            date: date,
            file: msg['file'],
            line: msg['line'],
            message: msg['message']
        }
    );
    document.save(function(err) {
        if (err) {
            console.log(__filename + ': failed to log to mongoDB: ' + err);
        }
    });
};

bristol.addTarget(mongooseTarget)
    .withLowestSeverity(debug? 'debug':'info')
    .withHighestSeverity('fatal');

bristol.debug('Log system initialized.');

exports = module.exports = bristol;