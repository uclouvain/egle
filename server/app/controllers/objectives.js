var dbObjective     = require('../models/objective');
var dbUser          = require('../models/user');
var audit           = require('../audit-log');
var tokenManager    = require('../token_manager');
var jsonwebtoken    = require('jsonwebtoken');

exports.createOrUpdate = function(req, res) {
    var token = tokenManager.getToken(req.headers);
    if(token != null){
        var actorID = jsonwebtoken.decode(token).id;
        var objective = req.body.objective;

        if(objective._id !== undefined){
            dbObjective.objectiveModel.update({
                _id: objective._id
            }, objective, function (err, temp) {
                if (err) {
                    console.log(err);
                    audit.logEvent('[mongodb]', 'Objectives', 'Create or update', '', '', 'failed', 'Mongodb attempted to update an objective');
                    return res.status(500).send(err);
                } else {
                    return res.sendStatus(200);
                }
            });
        } else {
            dbObjective.objectiveModel.create({
                userID : actorID,
                type : objective.type,
                values : objective.values,
            }, function(err, temp) {
                if (err){
                    console.log(err);
                    audit.logEvent('[mongodb]', 'Objectives', 'Create or update', '', '', 'failed', 'Mongodb attempted to create an objective');
                    callback(err);
                } else {
                    return res.sendStatus(200);
                }
            });
        }
    } else {
        audit.logEvent('[anonymous]', 'Objectives', 'Create or update', '', '', 'failed','The user was not authenticated');
        return res.sendStatus(401); 
    }
};


exports.read = function(req, res) {
    var token = tokenManager.getToken(req.headers);
    if(token != null){
        var actorID = jsonwebtoken.decode(token).id;
        if(req.params.type !== undefined){
			dbObjective.objectiveModel.findOne({
				userID : actorID,
				type : req.params.type
			})
			.exec(function(err, objective) {
				if (err){
                    console.log(err);
                    audit.logEvent('[mongodb]', 'Objectives', 'Read', '', '', 'failed', 'Mongodb attempted to retrieve an objective');
                    return res.status(500).send(err);
                } else {
                    return res.json(objective);
                }; 
			});
        } else {
            audit.logEvent(actorID, 'Objectives', 'Read', '', '', 'failed',
                           'The user could not retrieve an objective because one or more params of the request was not defined');
            return res.sendStatus(400); 
        };
    } else {
        audit.logEvent('[anonymous]', 'Objectives', 'Read', '', '', 'failed','The user was not authenticated');
        return res.sendStatus(401); 
    }
};

exports.delete = function(req, res) {
    var token = tokenManager.getToken(req.headers);
    if(token != null){
        var actorID = jsonwebtoken.decode(token).id;
        console.log(req.params.id);
        if(req.params.id !== undefined){
            dbObjective.objectiveModel.remove({
                _id : req.params.id
            }, function(err, temp) {
                if (err){
                    console.log(err);
                    audit.logEvent('[mongodb]', 'Objectives', 'Delete', '', '', 'failed', 'Mongodb attempted to delete an objective');
                    return res.status(500).send(err);
                } else {
                    return res.sendStatus(200);
                }
            });
        } else {
            audit.logEvent(actorID, 'Objectives', 'Delete', '', '', 'failed',
                           'The user could not delete an objective because one or more params of the request was not defined');
            return res.sendStatus(400); 
        };
    } else {
        audit.logEvent('[anonymous]', 'Objectives', 'Delete', '', '', 'failed','The user was not authenticated');
        return res.sendStatus(401); 
    }
};