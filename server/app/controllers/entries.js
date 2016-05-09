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

var db              = require('../models/entry');
var dbUser          = require('../models/user');
var audit           = require('../audit-log');
var tokenManager    = require('../token_manager');
var jsonwebtoken    = require('jsonwebtoken');


// Retrieve entries
exports.list = function(req, res) {
    var token = tokenManager.getToken(req.headers);
    if(token != null){
        var actorID = jsonwebtoken.decode(token).id;
        if (req.originalUrl.indexOf("/entries") === 4) {
            //The actor is the patient
            if(req.params.type !== undefined){
                list(actorID, actorID, {type: req.params.type, subType: req.params.subtype}, function(err, entries){
                    if (err){
                        res.status(500).send(err);
                    } else {
                        return res.json(entries);
                    }
                });
            } else {
                audit.logEvent(actorID, 'Entries', 'List', '', '', 'failed',
                               'The user could not retrieve entries because one or more params of the request was not defined');
                return res.sendStatus(400); 
            }
        } else {
            //The actor is the doctor
            if(!req.forbidden){
                if(req.params.type !== undefined && req.params.username !== undefined){
                    dbUser.userModel.findOne({
                        username : req.params.username
                    }, {_id:1})
                    .exec(function(err, user) {
                        if (err){
                            console.log(err);
                            audit.logEvent('[mongodb]', 'Entries', 'List', '', '', 'failed', 'Mongodb attempted to retrieve a user');
                            res.status(500).send(err);
                        }
                        else{  
                            list(actorID, user._id, {type: req.params.type, subType: req.params.subtype}, function(err, entries){
                                if (err){
                                    res.status(500).send(err);
                                } else {
                                    return res.json(entries);
                                }
                            });
                        }
                     });
                }
                else{
                    audit.logEvent(actorID, 'Entries', 'List', '', '', 'failed',
                                   'The user could not retrieve entries because one or more params of the request was not defined');
                    return res.sendStatus(400); 
                }
            } else {
                return res.sendStatus(403);
            }
        }
    } else {
        audit.logEvent('[anonymous]', 'Entries', 'List', '', '', 'failed','The user was not authenticated');
        return res.sendStatus(401); 
    }
}

var list = function(actorID, patientID, config, callback){
    var query = {
        userID : patientID,
        type: config.type
    };

    if(config.subType !== undefined && config.subType !== 'undefined'){
        query.subType = config.subType;
    }

    db.entryModel.find(query)
    .limit(10)
    .sort({"datetimeAcquisition" : -1})
    .exec(function(err, entries) {
        if (err){
            console.log(err);
            audit.logEvent('[mongodb]', 'Entries', 'List', '', '', 'failed', 'Mongodb attempted to retrieve entries');
            callback(err);
        } else {
            callback(null, entries);
        }
    });
}

// Add a new entry
exports.create = function(req, res) {
    var token = tokenManager.getToken(req.headers);
    if(token != null){
        var actorID = jsonwebtoken.decode(token).id;
        var skipped = req.body.skipped || '';
        var value = req.body.value || '';
        var datetimeAcquisition = req.body.datetimeAcquisition || '';
        var comments = req.body.comments || '';
        var subType = req.body.subType || '';
        var values = req.body.values || '';
        
        var theEntry ={
            userID : actorID,
            type : req.body.type
        }
        
        if(subType !== ''){
            theEntry.subType = subType;
        }
        if(value !== ''){
            theEntry.value = value;
        }
        if(values !== ''){
            theEntry.values = values;
        }
        if(datetimeAcquisition !== ''){
            theEntry.datetimeAcquisition = datetimeAcquisition;
        }
        if(comments !== ''){
            theEntry.comments = comments;
        }
        if(skipped !== ''){
            theEntry.isSkipped = skipped;
        }
        
        if(theEntry.type === 'mobility'){
            db.entryModel.findOne({
                userID: actorID,
                type: 'mobility',
                datetimeAcquisition: {
                    $gt: new Date(theEntry.datetimeAcquisition).setHours(0,0,0,0), 
                    $lt: new Date(theEntry.datetimeAcquisition).setHours(23,59,59,999)
                }
            }, {
                _id: 0
            }, function (err, entry) {
                if(entry){
                    return res.json({duplicate: true});
                } else {
                    db.entryModel.create(theEntry, function(err, entries) {
                        if (err){
                            audit.logEvent('[mongodb]', 'Entries', 'Create', '', '', 'failed', 'Mongodb attempted to create an entry');
                            console.log(err);
                            return res.status(500).send(err);
                        } else {
                            return res.sendStatus(200);
                        }
                    });
                }
            });        
        } else {
            db.entryModel.create(theEntry, function(err, entries) {
                if (err){
                    audit.logEvent('[mongodb]', 'Entries', 'Create', '', '', 'failed', 'Mongodb attempted to create an entry');
                    console.log(err);
                    return res.status(500).send(err);
                } else {
                    return res.sendStatus(200);
                }
            });
        }
    } else {
        audit.logEvent('[anonymous]', 'Entries', 'Create', '', '', 'failed','The user was not authenticated');
        return res.sendStatus(401); 
    }
}

// Delete an entry
exports.delete = function(req, res) {
    var token = tokenManager.getToken(req.headers);
    if(token != null){
        var actorID = jsonwebtoken.decode(token).id;
        if(req.params.id !== undefined){
            db.entryModel.remove({_id : req.params.id}, function(err){
                if (err) {
                    console.log(err);
                    audit.logEvent('[mongodb]', 'Entries', 'Delete', '', '', 'failed', 'Mongodb attempted to delete an entry');
                    return res.status(500).send(err);
                } else {
                    return res.sendStatus(200);
                }
            });
        } else {
            audit.logEvent(actorID, 'Entries', 'Delete', '', '', 'failed',
                                 'The user could not delete the entriy because one or more params of the request was not defined');
            return res.sendStatus(400);
        }
    } else {
        audit.logEvent('[anonymous]', 'Entries', 'Delete', '', '', 'failed','The user was not authenticated');
        return res.sendStatus(401); 
    }
}