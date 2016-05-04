var log   = require('../log/log');
var redis = require('redis');
var nconf = require('nconf');

var redisClient = redis.createClient(nconf.get('redis').port);
redisClient.on('error', function (err) {
    log.error('Redis error :' + err);
});

redisClient.on('connect', function () {
    log.info('Redis is ready on port ' + nconf.get('redis').port);
});

exports.redis = redis;
exports.redisClient = redisClient;