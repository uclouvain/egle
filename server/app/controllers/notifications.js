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

var dbNotification  = require('../models/notification');
var dbUser          = require('../models/user');
var tokenManager    = require('../token_manager');
var jsonwebtoken    = require('jsonwebtoken');
var _               = require('underscore');


// Retrieve notifications with a date or a module
exports.list = function(req, res) {
    var token = tokenManager.getToken(req.headers);
    if(token != null){
        var actorID = jsonwebtoken.decode(token).id;
        dbNotification.notificationModel.find({
            userID : actorID,
            datetime: {
                $gt: new Date(new Date().setDate(new Date().getDate() - 30))
            }
        })
        .sort({"datetime" : -1})
        .exec(function(err, notifications) {
            if (err) {
                console.log(err);
                audit.logEvent('[mongodb]', 'Notifications', 'List', '', '', 'failed', 'Mongodb attempted to retrieve notifications');
                return res.status(500).send(err);
            } else {
                beautify(notifications, function(err, modifiedNotifications){
                    if(err) {
                        return res.status(500).send(err);
                    } else {
                        return res.json(modifiedNotifications);
                    }
                });
            }
        });
    } else {
        audit.logEvent('[anonymous]', 'Notifications', 'List', '', '', 'failed','The user was not authenticated');
        return res.sendStatus(401);
    }
}

// Retrieve the last notifications (7 days)
exports.listLimited = function(req, res) {
    var token = tokenManager.getToken(req.headers);
    if(token != null){
        var actorID = jsonwebtoken.decode(token).id;
        dbNotification.notificationModel.find({
            userID : actorID,
            datetime: {
                $gt: new Date(new Date().setDate(new Date().getDate() - 7))
            }
        })
        .sort({"datetime" : -1})
        .exec(function(err, notifications) {
            if (err){
                console.log(err);
                audit.logEvent('[mongodb]', 'Notifications', 'List limited', '', '', 'failed', 'Mongodb attempted to retrieve notifications');
                return res.status(500).send(err);
            } else {
                beautify(notifications, function(err, modifiedNotifications){
                    if(err){
                        return res.status(500).send(err);
                    } else {
                        return res.json(modifiedNotifications);
                    }
                });
            }
        });
    } else {
        audit.logEvent('[anonymous]', 'Notifications', 'List by module', '', '', 'failed','The user was not authenticated');
        return res.sendStatus(401);
    }
}

// Add a new notification
exports.create = function(req, res) {
    dbNotification.notificationModel.create({
        userID : req.body.userID,
        type : req.body.name,
        content : req.body.content
    }, function(err, notification) {
        if (err){
            console.log(err);
            audit.logEvent('[mongodb]', 'Notifications', 'Create', '', '', 'failed', 'Mongodb attempted to create a notification');
            return res.status(500).send(err);
        } else {
            return res.sendStatus(200);
        }
    });
}

// Update a notification
exports.update = function(req, res) {
    var token = tokenManager.getToken(req.headers);
    if(token != null){
        var actorID = jsonwebtoken.decode(token).id;
        dbNotification.notificationModel.findOne({
            _id: req.params.id
        }).exec(function(err, notification) {
            if (err){
                audit.logEvent('[mongodb]', 'Notifications', 'Update', '', '', 'failed', 'Mongodb attempted to retrieve a notification');
                console.log(err);
                return res.status(500).send(err);
            } else {
                dbNotification.notificationModel.update({_id:req.params.id}, {
                    datetimeRead : new Date()
                }, function(err, nbRow) {
                    if (err) {
                        console.log(err);
                        audit.logEvent('[mongodb]', 'Notifications', 'Update', '', '', 'failed', 'Mongodb attempted to update a notification');
                        return res.status(500).send(err);
                    } else {
                        return res.sendStatus(200);
                    }
                });
            }
        });
    }
    else{
        audit.logEvent('[anonymous]', 'Notifications', 'List', '', '', 'failed','The user was not authenticated');
        return res.sendStatus(401); 
    }
}


var beautify = function(notifications, callback){
    var queryList = [];
    var contacts = _.where(notifications, {type: 'contacts'});
    var ia = _.where(notifications, {type: 'ia'});//type: 'objectives'
	// ia post treating if necessary.
    
    for (var i=0; i<contacts.length; i++) {
        if(contacts[i].authorID){
            queryList.push({_id : contacts[i].authorID });
        }
    }
    
    if(queryList.length > 0){
        var modifiedContacts = [];
        dbUser.userModel.find({ $or : queryList }, {username: 1, "preferences.avatar": 1}, function(err, userinfos) {
            if (err){
                console.log(err);
                audit.logEvent('[mongodb]', 'Notifications', 'Beautify', '', '', 'failed', 'Mongodb attempted to retrieve notifications');
                callback(err);
            } else {
                for (var i=0; i<contacts.length; i++) {
                    for (var j=0; j<userinfos.length; j++) {
                        if (userinfos[j]._id.toString() === contacts[i].authorID) {
                            modifiedContacts.push({
                                _id: contacts[i]._id,
                                type: contacts[i].type,
                                content: contacts[i].content,
                                datetime: contacts[i].datetime,
                                username : userinfos[j].username,
                                avatar: userinfos[j].preferences.avatar,
								icon: "mood"
                            });
                            if(contacts[i].datetimeRead && modifiedContacts[i]) {
                                modifiedContacts[i].datetimeRead = contacts[i].datetimeRead;
                            }
                        }
                    }
                }
                callback(null, _.sortBy(_.union(modifiedContacts, ia), 'datetime').reverse());
            }
        });
    }
    else{
		callback(null, _.sortBy(_.union(contacts, ia), 'datetime').reverse());
    }
}