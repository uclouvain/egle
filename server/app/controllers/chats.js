var ObjectId        = require('mongodb').ObjectID;
var dbChat          = require('../models/chatModel');
var dbUser          = require('../models/user');
var audit           = require('../audit-log');
var tokenManager    = require('../token_manager');
var users           = require('./users.js');
var jsonwebtoken    = require('jsonwebtoken');
var _               = require('underscore');
var crypto          = require('crypto');
var nconf           = require('nconf');nconf.file("config/server.json");
var sharedKey       = nconf.get('webrtc').secret;
var expiration      = nconf.get('webrtc').expiration * 1000;
var ringingTime     = nconf.get('webrtc').ringingTime * 1000;


exports.getSignalingToken = function(req, res){
    /* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
     * token structure : timestamp:roomname:username:digest                      *
     * where the digest is :                                                     *
     *            base64(hmac(sharedKey,"timestamp:room_name:username"))         *
     * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */
    var token = tokenManager.getToken(req.headers);
    if(token != null){
        var userID = jsonwebtoken.decode(token).id;
        users.getUsername(userID, function (err, username) {
            if (err) {
                console.log('Error : ' + err);
                return res.status(500).send(err);
            }
            else{
                var room = req.params.roomID;
                var users = room.split("_");
                if ((username !== users[0]) && (username !== users[1])) {
                    console.log('Error : the user '+username+' tried to get a token for the room "' + room+'"');
                    return res.sendStatus(403);
                }
                else{
                    var result = {};
                    var timestamp = Math.floor(new Date().getTime()) + (expiration || 10000) + "";
                    result = timestamp + ":" + room + ":" + username;

                    var hmac = crypto.createHmac('sha1', sharedKey);
                    hmac.update(result);
                    result += ":" + hmac.digest('base64');
//                    console.log('token in getSignalingToken :' , result)
                    return res.status(200).send(result);
                }
            }
        });
    }
}


var token = function (user1, user2, expiration) {
    /* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
     * token structure : timestamp:roomname:username:digest                      *
     * where the digest is :                                                     *
     *            base64(hmac(sharedKey,"timestamp:room_name:username"))         *
     * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */
    var room = (user1.localeCompare(user2) < 0) ? user1+'_'+user2 : user2+'_'+user1;
    var result = {};
    var timestamp = Math.floor(new Date().getTime()) + (expiration || 10000) + "";
    
    result = timestamp + ":" + room + ":" + user1;

    var hmac = crypto.createHmac('sha1', sharedKey);
    hmac.update(result);
    
    result += ":" + hmac.digest('base64');
//    console.log('token : '+result);
    return result;
}


exports.readChatsList = function (req, res) {
    var token = tokenManager.getToken(req.headers);
    if(token != null){
        getChatsList(jsonwebtoken.decode(token).id, function(err, resultList){
            if(err){
                console.log(err);
                return res.status(500).send(err);
            } else {
                return res.status(200).send(resultList);
            }
        });
    } else {
        return res.sendStatus(401);
    }
}

var getChat = function(req, res, permitCreation, callback) {
    var result = {};
    var token = tokenManager.getToken(req.headers);
    if(token !== null){
        result.userID = jsonwebtoken.decode(token).id;
        result.participantUsername = req.params.username || req.body.username;

        if (typeof result.participantUsername === "string") {
            var userQuery;
            result.participantID = /^_[a-fA-F0-9]+$/g.exec(result.participantUsername);
            
            if (result.participantID === null){
                result.requestedByID = false;
                userQuery = {username : result.participantUsername};
            } else {
                result.requestedByID = true;
                result.participantID = result.participantID[0].substr(1);
                if (result.participantID.length !== 24) {
                    console.log('The provided user ID seems to have a bad syntax : "' + result.participantID + '"');
                    audit.logEvent( 'User ' + result.userID, 'Chats ctrl', 'getChat', '', '', 'failed',
                                    'Trying to read the chat by ID but provided ID have a bad syntax (should be 24 hex digits) : "' + result.participantID + '"');
                    result.suggestedHTTPCode = 403;
                    return callback(result);
                }
                userQuery = {_id : ObjectId(result.participantID).toString()};
            }
            
            
            // find the participant by its username or ID
            dbUser.userModel.findOne(userQuery, {}, function(err, user){
                if (err) {
                    console.log('Error in dbUser.userModel.findOne(): ' + err);
                    result.suggestedHTTPCode = 500;
                    return callback(result);
                }
                else if ((user === null) && (! result.requestedByID)) {
                    // requested by username but the user does not exist
                    // the client should have asked by ID to access his old chat with the deleted account
                    console.log('User not found : "' + result.participantUsername + '"');
                    audit.logEvent('User ' + result.userID, 'Chats ctrl', 'getChat', '', '', 'failed',
                                   'User not found : "' + result.participantUsername + '"');
                    result.suggestedHTTPCode = 403;
                    return callback(result);
                }
                else if ((user !== null) && (result.requestedByID)) {
                    // requested by ID but the account still exists
                    // a client should not try to get access to an old chat by ID if the account still exists
                    console.log('User account has been found but should not exist anymore when accessing by ID : "' + result.participantID + '"');
                    audit.logEvent('User ' + result.userID, 'Chats ctrl', 'getChat', '', '', 'failed',
                                   'Tried to read the chat by ID but the user account still exists : "' + result.participantID + '"');
                    result.suggestedHTTPCode = 403;
                    return callback(result);
                }
                else {
                    if (!result.requestedByID) {
                        result.participantID = user._id;
                    }
                    // provide the actor's username to the calling function
                    users.getUsername(result.userID, function(err, username){
                        if (err) {
                            console.log('Error in getChat : ' + err);
                            result.suggestedHTTPCode = 500;
                            return callback(result);
                        } else {
                            result.username = username;
                            // try to find a chat with the ID
                            dbChat.chatModel.find({ $or: [  { $and: [ {'participants.0.userID': result.userID}, {'participants.1.userID': result.participantID } ] },
                                                            { $and: [ {'participants.1.userID': result.userID}, {'participants.0.userID': result.participantID } ] } ] },
                                                    {}, function(err, chat) {
                                if (err) {
                                    console.log('Error in getChat : ' + err);
                                    result.suggestedHTTPCode = 500;
                                    return callback(result);
                                }
                                else if (chat.length > 1) {
                                    console.log('Error in getChat : multiple results found, check for DB consistency');
                                    result.suggestedHTTPCode = 500;
                                    return callback(result);
                                }
                                else if (chat.length === 1){
                                    result.chat = chat[0];
                                    result.suggestedHTTPCode = 200;
                                    return callback(result);
                                }
                                else { // no chat found
                                    // if not requested by ID, create a chat if the permitCreation flag allows it
                                    if (result.requestedByID) {
                                        console.log('Chat not found. A chat should exist when accessing by ID');
                                        audit.logEvent('User ' + result.username, 'Chats ctrl', 'getChat', '', '', 'failed',
                                                       'Trying to read the chat by ID but there is no corresponding chat : "' + result.participantID + '"');
                                        result.suggestedHTTPCode = 403;
                                        return callback(result);
                                    } else {
                                        if (permitCreation === true) {
                                            var date = new Date(0);
                                            var newChat = new dbChat.chatModel({
                                                participants : [
                                                    {
                                                        userID : result.userID,
                                                        readDate : date,
                                                        deleteDate : date,
                                                        unreadCount : 0
                                                    },
                                                    {
                                                        userID : result.participantID,
                                                        readDate : date,
                                                        deleteDate : date,
                                                        unreadCount : 0
                                                    }
                                                ],
                                                lastMessageDate : date
                                            });

                                            newChat.save(function(err){
                                                if(err){
                                                    console.log('Error while creating a new chat : ' + err);
                                                    result.suggestedHTTPCode = 500;
                                                    return callback(result);
                                                }
                                                else {
                                                    audit.logEvent('User ' + user.username, 'Chats ctrl', 'getChat', 'create chat with', 'User ' + result.participantUsername, 'succeed', '');
                                                    result.chat = newChat;
                                                    result.suggestedHTTPCode = 200;
                                                    return callback(result);
                                                }
                                            });
                                        } else {
                                            // no chat found and creation is not allowed
                                            result.suggestedHTTPCode = 200;
                                            return callback(result);
                                        }
                                    }
                                }
                            });
                        } // getUsername
                    });
                }
            }); //dbUser.userModel.findOne()
        }
        else{
            audit.logEvent('User ' + result.userID, 'Chats ctrl', 'getChat', '', '', 'failed', 'Incorrect participant (should be a string)');
            result.suggestedHTTPCode = 400;
            return callback(result);
        }
    }
    else{ //token === null
        audit.logEvent('[anonymous]', 'Chats ctrl', 'getChat', '', '', 'failed', 'The user was not authenticated');
        result.suggestedHTTPCode = 401;
        return callback(result);
    }
}

exports.readChat = function (req, res) {
    getChat(req, res, false, function(infos){
        if (infos.suggestedHTTPCode === 200) {
            var result = [];
            if (typeof infos.chat === 'undefined') {
                if(req.forbidden === false){
                    return res.status(200).send({chat: [], archived: null, forbidden: req.forbidden, calling: false});
                } else {
                    return res.sendStatus(403);
                }
            } else {
                var deleteDate;

                if (infos.chat.participants[0].userID === infos.userID) {
                    deleteDate = infos.chat.participants[0].deleteDate;
                }
                else{
                    deleteDate = infos.chat.participants[1].deleteDate;
                }

                var minDate = (req.params.afterDate) ? new Date(req.params.afterDate) : null;
                var minDate = null;
                var atLeastOneMessageFound = false;
                // populate the result array with the messages that were not "deleted" by the user
                if (typeof infos.chat.messages !== 'undefined') {
                    for (var i=0; i < infos.chat.messages.length; i++) {
                        if (infos.chat.messages[i].datetime > deleteDate) {
                            atLeastOneMessageFound = true;
                            if ((! minDate) || (infos.chat.messages[i].datetime > minDate)){
                                result.push({
                                    message: infos.chat.messages[i].msg,
                                    datetime: infos.chat.messages[i].datetime,
                                    username: (infos.chat.messages[i].userID === infos.userID) ? infos.username : infos.participantUsername
                                });
                            }
                        }
                    }
                }

                // populate the result array with the calls which happened after the delete date and the minDate
                if (typeof infos.chat.calls !== 'undefined') {
                    for (var i=0; i < infos.chat.calls.length; i++) {
                        if (infos.chat.calls[i].creationDatetime > deleteDate) {
                            atLeastOneMessageFound = true;
                            if ((! minDate) || (infos.chat.calls[i].creationDatetime > minDate)){
                                var call = {
                                    datetime: infos.chat.calls[i].creationDatetime,
                                    username: (infos.chat.calls[i].userID === infos.userID) ? infos.username : infos.participantUsername,
                                    duration: infos.chat.calls[i].duration || 0
                                }
                                result.push(call);
                            }
                        }
                    }
                }
                
                // add the lastCall, stored separately 
                var theLastCallIsStillActive = false;
                if (typeof infos.chat.lastCall !== 'undefined') {
                    var call = {
                        datetime: infos.chat.lastCall.creationDatetime,
                        username: (infos.chat.lastCall.userID === infos.userID) ? infos.username : infos.participantUsername,
                        duration: infos.chat.lastCall.duration || 0
                    }
                    result.push(call);
                    
                    // check whether a call is active
                    var now = new Date().getTime();
                    if ((infos.chat.lastCall.status === 0) || // ringing
                        (infos.chat.lastCall.status === 1)) { // calling
                        // consider the call as outdated if it is older than   ringingTime + duration + 5 seconds
                        // 5 seconds to have an error margin
                        theLastCallIsStillActive = (new Date(infos.chat.lastCall.creationDatetime).getTime() + ringingTime + (infos.chat.lastCall.duration || 0) + 5000 > now);
                    } else theLastCallIsStillActive = false;
                }
                
                // sort the messages and the calls by date
                result.sort(function(a,b){
                    var A = new Date(a.datetime);
                    var B = new Date(b.datetime);

                    if      (A > B) return  1;
                    else if (A < B) return -1;
                    else            return  0;
                });

                // reset the unread counter
                // keep it asynchronous ?
                dbChat.chatModel.update(
                    { _id : infos.chat._id, "participants.userID" : infos.userID },
                    {
                        $set: {
                            "participants.$.unreadCount" : 0,
                            "participants.$.readDate" : Date.now().toString()
                        }
                    },
                    function (err) {
                        if (err) {
                            console.log("Error while updating the unread counter : " + err);
                            audit.logEvent('User ' + infos.username, 'Chats ctrl', 'Read chat', '', '', 'failed',
                                           'Error while trying to reset the unreadCount : ' + err);
                        }
                    }
                );

                if (infos.requestedByID && !atLeastOneMessageFound) {
                    console.log('Chat not found. At least one message should exist when accessing by ID : "' + infos.participantID + '"');
                    audit.logEvent('User ' + infos.userID, 'Chats ctrl', 'Read chat', '', '', 'failed',
                                   'Trying to read the chat by ID but there is no message : "' + infos.participantID + '"');
                    return res.sendStatus(403);
                } else {
                    // getArchiveFlag
                    var resultFlag;
                    if (infos.userID === infos.chat.participants[0].userID){
                        resultFlag = infos.chat.participants[0].archive;
                    } else {
                        resultFlag = infos.chat.participants[1].archive;
                    }
                    
                    // frequency
                    var since = new Date();
                    since.setHours(since.getHours() - 2); 
                    if(infos.chat.frequency.lastTime){
                        if(infos.chat.frequency.lastTime < since){
                            infos.chat.frequency.counter++;
                            infos.chat.frequency.lastTime = new Date();
                            infos.chat.save(function(err) {
                                if (err) {
                                    console.log(err);
                                    return res.status(500).send(err);
                                } else {
                                    return res.status(200).send({chat: result, archived: resultFlag, forbidden: req.forbidden, calling: theLastCallIsStillActive});
                                }
                            });
                        } else {
                            return res.status(200).send({chat: result, archived: resultFlag, forbidden: req.forbidden, calling: theLastCallIsStillActive});
                        }
                    } else {
                        infos.chat.frequency = {
                            counter: 1,
                            lastTime: new Date()
                        }
                        infos.chat.save(function(err) {
                            if (err) {
                                console.log(err);
                                return res.status(500).send(err);
                            } else {
                                return res.status(200).send({chat: result, archived: resultFlag, forbidden: req.forbidden, calling: theLastCallIsStillActive});
                            }
                        });
                    }
                }
            }
        } else {
            return res.sendStatus(infos.suggestedHTTPCode);
        }
    });
};

var getChatsList = function (userID, callback){
    var resultList = [];  
    dbChat.chatModel.find({ "participants.userID" : userID })
    .sort('-lastMessageDate')
    .exec(function(err, chats) {
        if (err){
            callback(err);
        } else {
            for (var i=0; i<chats.length; i++) {
                // get the "delete" date for this user (messages before this date are ignored)
                var deleteDate;
                var readDate;
                var archived;
                var participantID;

                if (chats[i].participants[0].userID === userID)
                {
                    deleteDate = new Date(chats[i].participants[0].deleteDate);
                    readDate =   new Date(chats[i].participants[0].readDate);
                    archived = (chats[i].participants[0].archive !== undefined) && (chats[i].participants[0].archive === true);
                    participantID = chats[i].participants[1].userID;
                } else {
                    deleteDate = new Date(chats[i].participants[1].deleteDate);
                    readDate =   new Date(chats[i].participants[1].readDate);
                    archived = (chats[i].participants[1].archive !== undefined) && (chats[i].participants[1].archive === true);
                    participantID = chats[i].participants[0].userID;
                }

                // find the latest message in the chat and count the unread messages
                var lastMessage;
                var lastMessageDate = new Date(0);
                var unreadCount = 0;
                for (var j=0; j < chats[i].messages.length; j++) {
                    var date = new Date(chats[i].messages[j].datetime);
                    if (date > deleteDate) {
                        if (date >= lastMessageDate) {
                            lastMessageDate = date;
                            lastMessage = chats[i].messages[j].msg;
                        }
                        if (date > readDate) unreadCount++;
                    }
                }

                // include this chat if at least one message is subsequent to the delete date (has not been deleted)
                if (Number(lastMessageDate) !== 0) {
                    var chat = {
                        participantID : participantID,
                        lastMessage : lastMessage,
                        date : lastMessageDate,
                        unreadCount : unreadCount,
                        archived : archived
                    }
                    resultList.push(chat);
                }
            }

            if(chats.length > 0){
                // append contacts infos (username, avatar...) into the resultList table
                var queryList = [];
                for (var i=0; i<resultList.length; i++) {
                    queryList.push({_id : resultList[i].participantID });
                }
                if (queryList.length > 0) {
                    dbUser.userModel.find({ $or : queryList }, {username: 1, "preferences.avatar": 1}, function(err, userinfos) {
                        if (err){
                            callback(err);
                        } else {
                            for (var i=0; i<resultList.length; i++) { // for each element in the resultList,
                                for (var j=0; j<userinfos.length; j++) { // find the participant's infos.
                                    if (userinfos[j]._id.toString() === resultList[i].participantID) {
                                        resultList[i].username = userinfos[j].username;
                                        resultList[i].avatar = userinfos[j].preferences.avatar;
                                        // do not send the ID to the client 
                                        delete resultList[i].participantID;
                                        break;
                                    }
                                }
                            }
                            callback(null, resultList);
                        }
                    }); // end dbUser.userModel.find
                } else {
                    callback(null, resultList);
                }
            } else {
                callback(null, resultList);
            }
        }
    }); // dbChat.chatModel.find()
}

exports.sendMessage = function (req, res) {
    if(!req.forbidden){
        getChat(req, res, true, function(infos) {
            if (infos.suggestedHTTPCode === 200) {
                var message = (req.body.msg || '').trim();
                var now = new Date();
                dbChat.chatModel.update(
                    { _id : infos.chat._id, "participants.userID" : infos.participantID },
                    {
                        $push :
                        {
                            messages :
                                {
                                    userID : infos.userID,
                                    msg : message,
                                    datetime : now
                                }
                        },
                        $inc : {
                            "participants.0.unreadCount" : 1,
                            "participants.1.unreadCount" : 1
                        },
                        $set : {
                            "participants.0.archive" : false,
                            "participants.1.archive" : false,
                            "lastMessageDate" : now
                        }
                    },
                    function(err) {
                        if (err) {
                            console.log('Error : ' + err);
                            return res.status(500).send(err);
                        } else{
                            return res.sendStatus(200);
                        }
                    }
                );
            } else {
                return res.sendStatus(infos.suggestedHTTPCode);
            }
        });
    } else {
        return res.sendStatus(403);
    }
}

exports.webrtc = function (req, res) {
    if(!req.forbidden){
        var command = req.body.command;
        var permitCreation = (typeof command !== 'undefined' && command === 'call');
        getChat(req, res, permitCreation, function(infos){
            if (infos.suggestedHTTPCode === 200) {
                if (typeof infos.chat === 'undefined') {
                    return res.status(200).send({status: 'inactive'});
                } else {
                    var calls = infos.chat.calls;
//                    console.log('command: ', command);
                    if (typeof command !== 'string'){
                        console.log('Error : call() received an invalid "command" parameter')
                        return res.sendStatus(400);
                    } else {
                        var now = new Date();

                        var sendNewToken, sendError, newCallAndPush, newStatus, alreadyCalling, newDuration, newStartDateTime, newToken, outgoing;
                        sendNewToken = sendError = newCallAndPush = newStatus = alreadyCalling = newDuration = newStartDateTime = newToken = outgoing = false;

                        var lastCall = {};
                        var elapsed = function() {
                            if (typeof lastCall.startDatetime !== 'undefined') {
                                return now.getTime() - lastCall.startDatetime.getTime();
                            } else {
                                return now.getTime() - lastCall.creationDatetime.getTime();
                            }
                        }

                        // fill in the lastCall object, either by copying the database version if found, or create an empty one
                        if (typeof infos.chat.lastCall.userID === 'undefined') {
                            // this is the very first call issued for this chat document
                            lastCall = {
                                userID : infos.userID,
                                creationDatetime : new Date(now),
                                status : 0 // ringing
                            }
                        } else {
                            // copy the infos.chat.lastCall object from the database manually, as it is a complex mongoosejs object
                            lastCall.userID = infos.chat.lastCall.userID;
                            lastCall.creationDatetime = infos.chat.lastCall.creationDatetime;
                            lastCall.status = infos.chat.lastCall.status;
                            if (typeof infos.chat.lastCall.duration !== 'undefined') lastCall.duration = infos.chat.lastCall.duration;
                            if (typeof infos.chat.lastCall.startDatetime !== 'undefined') lastCall.startDatetime = infos.chat.lastCall.startDatetime;
                            
                            // check whether we are the caller or the callee
                            if (lastCall.userID === infos.userID) {
                                outgoing = true;
                            }
                            
                            // check whether the last call found is still in an "active" state
                            switch (lastCall.status) {
                                case 0: // ringing
                                    if (elapsed() > ringingTime) {
                                        // ringing timed out
                                        console.log('ringing timed out', now.getTime() - (lastCall.creationDatetime.getTime() + ringingTime));
                                        newStatus = 3; // missed

                                        // consider the call as outdated if older than 3 seconds and, in that case, issue a new call
                                        if (elapsed() > ringingTime + 3000){
                                            newCallAndPush = true;
                                            sendNewToken = true;
                                        }
                                    } else {
                                        // still ringing
                                        switch (command) {
                                            case 'call':
                                                // if the actor is the caller, there's nothing special to do
                                                if (outgoing) {
                                                    // silently ignore
                                                    sendNewToken = true;
                                                } else {
                                                    // if the actor is the callee, the call starts
                                                    newStatus = 1; // calling
                                                    sendNewToken = true;
                                                    newDuration = 0;
                                                    newStartDateTime = now;
                                                }
                                                break;
                                            case 'hangup':
                                                if (outgoing) {
                                                    newStatus = 4; // cancelled
                                                } else {
                                                    newStatus = 2; // refused
                                                }
                                                break;
                                            default:
                                                sendNewToken = true;
                                                break;
                                        }
                                    }
                                    break;
                                case 1: // calling
                                    if ((typeof lastCall.duration === 'undefined') || (typeof lastCall.startDatetime === 'undefined')) {
                                        console.log('Error in the calling mechanism : lastCall.startDatetime and lastCall.duration should have been found');
                                        console.log('lastCall.duration ', lastCall.duration);
                                        console.log('lastCall.startDateTime ', lastCall.startDatetime);
                                    } else {
                                        newDuration = elapsed();
                                        
                                        // limit the increase in time so that the connection can expire
                                        if (newDuration - lastCall.duration > 5000) {
                                            console.log('found an EXPIRED CALL');
                                            newStatus = 5; //  -> error (timed out)
                                            if (command === 'call') {
                                                // cancel the duration update
                                                newDuration = false;
                                                newCallAndPush = true;
                                                sendNewToken = true;
                                            }
                                        }

                                        switch (command) {
                                            case 'call':
                                                // treated above
                                                break;
                                            case 'poll':
//                                                console.log('warning : a client is polling but should send "token" events while a call is active');
                                                break;
                                            case 'token':
                                                // a poll while a call is in progress
                                                sendNewToken = true;
                                                break;
                                            case 'hangup':
                                                // 7: terminated by the caller, 6: terminated by the callee
                                                newStatus = (infos.userID === lastCall.userID) ? 7 : 6;
                                                break;
                                            default:
                                                console.log('warning : invalid command : "', command, '"');
                                                break;
                                        }
                                    }
                                    break;
                                default:
                                    // in all those cases, a new call must be created if the command is "call"
                                    switch (command) {
                                        case 'call':
                                            newCallAndPush = true;
                                            sendNewToken = true;
                                            break;
                                        case 'error':
                                            newStatus = 5; // error
                                            break;
                                        default:
                                            // nothing
                                            break;
                                    }
                                    break;
                            }
                        }
        //                
        //                console.log('sendNewToken ', sendNewToken);
        //                console.log('sendError ', sendError);
        //                console.log('newCallAndPush ', newCallAndPush);
        //                console.log('alreadyCalling ', alreadyCalling);
        //                console.log('newStatus', newStatus);


                        if (newStatus !== false) {
                            lastCall.status = newStatus;
                        }

                        if (newDuration !== false) {
                            lastCall.duration = newDuration;
                        }

                        if (newStartDateTime) {
                            lastCall.startDatetime = newStartDateTime;
                        }

                        var update = {};

                        if (newCallAndPush) {
                            // create a new call
                            update.$set = {
                                lastCall : {
                                    userID : infos.userID,
                                    creationDatetime : new Date(now),
                                    status : 0 // ringing
                                }
                            }

                            // and push the lastCall into the "calls" table
                            update.$push = {
                                calls : lastCall
                            }
                        } else {
                            // update the "lastCall" field only
                            update.$set = {
                                lastCall : lastCall
                            }
                        }

//                        console.log('update :\n', update);

                        // compute a new token
                        if (sendNewToken) {
                            newToken = token(infos.username, infos.participantUsername);
                        }

                        // update the database
                        dbChat.chatModel.update( { _id : infos.chat._id }, update, function(err) {
                            if (err) {
                                console.log('Error : ' + err);
                                return res.status(500).send(err);
                            } else {
                                var result;
                                switch (update.$set.lastCall.status) {
                                    case 0: // ringing
                                        result = {status: 'ringing'}; break;
                                    case 1: // calling
                                        result = {status: 'calling'}; break;
                                    case 2: // refused
                                    case 3: // missed
                                    case 4: // cancelled
                                    case 5: // error
                                    case 6: // terminated by callee
                                    case 7: // terminated by caller
                                        result = {status: 'inactive'}; break;
                                }
                                if (sendNewToken) {
                                    result.token = newToken;
                                }
                                result.callDirection = outgoing ? 'outgoing':'incoming';
                                return res.status(200).send(result);
                            }
                        });
                    }// if valid command parameter
                }// if chat === 'undefined'
            } else {
                return res.sendStatus(infos.suggestedHTTPCode);
            }
        });
    } else {
        return res.sendStatus(403);
    }
}

exports.deleteChat = function (req, res) {
    getChat(req, res, false, function(infos) {
        if (infos.suggestedHTTPCode === 200) {
            var now = new Date();
            dbChat.chatModel.update(
                { _id : infos.chat._id, "participants.userID" : infos.userID },
                {
                    $set : {  // if mongodb server is in version 3+, we can use $max to prevent errors in case of a server clock error (which could reveal previously deleted messages)
                        "participants.$.deleteDate" : now
                    },
                    $set : {
                        "participants.$.unreadCount" : 0
                    }
                },
                function(err){
                    if (err){
                        console.log(err);
                        audit.logEvent('User ' + infos.userID, 'Chats', 'Delete chat', 'Chat with', infos.participantUsername, 'failed', err);
                        return res.status(500).send(err);
                    }
                    else{
                        audit.logEvent('User ' + infos.userID, 'Chats', 'Delete chat', 'Chat with', infos.participantUsername, 'succeed', '');
                        return res.sendStatus(200);
                    }
                }
            );
        } else {
            return res.sendStatus(infos.suggestedHTTPCode);
        }
    });
}

exports.setArchiveFlag = function (req, res) {
    getChat(req, res, false, function(infos) {
        if (infos.suggestedHTTPCode === 200) {
            var flag = req.body.flag;
            if (typeof flag !== 'boolean') {
                audit.logEvent('User ' + infos.userID, 'Chats', 'Set archive flag', 'Chat with', infos.participantUsername, 'failed', 'the flag should be a boolean');
                return res.sendStatus(400);
            } else {
                dbChat.chatModel.update(
                    { _id : infos.chat._id, "participants.userID" : infos.userID },
                    {
                        $set : {
                            "participants.$.archive" : flag
                        }
                    },
                    function(err){
                        if (err){
                            console.log('Error : ' + err);
                            audit.logEvent('User ' + infos.userID, 'Chats', 'Set archive flag', 'Chat with', infos.participantUsername, 'failed', err);
                            return res.status(500).send(err);
                        } else {
                            audit.logEvent('User ' + infos.userID, 'Chats', 'Set archive flag', 'Chat with', infos.participantUsername, 'succeed', 'archive flag set to "' + flag + '"');
                            return res.sendStatus(200);
                        }
                    }
                );
            }
        } else {
            return res.sendStatus(infos.suggestedHTTPCode);
        }
    });
}


/*
exports.getArchiveFlag = function (req, res) {
    getChat(req, res, false, function(infos) {
        if (infos.suggestedHTTPCode === 200) {
            var resultFlag;
            if (!infos.chat) {
                // TEMPORARY WORKAROUND UNTILL THE NEXT PULL (DROP THIS)
//                return res.sendStatus(403);
                return res.sendStatus(200);
            } else {
                if (infos.userID === infos.chat.participants[0].userID)
                    resultFlag = infos.chat.participants[0].archive;
                else
                    resultFlag = infos.chat.participants[1].archive;

                return res.status(200).send(resultFlag);
            }
        } else {
            return res.sendStatus(infos.suggestedHTTPCode);
        }
    });
}
*/
