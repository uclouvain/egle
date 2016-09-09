/*
 * The copyright in this software is being made available under MIT License 
 * MIT License, included below. This software may be subject to other third 
 * party and contributor rights, including patent rights, and no such rights
 * are granted under this license.
 *
 * Copyright (c) 2014-2016, Universite catholique de Louvain (UCL), Belgium
 * Copyright (c) 2014-2016, Professor Benoit Macq
 * Copyright (c) 2014-2016, Benoît Dereck-Tricot
 * Copyright (c) 2014-2016, Aissa Ghouti
 * All rights reserved.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

var redisClient     = require('./databases/redis').redisClient;
var nconf           = require('nconf');nconf.file("config/server.json");
var jsonwebtoken    = require('jsonwebtoken');

var TOKEN_EXPIRATION        = nconf.get('token').expiration;
var TOKEN_EXPIRATION_SEC    = TOKEN_EXPIRATION * 60;
var GRACE_PERIOD            = 10;
var tokenSecret             = nconf.get('token').secret;


// the revoked token are stored in the REDIS database,
// if the token was not limited in time : we keep it forever, an empty string is associated to it,
// if the token was     limited in time and is NOT revoked in a "refresh token" process :
//                                      - expiration is set to the token's intrinsic remaining time plus an error margin
//                                      - an empty string is associated to it, 
// if the token was     limited in time and is     revoked in a "refresh token" process : 
//                                      - expiration is set to the token's intrinsic remaining time plus an error margin 
//                                      - we write the current timestamp into REDIS, so that we can choose to grant access to the other parallel
//                                        requests which are still using that token (a 10 seconds grace period should be far enough)
var expireToken = function(token, keepTenSeconds) {
    var decoded = jsonwebtoken.decode(token);
    var remainingTime = - (Date.now()/1000 - decoded.exp);

    // if the token is not limited in time, keep the token forever
    if (remainingTime > 31536000) { // assuming TOKEN_EXPIRATION will never be larger than one year, 365*24*60*60=31536000
        redisClient.set(token, "");
    } else {
        if (keepTenSeconds !== true) {
            redisClient.set(token, "");
        } else {
            redisClient.set(token, ""+ (new Date().getTime() + GRACE_PERIOD*1000)); // allow 10 more seconds
        }
        redisClient.expire(token, Math.floor(remainingTime + 120)); // keep a little longer than the normal remaining lifetime
    }
};

//middleware for express
exports.verifyToken = function (req, res, next) {
    var token = getToken(req.headers);
    
    redisClient.get(token, function (err, reply) {
        if (err) {
            console.log('verifyToken : error from redis: '+err);
            return res.sendStatus(500);
        } else {
            var decoded = jsonwebtoken.decode(token);
            
            var remainingTime = -(Math.floor(new Date().getTime()/1000) - decoded.exp);
            
            // keep sending blank tokens even if there is no new token to send. This clears the client-side cached token, otherwise,
            // the client will beleive it receives a new token every time a 304 response is sent, containing an old "new" Authorization field.
            // I did not find an easy way to distinguish 304 responses from the 200 ones in angular's interceptor, and the headers are repeated.
            // I use 'c' instead of an empty string because Firefox doesn't not provide the Authorization field if it is empty
            res.set('Authorization', 'c');
            
            if (reply === "") {
                console.log('expired token found in REDIS');
                return res.sendStatus(401);
            } else if (reply !== null ) {
                var repliedExpirationDate = new Date(Number(reply)).getTime();
                if (isNaN(repliedExpirationDate)) {
                    console.log('verifyToken : error parsing the token expiration date from redis');
                    return res.sendStatus(500);
                } else {
                    var remainingGracePeriodTime = repliedExpirationDate + GRACE_PERIOD*1000 - (new Date().getTime());
                    if (remainingGracePeriodTime > 0) {
                        return next();
                    } else {
                        console.log('token error :  remainingGracePeriodTime = ' + remainingGracePeriodTime);
                        return res.sendStatus(401);
                    }
                }
            } else { //reply===null
                if  (remainingTime < TOKEN_EXPIRATION_SEC *2/3) {
                    expireToken(token, true);
                    var newToken = jsonwebtoken.sign({id: decoded.id, condition: decoded.condition}, tokenSecret, { expiresInMinutes: TOKEN_EXPIRATION });
//                    console.log('created token at ' + Math.floor(new Date().getTime()/1000) + ' ' + JSON.stringify(jsonwebtoken.decode(newToken)));
                    res.set('Authorization', 'Bearer ' + newToken);
                }
                return next();
            }
        }
    });
};

var getToken = function(headers) {
    if (headers && headers.authorization) {
        var authorization = headers.authorization;
        var part = authorization.split(' ');
        if (part.length === 2) {
            return part[1];
        } else {
            return null;
        }
    } else {
//        console.trace('getToken ', headers);
        return null;
    }
};

exports.getToken = getToken;
exports.expireToken = expireToken;

exports.TOKEN_EXPIRATION = TOKEN_EXPIRATION;
exports.TOKEN_EXPIRATION_SEC = TOKEN_EXPIRATION_SEC;