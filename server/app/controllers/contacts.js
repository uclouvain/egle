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

var jsonwebtoken    = require('jsonwebtoken');
var dbRelationship  = require('../models/relationship');
var dbUser          = require('../models/user');
var dbNotification  = require('../models/notification');
var dbChat          = require('../models/chatModel');
var tokenManager    = require('../token_manager');
var audit           = require('../audit-log');
var _               = require('underscore');


exports.search = function(req, res){
    var token = tokenManager.getToken(req.headers);
    if(token != null){
        var actorID = jsonwebtoken.decode(token).id;
        dbUser.userModel.findOne({_id: actorID},{username: 1}, function (err, user) {
            if(err){
                console.log(err);
                audit.logEvent('[mongodb]', 'Contacts', 'Search', '', '', 'failed', 'Mongodb attempted to retrieve a user');
                return res.status(500).send(err);
            } else {
                if (user) {
                    var name = req.params.name || '';
                    if(name !== ''){
                        var query = {
                            $and:[{
                                $or: [{role: "2"}, {role: "3"}]
                            },{
                                username : new RegExp(name, 'i')
                            },{
                                username: { $ne: user.username }
                            }]
                        };

                        dbUser.userModel.find(query, {
                            _id: 0,
                            username: 1,
                            "preferences.avatar": 1
                        }).lean().exec(function (err, users){
                            if (err) {
                                console.log(err);
                                audit.logEvent('[mongodb]', 'Contacts', 'Search', '', '', 'failed', 'Mongodb attempted to retrieve a user');
                                return res.send(401);
                            } else {
                                if (users === undefined) {
                                    return res.send(401);
                                } else {
                                    for (i=0; i<users.length; i++) {
                                        if (users[i].preferences !== undefined && users[i].preferences.avatar !== undefined) {
                                            users[i].avatar = users[i].preferences.avatar;
                                            delete users[i].preferences;
                                        }
                                    }
                                    return res.json(users);
                                }
                            }
                        });
                    } else {
                        return res.json();
                    }
                } else {
                    return res.sendStatus(401);
                }
            }
        });
    } else {
        audit.logEvent('[anonymous]', 'Contacts', 'search', '', '', 'failed','The user was not authenticated');
        return res.sendStatus(401); 
    }   
};

exports.searchAccepted = function(req, res){
    var token = tokenManager.getToken(req.headers);
    if(token != null){
        var actorID = jsonwebtoken.decode(token).id;
        var name = req.params.name || '';
        if(name !== ''){
            searchInList(name, 1, actorID, function(err, contacts) {
                if (err){
                    res.status(500).send(err)
                } else {
                    return res.json(contacts);
                }
            });
        } else {
            return res.json();
        }
    } else {
        audit.logEvent('[anonymous]', 'Contacts', 'searchAccepted', '', '', 'failed','The user was not authenticated');
        return res.sendStatus(401); 
    }
};

// either the userID or the username need to be provided, the other one must be null
exports.verifyRelationship = function(actorID, participantID, participantUsername, callback){
    var query = (typeof participantID === "string") ? {_id : participantID} : {username : participantUsername};
    dbUser.userModel.findOne(query, function (err, user) {
        if(err){
            console.log(err);
            audit.logEvent(user.username, 'Contacts', 'Use the route : ' + req.route.path, '', '', 'failed',
                           'The user tried to access a route which is forbidden for his role');
            return callback({status: 500, err: err});
        } else {
            if (user !== null) {
                var userID_1, userID_2;
                if(user._id > actorID){
                    userID_1 = actorID;
                    userID_2 = user._id;
                }
                else{
                    userID_1 = user._id;
                    userID_2 = actorID;
                }
                dbRelationship.relationshipModel.findOne({
                    $and: [ {userID_1 : userID_1}, {userID_2 : userID_2}, {status:1}]
                }, {status : 1}, function (err, relationship) {
                    if (err) {
                        audit.logEvent('[mongodb]', 'Contacts', 'Verify relationship', '', '', 'failed', "Mongodb attempted to find a relationship");
                        console.log(err);
                        return callback(err);
                    } else {
                        if (relationship === null) {
                            return callback(null, false);
                        } else {
                            return callback(null, true);
                        }
                    }
                });
            } else {
                return callback({status: 403, err: null});
            }
        }
    });   
}

exports.frequent = function(req, res){
    var token = tokenManager.getToken(req.headers);
    if(token != null){
        var actorID = jsonwebtoken.decode(token).id;
        dbChat.chatModel.find({
            "participants.userID" : actorID,
            "frequency.counter": {$gt: 0}
        }, {"participants.userID":1, _id:0, frequency: 1})
        .limit(8)
        .exec(function(err, contacts) {
            if (err){
                console.log(err);
                audit.logEvent('[mongodb]', 'Contacts', 'Frequent', '', '', 'failed', 'Mongodb attempted to retrieve a chat');
                return res.status(500).send(err);
            } else {
                var resultList = [];
                if(contacts.length > 0){
                    contacts.sort(function(a, b){
                        var A = a.frequency.counter;
                        var B = b.frequency.counter;
                        if      (A > B) return -1;
                        else if (A < B) return  1;
                        else            return  0;
                    });
                    function myLoop(i) {
                        if (i < contacts.length) {
                            var contactID = (contacts[i].participants[0].userID === actorID)?contacts[i].participants[1].userID : contacts[i].participants[0].userID;
                            exports.verifyRelationship(actorID, contactID, null, function(err, state){
                                if (err){
                                    return res.status(500).send(err);
                                } else {
                                    if(state){
                                        dbUser.userModel.findOne({_id : contactID}, {username: 1, "preferences.avatar": 1}, function(err, userinfos) {
                                            if (err){
                                                console.log(err);
                                                return res.status(500).send(err);
                                            } else {
                                                resultList.push({
                                                    username: userinfos.username,
                                                    avatar: userinfos.preferences.avatar
                                                });
                                                myLoop(i+1);
                                            }
                                        });
                                    } else {
                                        myLoop(i+1);
                                    }
                                }
                            });
                        } else {
                            return res.json(resultList);
                        }
                    }
                    myLoop(0);
                } else {
                    return res.json(resultList);
                }
            }
        });
    } else {
        audit.logEvent('[anonymous]', 'Contacts', 'Frequent', '', '', 'failed','The user was not authenticated');
        return res.sendStatus(401); 
    }
};

exports.read = function(req, res){
    var token = tokenManager.getToken(req.headers);
    if(token != null){
        var actorID = jsonwebtoken.decode(token).id;
        if(req.params.username == undefined){
            audit.logEvent(actorID, 'Contacts', 'Read', '', '', 'failed',
                           'The user could not read the proflile of the contact because one or more params of the request was not defined');
            return res.sendStatus(400);
        } else {
            if (req.originalUrl.lastIndexOf("/light") === req.originalUrl.length - 6) {
                dbUser.userModel.findOne({
                    username:req.params.username
                }, {
                    _id: 0,
                    username: 1,
                    "preferences.avatar": 1
                }).lean().exec(function (err, contact) {
                    if (err) {
                        console.log(err);
                        audit.logEvent('[mongodb]', 'Contacts', 'Read (light)', "user id", actorID, 'failed',
                                       "Mongodb attempted to find the user");
                        return res.status(500).send(err);
                    }
                    if (contact == undefined) {
                        audit.logEvent('[mongodb]', 'Contacts', 'Read (light)', '', '', 'failed',
                                       'Mongodb attempted to find the user but it revealed not defined');
                        return res.sendStatus(403);
                    }
                    if (contact.preferences !== undefined && contact.preferences.avatar !== undefined) {
                        contact.avatar = contact.preferences.avatar;
                        delete contact.preferences;
                    }
                    return res.json(contact);
                });
            } else {
                if(!req.forbidden){
                    dbUser.userModel.findOne({_id: actorID}, function (err, user) {
                        if(err){
                            console.log(err);
                            audit.logEvent('[mongodb]', 'Contacts', 'Read', '', '', 'failed', 'Mongodb attempted to retrieve a user');
                            return res.status(500).send(err);
                        } else {
                            if (user) {
                                var query = {
                                    _id:0,
                                    username:1,
                                    gender:1,
                                    condition:1,
                                    role: 1,
                                    "preferences.avatar": 1
                                };
                                //If the user is a caregiver
                                if (user.role === "2") {
                                    query.email = 1;
                                    query.birthdate = 1;
                                    query.phone = 1;
                                    query.homeAddress = 1;
                                }
                                //Return the contact
                                dbUser.userModel.findOne({
                                    username:req.params.username
                                }, query).lean().exec(function (err, contact) {
                                    if (err) {
                                        console.log(err);
                                        audit.logEvent('[mongodb]', 'Contacts', 'Read', "user id", actorID, 'failed',
                                                       "Mongodb attempted to find the user");
                                        return res.status(500).send(err);
                                    }
                                    if (contact == undefined) {
                                        audit.logEvent('[mongodb]', 'Contacts', 'Read', '', '', 'failed',
                                                       'Mongodb attempted to find the user but it revealed not defined');
                                        return res.sendStatus(500);
                                    }
                                    if (contact.preferences !== undefined && contact.preferences.avatar !== undefined) {
                                        contact.avatar = contact.preferences.avatar;
                                        delete contact.preferences;
                                    }
                                    return res.json(contact);
                                });
                            } else {
                                return res.sendStatus(500);
                            }
                        }
                    });
                } else {
                    return res.sendStatus(403);
                }
            }
        }
    }
    else{
        audit.logEvent('[anonymous]', 'Contacts', 'Read contact profile', '', '', 'failed','The user was not authenticated');
        return res.send(401); 
    }
};


exports.list = function(req, res) {
    var token = tokenManager.getToken(req.headers);
    if(token != null){
        var actorID = jsonwebtoken.decode(token).id;
        var query = {};
        if (req.originalUrl.lastIndexOf("/accepted") === req.originalUrl.length - 9) {
            query = {
                $and:[{
                    status:1
                },{ 
                    $or: [ {userID_1 : actorID}, {userID_2 : actorID}]
                }]
            };
        }
        else if(req.originalUrl.lastIndexOf("/sent") === req.originalUrl.length - 5){
            query = {
                $and:[{
                    status:0
                },{ 
                    $or: [ {userID_1 : actorID}, {userID_2 : actorID}]
                },{
                    actionUserID:actorID
                }]
            };
        }
        else if(req.originalUrl.lastIndexOf("/received") === req.originalUrl.length - 9){
            query = {
                $and:[{
                    status:0
                },{ 
                    $or: [ {userID_1: actorID}, {userID_2: actorID}]
                },{
                    actionUserID: {$ne: actorID}
                }]
            };
        } else {
            audit.logEvent(actorID, 'Contacts', 'List', '', '', 'failed',
                           'The user could not list contacts because one or more params of the request was not defined');
            return res.sendStatus(400);
        }
        getList(query, actorID, function(err, contacts) {
            if (err){
                res.status(500).send(err)
            }
            return res.json(contacts);
        });
    }
    else{
        audit.logEvent('[anonymous]', 'Contacts', 'List', '', '', 'failed','The user was not authenticated');
        return res.send(401); 
    }
}


// Create or update a relationship
exports.createOrUpdate = function(req, res) {
    var token = tokenManager.getToken(req.headers);
    if(token != null){
        var actorID = jsonwebtoken.decode(token).id;
        dbUser.userModel.findOne({username: req.body.username}, function (err, user) {
            if (!err && user != null) {
                //userID_1 is always smaller than userID_2
                var userID_1, userID_2;
                if(user._id > actorID){
                    userID_1 = actorID;
                    userID_2 = user._id;
                }
                else{
                    userID_1 = user._id;
                    userID_2 = actorID;
                }
                dbRelationship.relationshipModel.findOne({
                    $and: [ {userID_1 : userID_1}, {userID_2 : userID_2}]
                }, function (err, relationship) {
                    if (err) {
                        console.log(err);
                        audit.logEvent('[mongodb]', 'Contacts', 'Create or update', '', '', 'failed', 'Mongodb attempted to retrieve a relationship');
                        return res.status(401).send(err);
                    }
                    //New relationship
                    if (relationship == undefined) {
                        var newRelationship = new dbRelationship.relationshipModel();
                        newRelationship.userID_1 = userID_1;
                        newRelationship.userID_2 = userID_2;
                        newRelationship.status = 0;
                        newRelationship.actionUserID = actorID;
                        newRelationship.save(function(err) {
                            if (err) {
                                console.log(err);
                                audit.logEvent('[mongodb]', 'Contacts', 'Create or update', '', '', 'failed', 'Mongodb attempted to save a relationship');
                                return res.status(500).send(err);
                            }
                            else{
                                dbNotification.notificationModel.create({
                                    userID : user._id,
                                    authorID : actorID,
                                    type : "contacts",
                                    content : "Sent you a contact request."
                                }, function(err, notification) {
                                    if (err){
                                        console.log(err);
                                        audit.logEvent('[mongodb]', 'Contacts', 'Create or update', '', '', 'failed', 'Mongodb attempted to create a notification');
                                        return res.status(500).send(err);
                                    } else {
                                        return res.sendStatus(200);
                                    }
                                });
                            }
                        });
                    }
                    //Update the relationship
                    else{
                        relationship.status = req.body.status;
                        relationship.actionUserID = actorID;
                        relationship.save(function(err) {
                            if (err) {
                                console.log(err);
                                audit.logEvent('[mongodb]', 'Contacts', 'Create or update', '', '', 'failed', 'Mongodb attempted to save a relationship');
                                return res.status(500).send(err);
                            } else {
                                if(req.body.status == '1'){
                                    dbNotification.notificationModel.create({
                                        userID : user._id,
                                        authorID : actorID,
                                        type : "contacts",
                                        content : "Accepted your contact request"
                                    }, function(err, notification) {
                                        if (err){
                                            console.log(err);
                                            audit.logEvent('[mongodb]', 'Contacts', 'Create or update', '', '', 'failed', 'Mongodb attempted to create a notification');
                                            return res.status(500).send(err);
                                        }
                                        else{
                                            return res.sendStatus(200);
                                        }
                                    });
                                } else {
                                    return res.sendStatus(200);
                                }
                            }
                        });
                    }
                });
            } else {
                console.log(err);
                return res.status(500).send(err);
            }
        });
    } else {
        audit.logEvent('[anonymous]', 'Contacts', 'Create or Update', '', '', 'failed','The user was not authenticated');
        return res.sendStatus(401); 
    }
}

// Delete a relationship
exports.delete = function (req, res) {
    var token = tokenManager.getToken(req.headers);
    if (token !== null) {
        var actorID = jsonwebtoken.decode(token).id;
        if (req.params.username != undefined) {
            dbUser.userModel.findOne({username: req.params.username}, function (err, user) {
                if(err){
                    audit.logEvent('[mongodb]', 'Contacts', 'Delete', '', '', 'failed',"Mongodb attempted to find a user");
                    console.log(err);
                    return res.status(500).send(err);
                } else {
                    if (user !== null) {
                        var userID_1, userID_2;
                        if(user._id > actorID){
                            userID_1 = actorID;
                            userID_2 = user._id;
                        }
                        else{
                            userID_1 = user._id;
                            userID_2 = actorID;
                        }
                        dbRelationship.relationshipModel.remove({ $and: [ {userID_1 : userID_1}, {userID_2 : userID_2}]}, function (err) {
                            if (err) {
                                audit.logEvent('[mongodb]', 'Contacts', 'Delete', '', '', 'failed', 
                                               "Mongodb attempted to remove a relationship");
                                console.log(err);
                                return res.status(500).send(err);
                            }
                            audit.logEvent(user.username, 'Contacts', 'Delete a contact', '', '', 'succeed', 'The user has successfully removed a contact');
                            return res.sendStatus(200);

                        });
                    } else {
                        return res.sendStatus(500);
                    }
                }
            });
        } else {
            audit.logEvent(actorID, 'Contacts', 'Delete a contact', '', '', 'failed',
                           'The user could not delete a contact because one or more params of the request was not defined');
            return res.sendStatus(400);
        }
    } else {
        audit.logEvent('[anonymous]', 'Contacts', 'Delete a contact', '', '', 'failed', 'The user was not authenticated');
        return res.sendStatus(401);
    }
};





var getList = function(query, actorID, callback) {
    dbRelationship.relationshipModel
        .find(query,{_id:0, userID_1:1, userID_2:1})
        .exec(function(err, contacts) {
        if (err){
            console.log(err);
            audit.logEvent('[mongodb]', 'Contacts', 'List', '', '', 'failed', 'Mongodb attempted to retrieve relationships');
            callback(err);
        } else {
            if (contacts && contacts.length>0) {
                var resultList = [], queryList = [];
                for (var i=0; i<contacts.length; i++) {
                    if(actorID == contacts[i].userID_1) {
                        contacts[i].userID = contacts[i].userID_2;
                    } else {
                        contacts[i].userID = contacts[i].userID_1;
                    }
                    queryList.push({_id : contacts[i].userID});
                    delete contacts[i].userID_1;
                    delete contacts[i].userID_2;
                }
                dbUser.userModel.find({ $or : queryList }, {username: 1, "preferences.avatar": 1}, function(err, userinfos) {
                    if (err){
                        console.log(err);
                        audit.logEvent('[mongodb]', 'Contacts', 'List', '', '', 'failed', 'Mongodb attempted to retrieve user info');
                        callback(err);
                    } else {
                        for (var i=0; i<contacts.length; i++) {
                            for (var j=0; j<userinfos.length; j++) {
                                if (userinfos[j]._id.toString() === contacts[i].userID) {
                                    resultList.push({
                                        username: userinfos[j].username,
                                        avatar: userinfos[j].preferences.avatar
                                    });
                                    break;
                                }
                            }
                        }
                        resultList.sort(function(a, b){
                            var A = a.username;
                            var B = b.username;
                            if      (A > B) return  1;
                            else if (A < B) return -1;
                            else            return  0;
                        });
                        callback(null, resultList);
                    }
                });
            } else {
                callback(null, resultList);
            }
        }
    });
}


var searchInList = function(name, status, actorID, callback){
    var query = {
        $and:[{
            status:status
        },{ 
            $or: [ {userID_1 : actorID}, {userID_2 : actorID}]
        }]
    };

    getList(query, actorID, function(err, contacts) {
        if (err){
            callback(err);
        } else {
            callback(null, _.filter(contacts, function(contact){
                return contact.username.match(new RegExp(name, 'i'));
            }));   
        }
    });
}

