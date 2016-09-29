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
var dbUser          = require('../models/user');
var dbEntry         = require('../models/entry');
var tokenManager    = require('../token_manager');
var audit           = require('../audit-log');
var _               = require('underscore');
var cardsList       = require('../dashboard/cards.json');
var asksList        = require('../dashboard/asks.json');
var json2csv        = require('json2csv');
var fs              = require('fs');

// Build navbar
exports.nav = function(req,res){
    var token = tokenManager.getToken(req.headers);
    if(token !== null){
        var decodedToken = jsonwebtoken.decode(token);
        var userID = decodedToken.id;
        dbUser.userModel.findOne({_id: userID}, function (err, user) {
            if(err){
                console.log(err);
                return res.status(500).send(err);
            } else {
                if (user !== null) {
                    buildNav(user, function(navBuilt){
                        return res.json({
                            nav: navBuilt
                        });
                    });
                } else {
                    return res.sendStatus(401);
                }
            }
        });
    } else {
        return res.sendStatus(401);
    }
};

// Build widgets (asks) 
exports.asks = function(req,res){
    var token = tokenManager.getToken(req.headers);
    if(token !== null){
        var decodedToken = jsonwebtoken.decode(token);
        var userID = decodedToken.id;
        dbUser.userModel.findOne({_id: userID}, function (err, user) {
            if (!err && user != null) {
                buildAsk(user, function(err, ask){
                    if(err) {
                        return res.status(500).send(err);
                    } else {
                        return res.json({
                            ask: ask
                        });
                    }
                });
            } else {
                return res.sendStatus(401);
            }
        });
    } else {
        return res.sendStatus(401);
    }
};

// Build widgets (cards)
exports.cards = function(req,res){
    var token = tokenManager.getToken(req.headers);
    if(token !== null){
        var decodedToken = jsonwebtoken.decode(token);
        var userID = decodedToken.id;
        dbUser.userModel.findOne({_id: userID}, function (err, user) {
            if (!err && user != null) {
                buildCards(user, function(err, cardsBuilt){
                    if(err) {
                        return res.status(500).send(err);
                    } else {
                        return res.json({
                            cards: cardsBuilt
                        });
                    }
                });
            } else {
                return res.sendStatus(401);
            }
        });
    } else {
        return res.sendStatus(401);
    }
};

// Build settings
exports.settings = function(req,res){
    var token = tokenManager.getToken(req.headers);
    if(token != null){
        var decodedToken = jsonwebtoken.decode(token);
        var userID = decodedToken.id;
        dbUser.userModel.findOne({_id: userID}, function (err, user) {
            if (!err && user != null) {
                var role =  parseInt(user.role);
                var items = JSON.parse(JSON.stringify(_.filter(cardsList, function (item){
                    if (item.condition) {
                    	var conditionOk = false;
                    	for(var i = 0; i < item.condition.length; ++i){
                    		if(user.condition.indexOf(item.condition[i]) > -1)
                    			conditionOk = true;
                    	}
                    	
                        return item.roles.indexOf(role) > -1 && conditionOk && item.type === 2;
                    } else {
                        return item.roles.indexOf(role) > -1 && item.type === 2;
                    }
                })));
                
                cleanCards(user, items, function(err, cards){
                    if(err) {
                        return res.status(500).send(err);
                    } else {
                        return res.json({
                            items: cards
                        });
                    }
                });
            } else {
                return res.sendStatus(401);
            }
        });
    } else {
        return res.sendStatus(401);
    }
};


exports.gotit = function(req,res){
    var name = req.body.name || '';
    if (name == '') {
        audit.logEvent('[anonymous]', 'UI', 'Got it', '', '', 'failed',
                       'The user tried to skip a tip but one or more params of the request was not defined');
		return res.sendStatus(400); 
	} else {
        var token = tokenManager.getToken(req.headers);
        if(token !== null){
            var decodedToken = jsonwebtoken.decode(token);
            var userID = decodedToken.id;
            dbUser.userModel.findOne({_id: userID}, {"preferences.app_tips":1}, function (err, user) {
                if(err){
                    console.log(err);
                    return res.status(500).send(err);
                } else {
                    if (user !== null) {
                        user.preferences.app_tips.push(name);
                            user.save(function(err) {
                            if (err) {
                                console.log(err);
                                audit.logEvent('[mongodb]', 'UI', 'Got it', "username", user._id, 'failed',
                                               "Mongodb attempted to save the modified user");
                                return res.status(500).send(err);
                            } else {
                                res.sendStatus(200);
                            }
                        });
                    } else {
                        return res.sendStatus(401);
                    }
                }
            });
        } else {
            return res.sendStatus(401);
        }
    }
};


exports.verifyAppTip = function (req, res) {
    var token = tokenManager.getToken(req.headers);
    if (token !== null) {
        var actorID = jsonwebtoken.decode(token).id;
        if(req.params.name == undefined){
            audit.logEvent(actorID, 'UI', 'Read got it', '', '', 'failed', 
                           'The user could not read the gotit because one or more params of the request was not defined');
            return res.sendStatus(400);
        } else {
            dbUser.userModel.findOne({_id: actorID, }, {"preferences.app_tips": 1}, function (err, user) {
                if (err) {
                    console.log(err);
                    audit.logEvent('[mongodb]', 'UI', 'Read got it', "user id", actorID, 'failed', "Mongodb attempted to find the user");
                    return res.sendStatus(401);
                } else {
                    if (user === null) {
                        audit.logEvent('[mongodb]', 'UI', 'Read got it', '', '', 'failed',
                           'Mongodb attempted to find the user but it revealed not defined');
                        return res.sendStatus(401);
                    } else {
                        if (user.preferences.app_tips.indexOf(req.params.name) > -1) {
                            return res.json({display: false});
                        } else {
                            return res.json({display: true});
                        }
                    }
                }
            });
        }
    } else {
        audit.logEvent('[anonymous]', 'UI', 'Read got it', '', '', 'failed', 'The user was not authenticated');
        return res.sendStatus(401);
    }
};

exports.toggleCard = function(req,res){
    var name = req.body.name || '';
    if (name == '') {
        audit.logEvent('[anonymous]', 'UI', 'Toggle card', '', '', 'failed',
                       'The user tried to ignore a card but one or more params of the request was not defined');
		return res.sendStatus(400); 
	} else {
        var token = tokenManager.getToken(req.headers);
        if(token != null){
            var decodedToken = jsonwebtoken.decode(token);
            var userID = decodedToken.id;
            dbUser.userModel.findOne({_id: userID}, {preferences:1}, function (err, user) {
                if (!err && user != null) {
                    var found = _.findWhere(user.preferences.disabledCards, {name: name});                    
                    if (found) {
                        if(req.body.subitem){
                            var found2 = _.findWhere(found.subitems, {name: req.body.subitem});
                            if(found2){
                                //remove the subitem
                                for(i=0;i<found.subitems.length;i++){
                                    if(found.subitems[i] === found2){
                                        found.subitems.splice(i, 1);
                                    }
                                }
                                if(found.subitems.length === 0){
                                    for(i=0;i<user.preferences.disabledCards.length;i++){
                                        if(user.preferences.disabledCards[i].name === name){
                                            user.preferences.disabledCards.splice(i, 1);
                                        }
                                    }
                                }
                            } else {
                                //add the subitem
                                found.subitems.push({name: req.body.subitem});
                            }
                            user.save(function(err) {
                                if (err) {
                                    console.log(err);
                                    audit.logEvent('[mongodb]', 'UI', 'Toggle card', "userID", userID, 'failed',
                                                   "Mongodb attempted to save the modified user");
                                    return res.status(500).send(err);
                                } else {
                                    res.sendStatus(200);
                                }
                            });
                        } else {
                            if(found.subitems.length > 0){
                                found.subitems = [];
                            } else {
                                for(i=0;i<user.preferences.disabledCards.length;i++){
                                    if(user.preferences.disabledCards[i].name === name){
                                        user.preferences.disabledCards.splice(i, 1);
                                    }
                                }
                            }
                            user.save(function(err) {
                                if (err) {
                                    console.log(err);
                                    audit.logEvent('[mongodb]', 'UI', 'Toggle card', "userID", userID, 'failed',
                                                   "Mongodb attempted to save the modified user");
                                    return res.status(500).send(err);
                                } else {
                                    res.sendStatus(200);
                                }
                            });
                        }
                    } else {
                        var card = {
                            name: name
                        };
                        
                        if(req.body.subitem){
                            card.subitems = [{name: req.body.subitem}];
                        }

                        user.preferences.disabledCards.push(card);
                        user.save(function(err) {
                            if (err) {
                                console.log(err);
                                audit.logEvent('[mongodb]', 'UI', 'Toggle card', "userID", userID, 'failed',
                                               "Mongodb attempted to save the modified user");
                                return res.status(500).send(err);
                            } else {
                                res.sendStatus(200);
                            }
                        });
                    }
                }
                else{
                    return res.sendStatus(401);
                }
            });

        } else {
            return res.sendStatus(401);
        }
    }
};

exports.auditClient = function(req,res){
    var token = tokenManager.getToken(req.headers);
    if(token !== null){
        var decodedToken = jsonwebtoken.decode(token);
        var userID = decodedToken.id;
        dbUser.userModel.findOne({_id: userID}, function (err, user) {
            if(err){
                console.log(err);
                return res.status(500).send(err);
            } else {
                if (user !== null) {
                    var fields = ['screen', 'element', 'datetime'];
                    var fieldNames  = ['', '', ''];
                    var rows = [{
                        screen: req.body.screen,
                        element: req.body.element,
                        datetime: req.body.datetime
                    }];

                    json2csv({ data: rows, fields: fields, fieldNames: fieldNames, del:';', quotes: "" }, function(err, csv) {
                        if(err){
                            console.log(err);
                            return res.status(500).send(err);
                        } else {
                            if (!fs.existsSync("./audit-client")) {
                                fs.mkdirSync("./audit-client");
                            }
                            var theFile = "./audit-client/" + user.username + ".csv";
                            if (!fs.existsSync(theFile)) {
                                fs.writeFile(theFile, csv, function(err) {
                                    if (err){
                                        console.log(err);
                                        return res.status(500).send(err);
                                    } else {
                                        return res.sendStatus(200);
                                    }
                                });
                            } else {
                                fs.appendFile(theFile, "\n" + csv, function (err) {
                                    if (err){
                                        console.log(err);
                                        return res.status(500).send(err);
                                    } else {
                                        return res.sendStatus(200);
                                    }
                                });
                            }
                        }
                    });
                } else {
                    return res.sendStatus(401);
                }
            }
        });
    } else {
        return res.sendStatus(401);
    }
};

exports.todo = function (req, res) {
    var token = tokenManager.getToken(req.headers);
    if (token !== null) {
        var actorID = jsonwebtoken.decode(token).id;
        var since = new Date();since.setHours(0,0,0,0);
        var or = [];
        var list = JSON.parse(JSON.stringify(_.where(cardsList, {todo: true})));

        cleanCards({_id: actorID}, list, function(err, todoList){
            if(err) {
                return res.status(500).send(err);
            } else {
                todoList = _.where(todoList, {enabled: true});

                for(i=0;todoList.length>i;i++){
                    if(todoList[i].subitems){
                        todoList[i].subitems = _.filter(todoList[i].subitems, function (sub){
                            return sub.enabled && new Date() >= new Date().setHours(
                                sub.params.timeslot.from[0],
                                sub.params.timeslot.from[1],
                                sub.params.timeslot.from[2],
                                sub.params.timeslot.from[3]
                            );
                        });
                    }
                }

                if(todoList.length > 0){
                    for(i=0;todoList.length>i;i++){
                        or.push({type : todoList[i].name});
                    }
                    
                    var query = {
                        $and:[{
                            userID : actorID
                        },{
                            datetimeAcquisition : {$gt: since}
                        },{
                            $or: or
                        }]
                    };
                    
                    for(i=0;todoList.length>i;i++){
                        if(todoList[i].subitems){
                            todoList[i].counter = todoList[i].subitems.length;
                        }
                    }
                    
                    dbEntry.entryModel.find(query).exec(function(err, entries) {
                        if (err) {
                            console.log(err);
                            return res.sendStatus(500);
                        } else {
                            if (entries === null) {
                                return res.sendStatus(401);
                            } else {
                                for(i=0;entries.length>i;i++){
                                    for(j=0;todoList.length>j;j++){
                                        if(todoList[j].name === entries[i].type){
                                            for(k=0;todoList[j].subitems.length>k;k++){
                                                if(entries[i].datetimeAcquisition >= new Date(entries[i].datetimeAcquisition).setHours(
                                                    todoList[j].subitems[k].params.timeslot.from[0],
                                                    todoList[j].subitems[k].params.timeslot.from[1],
                                                    todoList[j].subitems[k].params.timeslot.from[2],
                                                    todoList[j].subitems[k].params.timeslot.from[3]
                                                ) && 
                                                   entries[i].datetimeAcquisition < new Date(entries[i].datetimeAcquisition).setHours(
                                                    todoList[j].subitems[k].params.timeslot.to[0],
                                                    todoList[j].subitems[k].params.timeslot.to[1],
                                                    todoList[j].subitems[k].params.timeslot.to[2],
                                                    todoList[j].subitems[k].params.timeslot.to[3]
                                                ) && 
                                                   !todoList[j].subitems[k].done){
                                                    todoList[j].subitems[k].done = true;
                                                    todoList[j].counter--;
                                                }
                                            }
                                        }
                                    }
                                }
                                return res.json(todoList);
                            }
                        }
                    });
                } else {
                    return res.json([]);
                }
             }
        });
    } else {
        audit.logEvent('[anonymous]', 'UI', 'Get todo', '', '', 'failed', 'The user was not authenticated');
        return res.sendStatus(401);
    }
};


function buildNav(user, callback){
    //Top-Left Nav
    var agenda = {
        href: 'home.agenda.main',
        title: 'Agenda'
    };    
    var tips = {
        href: 'home.tips.main',
        title: 'Tips & Tricks'
    };
    
    //Top-Right Nav
    var userBox = 'user';
    var notificationsBox = 'notifications';
    var messagesBox = 'messages';
    
    var nav = {
        left: [],
        right:[]
    };
    
    switch(user.role){
        case '1':
            nav.right.push(userBox);
        break;
        case '2':
            nav.left.push(agenda);
            nav.right.push(messagesBox);
            nav.right.push(notificationsBox);
            nav.right.push(userBox);
        break;
        case '3':
            nav.left.push(agenda);
            nav.left.push(tips);
            nav.right.push(messagesBox);
            nav.right.push(notificationsBox);
            nav.right.push(userBox);
        break;
    }
    callback(nav);
};


function buildAsk(user, callback){    
    var role =  parseInt(user.role);
    var asks = JSON.parse(JSON.stringify(_.filter(asksList, function (ask){
        if (ask.condition) {
        	var conditionOk = false;
        	for(var i = 0; i < ask.condition.length; ++i){
        		if(user.condition.indexOf(ask.condition[i]) > -1)
        			conditionOk = true;
        	}
            return ask.roles.indexOf(role) > -1 && conditionOk;
        } else {
            return ask.roles.indexOf(role) > -1;
        }
    })));
    asks = _.sortBy(asks, 'order');

    //Verify if those asks are disabled
    cleanAsks(user, asks, function(err, asks){
        if(err) {
            callback(err);
        } else {
            getAsk(user, asks, function(err, ask){
                if(err) {
                    callback(err);
                } else {
                    callback(null, ask);
                }
            });
        }
    });
};

function cleanAsks(user, cards, callback){
    var result = [];
    function myLoop(i) {
        if( i < cards.length ) {
            checkAsks(user, cards[i], function(err, card){
                if(err) {
                    callback(err);
                } else {
                    if(card !== null){
                        result.push(card);
                    }
                    myLoop(i+1);
                }
            })
        } else {
            callback(null, result);
        }
    }
    myLoop(0);
};

function checkAsks(user, ask, callback){
    dbUser.userModel.findOne({_id: user._id, "preferences.disabledCards": {$elemMatch: {name: ask.card}}}, function (err, aUser) {
        if (err) {
            console.log(err);
            callback(err);
        } else {
            if(aUser === null) {
                ask.enabled = true;
            } else {
                ask.enabled = false;
            }
            callback(null, ask);
        }
    });
};

function getAsk(user, asks, callback){
    function myLoop(i) {
        if (i < asks.length) {
            chooseAsk(user, asks[i], function (err, ask){
                if(err) {
                    callback(err);
                } else {
                    if(ask !== null){
                        callback(null, ask);
                    } else {
                        myLoop(i+1);
                    }
                }
            })
        } else {
            callback(null, null);
        }
    }
    myLoop(0);
};

function chooseAsk(user, ask, callback){
    if(ask.enabled){
        var since = new Date();
        switch(ask.name){
            case 'ask_meal'://3 times per day - for breakfast/lunch/dinner
                if((since >= new Date().setHours(7, 0, 0) && since <= new Date().setHours(10, 0, 0)) || (since >= new Date().setHours(12, 0, 0) && since <= new Date().setHours(14, 0, 0)) || (since >= new Date().setHours(18, 0, 0) && since <= new Date().setHours(22, 0, 0))){
                    since.setHours(since.getHours() - 2);
                } else {
                    callback(null, null);
                    return;
                }
            break;
            case 'ask_mood'://once a day at 2 pm 
                if((since >= new Date().setHours(13, 55, 0) )){
                	since.setMinutes(since.getMinutes() - 1);
                } else {
                    callback(null, null);
                    return;
                }
            break;
            case 'ask_weight'://once a month
                since.setMonth(since.getMonth() - 1);
            break;
            case 'ask_activity'://once a day - by the end of the day
            case 'ask_mobility'://once a day - by the end of the day
                if(since >= new Date().setHours(17, 0, 0)){
                    since.setDate(since.getDate() - 1);
                } else {
                    callback(null, null);
                    return;
                }
            break;
        }

        var query = {
            userID : user._id,
            type: ask.name.substr(4, ask.name.length-4),
            datetimeAcquisition: {$gt: since}
        };

        dbEntry.entryModel.find(query).exec(function(err, entries) {
            if (err){
                console.log(err);
                audit.logEvent('[mongodb]', 'UI', 'UI build an ask', '', '', 'failed', 'Mongodb attempted to retrieve entries');
                callback(err);
                return;
            } else {
                if(entries && entries.length == 0) {
                    callback(null, ask);
                    return;
                } else {
                    callback(null, null);
                    return;
                }
            }
        });

    } else {
        callback(null, null);
        return;
    }
};



function buildCards(user, callback){
    var role =  parseInt(user.role);
    var cards = JSON.parse(JSON.stringify(_.filter(cardsList, function (card){
        if (card.condition) {
        	var conditionOk = false;
        	for(var i = 0; i < card.condition.length; ++i){
        		if(user.condition.indexOf(card.condition[i]) > -1)
        			conditionOk = true;
        	}
            return card.roles.indexOf(role) > -1 && conditionOk;
        } else {
            return card.roles.indexOf(role) > -1;
        }
    })));
    var abstracts = _.where(cards, {abstract: true});
    cards = _.where(cards, {abstract: undefined});
    
    for(i=0;i<abstracts.length;i++){
        cards = _.union(cards, abstracts[i].subitems);
    }
    cards = _.sortBy(cards, 'order');

    //Verify if those cards are disabled
    cleanCards(user, cards, function(err, cards){
        if(err) {
            callback(err);
        } else {
            cards = _.where(cards, {enabled: true});
            callback(null, (cards));
        }
    });
};

function cleanCards(user, cards, callback){
    function myLoop(i) {
        if( i < cards.length ) {
            checkCard(user, cards, i, function(err){
                if(err) {
                    callback(err);
                } else {
                    myLoop(i+1);
                }
            })
        } else {
            callback(null, cards);
        }
    }
    myLoop(0);
};


function checkCard(user, cards, i, callback){
    var name = cards[i].abstractName ? cards[i].abstractName : cards[i].name;
    dbUser.userModel.findOne({_id: user._id, "preferences.disabledCards": {$elemMatch: {name: name}}}, function (err, aUser) {
        if (err) {
            console.log(err);
            callback(err);
        } else {
            if(aUser !== null) {
                for(j=0; j<aUser.preferences.disabledCards.length; j++){
                    if(aUser.preferences.disabledCards[j].name === name){
                        if(aUser.preferences.disabledCards[j].subitems.length > 0){
                            for(k=0;k < cards[i].subitems.length;k++){
                                for(l=0;l < aUser.preferences.disabledCards[j].subitems.length;l++){
                                    if(cards[i].subitems[k].name === aUser.preferences.disabledCards[j].subitems[l].name){
                                        cards[i].subitems[k].enabled = false;
                                    }
                                }
                            }
                        } else {
                            cards[i].enabled = false;
                        }
                    }
                }
            }
            callback(null);
        }
    });
};