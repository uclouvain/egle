/*
 * The copyright in this software is being made available under MIT License 
 * MIT License, included below. This software may be subject to other third 
 * party and contributor rights, including patent rights, and no such rights
 * are granted under this license.
 *
 * Copyright (c) 2014-2016, Universite catholique de Louvain (UCL), Belgium
 * Copyright (c) 2014-2016, Professor Benoit Macq
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

var dbUser          = require('../models/user');
var tokenManager    = require('../token_manager');
var jsonwebtoken    = require('jsonwebtoken');
var audit           = require('../audit-log');
var fs              = require('fs');
var _               = require('underscore');


// Retrieve tips
exports.list = function (req, res) {
    var token = tokenManager.getToken(req.headers);
    if (token !== null) {
        var actorID = jsonwebtoken.decode(token).id;
        var tipsLib = fs.readFileSync("./tips/tips.json").toString();
        var tips = JSON.parse(tipsLib);
        dbUser.userModel.findOne({
            _id: actorID
        }, {
            _id: 1, condition: 1, "preferences.tips": 1
        }).exec(function (err, user) {
            if (err) {
                audit.logEvent('[mongodb]', 'Tips', 'List', '', '', 'failed', 'Mongodb attempted to retrieve a tip');
                return res.status(500).send(err);
                console.log(err);
            } else {
                var tipsToReturn = _.filter(tips, function (tip){
                    return tip.condition.indexOf(user.condition) > -1;
                });
                for (i=0; i<tipsToReturn.length; i++) {
                    if (user.preferences.tips.indexOf(tipsToReturn[i].id) > -1) {
                        tipsToReturn[i].bookmarked = true;
                    } else {
                        tipsToReturn[i].bookmarked = false;
                    }
                }
                return res.json(tipsToReturn);
            }
        });
    } else {
        audit.logEvent('[anonymous]', 'Tips', 'List', '', '', 'failed', 'The user was not authenticated');
        return res.sendStatus(401);
    }
};

//Read a tip
exports.read = function (req, res) {
    var token = tokenManager.getToken(req.headers);
    if (token !== null) {
        var actorID = jsonwebtoken.decode(token).id;
        if(req.params.id == undefined){
            audit.logEvent(actorID, 'Tips', 'Read', '', '', 'failed', 
                           'The user could not read the tip because one or more params of the request was not defined');
            return res.sendStatus(400);
        }
        var tipsLib = fs.readFileSync("./tips/tips.json").toString();
        var tips = JSON.parse(tipsLib);
        dbUser.userModel.findOne({
            _id: actorID
        }, {
            _id: 1, condition: 1, "preferences.tips": 1
        }).exec(function (err, user) {
            if (err) {
                console.log(err);
                audit.logEvent('[mongodb]', 'Tips', 'Read', '', '', 'failed', 'Mongodb attempted to retrieve a tip');
                return res.status(500).send(err);
            } else {
                var tipToReturn = _.findWhere(tips, {id: req.params.id});
                if (tipToReturn.condition.indexOf(user.condition) > -1) {
                    if (user.preferences.tips.indexOf(tipToReturn.id) > -1) {
                        tipToReturn.bookmarked = true;
                    } else {
                        tipToReturn.bookmarked = false;
                    }
                    return res.json(tipToReturn);
                }
                return res.status(403).send(err);
            }
        });
    } else {
        audit.logEvent('[anonymous]', 'Tips', 'Read', '', '', 'failed', 'The user was not authenticated');
        return res.sendStatus(401);
    }
};

//Bookmark or unBookmark a tip
exports.bookmark = function (req, res) {
    var token = tokenManager.getToken(req.headers);
    if (token !== null) {
        var actorID = jsonwebtoken.decode(token).id;
        if (req.body.id == undefined) {
            audit.logEvent(actorID, 'Tips', 'Bookmark', '', '', 'failed',
                           'The user could not bookmark or unbookmark the tip because one or more params of the request was not defined');
            return res.send(400);
        } else {
            dbUser.userModel.findOne({
                _id: actorID
            }).exec(function (err, user) {
                if (err) {
                    console.log(err);
                    audit.logEvent('[mongodb]', 'Tips', 'Bookmark', '', '', 'failed', 'Mongodb attempted to modify a user');
                    return res.status(500).send(err);
                } else {
                    var bookmarked;
                    var found = user.preferences.tips.indexOf(req.body.id);
                    if (found > -1) {
                        user.preferences.tips.splice(found, 1);
                        bookmarked = false;
                    } else {
                        user.preferences.tips.push(req.body.id);
                        bookmarked = true;
                    }
                    user.save(function (err) {
                        if (err) {
                            console.log(err);
                            audit.logEvent('[mongodb]', 'Tips', 'Bookmark', "username", user.username, 'failed',
                                           "Mongodb attempted to save the modified user");
                            return res.status(500).send(err);
                        }
                        res.json({bookmarked: bookmarked});
                    });
                }
            });
        }
    } else {
        audit.logEvent('[anonymous]', 'Tips', 'Bookmark', '', '', 'failed', 'The user was not authenticated');
        return res.sendStatus(401);
    }
};