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
var dbEvent         = require('../models/event');
var dbEntry         = require('../models/entry');
var audit           = require('../audit-log');
var tokenManager    = require('../token_manager');


// Get all events by specified date range
exports.listByDateRange = function (req, res) {
    // The current token is used to identify the current user.
    var token = tokenManager.getToken(req.headers);
    if (token !== null) {
        var actorID = jsonwebtoken.decode(token).id;
        if (req.params.from !== undefined && req.params.to !== undefined) {
            dbEvent.eventModel.find({
                userID: actorID,
                start: {
                    $gt: new Date(req.params.from)
                },
                end: {
                    $lt: new Date(req.params.to)
                }
            }, function (err, events) {
                if (err) {
                    audit.logEvent('[mongodb]', 'Events', 'List', '', '', 'failed', 'Mongodb attempted to retrieve events by specified range date');
                    console.log(err);
                    return res.status(500).send(err);
                } else {
                    return res.json(events);
                }
            });
        } else {
            audit.logEvent(actorID, 'Events', 'List', '', '', 'failed', 'The user could not retrieve events because one or more params of the request was not defined');
            return res.sendStatus(400);
        }
    } else {
        audit.logEvent('[anonymous]', 'Events', 'List', '', '', 'failed', 'The user was not authenticated');
        return res.sendStatus(401);
    }
};


// Get a specified event
exports.read = function (req, res) {
    // The current token is used to identify the current user.
    var token = tokenManager.getToken(req.headers);
    if (token !== null) {
        var actorID = jsonwebtoken.decode(token).id;
        if (req.params.id !== undefined) {
            dbEvent.eventModel.findOne({
                _id: req.params.id
            }).lean().exec(function (err, event) {
                if (err) {
                    console.log(err);
                    audit.logEvent('[mongodb]', 'Events', 'Read', 'Event id', req.params.id, 'failed', 'Mongodb attempted to retrieve an event');
                    return res.status(500).send(err);
                } else {
                    if(event !== null){
                        if(event.relatedEntryID){
                            dbEntry.entryModel.findOne({
                                _id: event.relatedEntryID
                            }, function (err, entry) {
                                if (err) {
                                    console.log(err);
                                    audit.logEvent('[mongodb]', 'Events', 'Read', 'Event id', 
                                                   req.params.id, 'failed', 'Mongodb attempted to retrieve an entry');
                                    return res.status(500).send(err);
                                } else {
                                    if(entry !== null){
                                        if(entry.values[0]){
                                            event.intensity = entry.values[0].value;
                                        }
                                    }
                                    return res.json(event);
                                }
                            });
                        } else {
                            return res.json(event);
                        }
                    } else {
                        return res.sendStatus(404);
                    }
                }
            });
        } else {
            audit.logEvent(actorID, 'Events', 'Read', '', '', 'failed',
                'The user could not retrieve events because one or more params of the request was not defined');
            return res.sendStatus(400);
        }

    } else {
        audit.logEvent('[anonymous]', 'Events', 'Read', '', '', 'failed', 'The user was not authenticated');
        return res.sendStatus(401);
    }
};


// Create or update an event based on the received fields (req.body)
exports.createOrUpdate = function (req, res) {
    var token = tokenManager.getToken(req.headers);
    var eventID = req.body.event_id;
    if (token !== null) {
        var actorID = jsonwebtoken.decode(token).id;
        var theEvent = {
            userID: actorID,
            title: req.body.title,
            start: new Date(req.body.startDate),
            end: new Date(req.body.endDate),
            type: req.body.type,
            where: {
                place: req.body.where.place,
                latitude: req.body.where.latitude,
                longitude: req.body.where.longitude
            }
        }
        if (eventID == undefined) {
            //Create
            if(req.body.value && req.body.values){
                //Create an entry
                dbEntry.entryModel.create({
                    userID : actorID,
                    type : 'activity',
                    value : req.body.value,
                    datetimeAcquisition : req.body.datetimeAcquisition,
                    subType: 'sport',
                    values: req.body.values
                }, function (err, entry) {
                    if (err) {
                        console.log(err);
                        audit.logEvent('[mongodb]', 'Events', 'Create or update', '', '', 'failed', 'Mongodb attempted to create an entry');
                        return res.status(500).send(err);
                    } else {
                        theEvent.relatedEntryID = entry._id;
                        dbEvent.eventModel.create(theEvent, function (err, events) {
                            if (err) {
                                console.log(err);
                                audit.logEvent('[mongodb]', 'Events', 'Create or update', '', '', 'failed', 'Mongodb attempted to create an event');
                                return res.status(500).send(err);
                            } else {
                                return res.sendStatus(200);
                            }
                        });
                    }
                });
            } else {
                //Create a simple event
                dbEvent.eventModel.create(theEvent, function (err, events) {
                    if (err) {
                        console.log(err);
                        audit.logEvent('[mongodb]', 'Events', 'Create or update', '', '', 'failed', 'Mongodb attempted to create an event');
                        return res.status(500).send(err);
                    } else {
                        return res.sendStatus(200);
                    }
                });
            }
        } else if (eventID !== undefined) {
            //Update
            dbEvent.eventModel.findOne({
                _id: eventID
            }, function (err, event) {
                if (err) {
                    audit.logEvent('[mongodb]', 'Events', 'Create or update', 'Event id', eventID, 'failed', 'Mongodb attempted to retrieve an event');
                    console.log(err);
                    return res.status(500).send(err);
                } else {
                    //Remove the related entry if exists
                    if(event.relatedEntryID){
                        dbEntry.entryModel.remove({
                            _id: event.relatedEntryID
                        }, function (err) {
                            if (err) {
                                console.log(err);
                                audit.logEvent('[mongodb]', 'Events', 'Create or update', 'Entry id', event.relatedEntryID,
                                               'failed', 'Mongodb attempted to delete an entry');
                                return res.status(500).send(err);
                            }
                        });
                    }
                    
                    if(req.body.value && req.body.values){
                        //Create an entry
                        dbEntry.entryModel.create({
                            userID : actorID,
                            type : 'activity',
                            value : req.body.value,
                            datetimeAcquisition : req.body.datetimeAcquisition,
                            subType: 'sport',
                            values: req.body.values,
                        }, function (err, entry) {
                            if (err) {
                                console.log(err);
                                audit.logEvent('[mongodb]', 'Events', 'Create or update', '', '', 'failed', 'Mongodb attempted to create an entry');
                                return res.status(500).send(err);
                            } else {
                                theEvent.relatedEntryID = entry._id;
                                dbEvent.eventModel.update({
                                    _id: eventID
                                }, theEvent, function (err, events) {
                                    if (err) {
                                        console.log(err);
                                        audit.logEvent('[mongodb]', 'Events', 'Create or update', '', '', 'failed', 'Mongodb attempted to update an event');
                                        return res.status(500).send(err);
                                    } else {
                                        return res.sendStatus(200);
                                    }
                                });
                            }
                        });
                    } else {
                        //Update the simple event
                        dbEvent.eventModel.update({
                            _id: eventID
                        }, { $unset: {relatedEntryID:1} }, function (err, events) {
                            if (err) {
                                console.log(err);
                                audit.logEvent('[mongodb]', 'Events', 'Create or update', '', '', 'failed', 'Mongodb attempted to update an event');
                                return res.status(500).send(err);
                            } else {
                                dbEvent.eventModel.update({
                                    _id: eventID
                                }, theEvent, function (err, events) {
                                    if (err) {
                                        console.log(err);
                                        audit.logEvent('[mongodb]', 'Events', 'Create or update', '', '', 'failed', 'Mongodb attempted to update an event');
                                        return res.status(500).send(err);
                                    } else {
                                        return res.sendStatus(200);
                                    }
                                });
                            }
                        });
                    }
                }
            });
        }
    } else {
        audit.logEvent('[anonymous]', 'Events', 'Create or update', '', '', 'failed', 'The user was not authenticated');
        return res.sendStatus(401);
    }
};


// Delete an event
exports.delete = function (req, res) {
    var eventID = req.params.id;
    // The current token is used to identify the current user.
    var token = tokenManager.getToken(req.headers);
    if (token !== null) {
        var actorID = jsonwebtoken.decode(token).id;
        dbEvent.eventModel.remove({
            _id: eventID
        }, function (err) {
            if (err) {
                console.log(err);
                audit.logEvent('[mongodb]', 'Events', 'Delete', 'Event id', req.params.is, 'failed', 'Mongodb attempted to delete an event');
                return res.status(500).send(err);
            } else {
                audit.logEvent(actorID, 'Events', 'Delete', 'Event id', req.params.id, 'succeed', 'The user successfully deleted an event');
                return res.sendStatus(200);
            }
        });
    } else {
        audit.logEvent('[anonymous]', 'Events', 'Delete', '', '', 'failed', 'The user was not authenticated');
        return res.sendStatus(401);
    }
};


