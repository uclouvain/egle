
var log             = require('../log/log');
var nconf           = require('nconf');
var mongoose        = require('mongoose');
var mongodbURL      = nconf.get('mongo');
var mongodbOptions  = {};

mongoose.connect(mongodbURL, mongodbOptions, function (err, res) {
    if (err) { 
        console.log('Connection to ' + mongodbURL + " refused.  err : ", err);
        log.error('Connection to ' + mongodbURL + " refused.  err : ", err);
    } else {
        log.info('MongoDB is ready on port 27017');
    }
});