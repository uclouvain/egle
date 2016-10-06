/*
 * The copyright in this software is being made available under MIT License 
 * MIT License, included below. This software may be subject to other third 
 * party and contributor rights, including patent rights, and no such rights
 * are granted under this license.
 *
 * Copyright (c) 2014-2016, Universite catholique de Louvain (UCL), Belgium
 * Copyright (c) 2014-2016, Professor Benoit Macq
 * Copyright (c) 2014-2016, Aissa Ghouti
 * Copyright (c) 2014-2016, Benoît Dereck-Tricot
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
var fs              = require('fs');
var nconf           = require('nconf');
var db              = require('../models/user');
var tokenManager    = require('../token_manager');
var audit           = require('../audit-log');
var https           = require('https');
var crypto          = require('crypto');
var nodemailer      = require('nodemailer');

//Config
nconf.file("config/server.json");
var tokenSecret     = nconf.get('token').secret;
var recaptchaSecret = nconf.get('reCAPTCHA').secret;
var mailerConfig = nconf.get('mailer');

exports.lostPassword = function(req, res) {
	var email = req.body.email || '';
	var captcha = req.body.captcha || '';
    
    if (email === '' || captcha === '') {
        audit.logEvent('[anonymous]', 'Users', 'Lost password', '', '', 'failed',
                       'The user tried to send an email to reset password in but one or more params of the request was not defined');
		return res.sendStatus(400); 
	} else {
        verifyRecaptcha(captcha, function(success) {
            if (success) {
                db.userModel.findOne({email: email}, function (err, user) {
                    if (err) {
                        console.log(err);
                        audit.logEvent('[mongodb]', 'Users', 'Lost password', 'used email', email, 'failed', 'Mongodb attempted to find the email');
                        return res.status(500).send(err);
                    } else {
                        if (user === null) {
                            audit.logEvent('[anonymous]', 'Users', 'Lost password', 'used email', email, 'failed', 
                                           'The user tried to send an email to reset password but the email does not exist');
                            return res.json({
                                exists: false,
                                captcha: true
                            });
                        } else {
                            //Create a token
                            crypto.randomBytes(20, function(err, buf) {
                                if (err) {
                                    console.log(err);
                                    return res.status(500).send(err);
                                } else {
                                    var token = buf.toString('hex');
                                    user.resetPasswordToken = token;
                                    user.resetPasswordExpires = Date.now() + 3600000;
                                    user.save(function(err) {
                                        if (err) {
                                            console.log(err);
                                            audit.logEvent('[mongodb]', 'Users', 'Lost password', "username", user.username, 'failed',
                                                           "Mongodb attempted to save the modified user");
                                            return res.status(500).send(err);
                                        } else {
                                            var rep = [['[name]', user.username], ['[link]', "https://" + req.headers.host + "/recovery/reset/" + token]];
                                            replaceInFile('./emails/' + user.language + '_reset.html', rep, function (err, result) {
                                                if (err) {
                                                    console.log(err);
                                                    return res.status(500).send(err);
                                                } else {
                                                    //Send an email with a link containing the key
                                                    sendMail({to: user.email, subject: 'Password Reset', html: result}, function(err){
                                                        if (err) {
                                                            return res.status(500).send(err);
                                                        } else {
                                                            return res.json({
                                                                exists: true,
                                                                captcha: true
                                                            });
                                                        }
                                                    });
                                                }
                                            });
                                        }
                                    });
                                }
                            });
                        }
                    }
                });
            } else {
                //Captcha failed
                return res.json({
                    captcha: false
                });
            }
        });
    }
};

exports.resetPassword = function(req, res) {
    var token = req.body.token || '';
	var password = req.body.newPassword || '';
	var passwordConfirmation = req.body.newPasswordConfirmation || '';
	if (password === '' || passwordConfirmation === '' || token === '') {
        audit.logEvent('[anonymous]', 'Users', 'Reset password', '', '', 'failed',
                       'The user tried to reset password but one or more params of the request was not defined');
		return res.sendStatus(400); 
	} else {
        if (password !== passwordConfirmation) {
            audit.logEvent('[anonymous]', 'Users', 'Reset password', '', '', 'failed',
                           'The user tried to change his password but the password was not equal to its confirmation');
            return res.sendStatus(401); 
        } else {
            db.userModel.findOne({resetPasswordToken: token, resetPasswordExpires: {$gt: Date.now()}}, function(err, user) {
                if (err) {
                    console.log(err);
                    audit.logEvent('[mongodb]', 'Users', 'Reset password', '', '', 'failed', 'Mongodb attempted to find a user by token');
                    return res.status(500).send(err);
                } else {
                    if (!user) {
                        return res.json({
                            token: false
                        });
                    } else {
                        user.password = password;
                        user.resetPasswordToken = undefined;
                        user.resetPasswordExpires = undefined;
                        user.save(function(err) {
                            if (err) {
                                console.log(err);
                                audit.logEvent('[mongodb]', 'Users', 'Reset password', "username", user.username, 'failed',
                                               "Mongodb attempted to save the modified user");
                                return res.status(500).send(err);
                            } else {
                                audit.logEvent(user.username, 'Users', 'Reset password', "username", user.username, 'succeed',
                                               'The user has successfully changed the password of his account');

                                return res.json({
                                    email : user.email,
                                    token: true,
                                    changed: true
                                });
                            }
                        });
                    }
                }
            });
        }
    }
};

exports.signin = function(req, res) {
	var email = req.body.email || '';
	var password = req.body.password || '';
    var expiration = tokenManager.TOKEN_EXPIRATION;
    
	if (email === '' || password === '') {
        audit.logEvent('[anonymous]', 'Users', 'Sign in', '', '', 'failed',
                       'The user tried to sign in but one or more params of the request was not defined');
		return res.sendStatus(400); 
	} else {
        if(req.body.rememberme){
            expiration = 1000 * 60 * 24 * 7;
        }

        db.userModel.findOne({email: email}, function (err, user) {
            if (err) {
                console.log(err);
                audit.logEvent('[mongodb]', 'Users', 'Sign in', 'used email', email, 'failed', 'Mongodb attempted to find the email');
                return res.status(500).send(err);
            } else {
                if (user) {
                    if(user.activationToken !== '0'){
                        audit.logEvent('[anonymous]', 'Users', 'Sign in', 'used email', email, 'failed', 
                                       'The user tried to sign in but the account is not activated');
                        return res.send({
                            activated:false
                        });
                    } else {
                        user.comparePassword(password, function(isMatch) {
                            if (!isMatch) {
                                audit.logEvent(user.username, 'Users', 'Sign in', 'used email', email, 'failed',
                                               'The user tried to sign in but the password was incorrect');
                                return res.sendStatus(401);
                            } else {
                                var token = jsonwebtoken.sign({id: user._id, condition : user.condition}, tokenSecret, { expiresInMinutes: expiration });
                                audit.logEvent(user.username, 'Users', 'Sign in', 'used email', email, 'succeed',
                                               'The user has successfully signed in to his account');
                                
                                // frequency
                                var since = new Date();
                                since.setHours(since.getHours() - 2); 
                                if(user.frequency.lastTime){
                                    if(user.frequency.lastTime < since){
                                        user.frequency.counter++;
                                        user.frequency.lastTime = new Date();
                                        user.save(function(err) {
                                            if (err) {
                                                console.log(err);
                                                return res.status(500).send(err);
                                            } else {
                                                return res.status(200).json({
                                                    activated:true,
                                                    token:token,
                                                    language: user.language
                                                });
                                            }
                                        });
                                    } else {
                                        return res.status(200).json({
                                            activated:true,
                                            token:token,
                                            language: user.language
                                        });
                                    }
                                } else {
                                    user.frequency = {
                                        counter: 1,
                                        lastTime: new Date()
                                    }
                                    user.save(function(err) {
                                        if (err) {
                                            console.log(err);
                                            return res.status(500).send(err);
                                        } else {
                                            return res.status(200).json({
                                                activated:true,
                                                token:token,
                                                language: user.language
                                            });
                                        }
                                    });
                                }
                            }
                        });
                    } 
                } else {
                    audit.logEvent('[anonymous]', 'Users', 'Sign in', 'used email', email, 'failed', 
                                   'The user tried to sign in but the used email does not exist');
                    console.log('Sign in : The user tried to sign in but the used email does not exist. (email : '+email+')');
                    return res.sendStatus(401);
                }
            }
        });
    }
};

exports.signup = function(req, res) {
    var captcha = req.body.captcha || '';
    var email = req.body.email || '';
	var username = req.body.username || '';
	var password = req.body.password || '';
	var passwordConfirmation = req.body.passwordConfirmation || '';
    var role = req.body.role || '';
    var condition = req.body.condition || '';
    var language = req.body.language || '';
    
	if (captcha === '' || email === '' || username === '' || password === '' || role === '' || language === '') {
        audit.logEvent('[anonymous]', 'Users', 'Sign up', '', '', 'failed',
                       'The user could not register because one or more params of the request was not defined');
		return res.sendStatus(400);
	} else {
        if (password !== passwordConfirmation) {
            audit.logEvent(userID, 'Users', 'Sign up', '', '', 'failed',
                           'The user could not register cause the password was not equal to its confirmation');
            return res.sendStatus(401); 
        } else { 
            verifyRecaptcha(captcha, function(success) {
            	//if (success) {
            	if (true) {
                    var user = new db.userModel();
                    user.email = email;
                    user.username = username;
                    user.password = password;
                    user.role = role;
                    if (condition) {
                        user.condition = condition;
                    }
                    user.language = language;

                    //Create a token
                    crypto.randomBytes(20, function(err, buf) {
                        if (err) {
                            console.log(err);
                            return res.status(500).send(err);
                        } else {
                            var token = buf.toString('hex');
                            user.activationToken = token;
                            user.save(function(err) {
                                if (err) {
                                    console.log(err);
                                    audit.logEvent('[mongodb]', 'Users', 'Sign up', "username", user.username, 'failed', 
                                                   "Mongodb attempted to save the new user");
                                    return res.status(500).send(err);
                                } else {
                                    audit.logEvent(user.username, 'Users', 'Sign up', 'username', user.username, 'succeed',
                                                   'The user has successfully created an account');
                                    var rep = [['[name]', user.username], ['[link]', "https://" + req.headers.host + "/signin/activation/" + token]];
                                    //console.log("rep: " + JSON.stringify(rep));
                                    replaceInFile('./emails/' + user.language + '_activation.html', rep, function (err, result) {
                                        if (err) {
                                            console.log(err);
                                            return res.status(500).send(err);
                                        } else {
                                            //Send an email with a link containing the key
                                            sendMail({to: user.email, subject: 'Account Activation', html: result}, function(err){
                                                if (err) {
                                                    console.log(err);
                                                    return res.status(500).send(err);
                                                }
                                                return res.json({
                                                    captcha: true
                                                });
                                            });
                                        }
                                    });
                                }
                            });
                        }
                    });
                } else {
                    return res.json({
                        captcha: false
                    });
                }
            });
        }
    }
};

exports.activation = function(req, res) {
	var token = req.body.token || '';
	if (token === '') {
        audit.logEvent('[anonymous]', 'Users', 'Activation', '', '', 'failed',
                       'The user tried to reset password but one or more params of the request was not defined');
		return res.send(400); 
	} else {
        db.userModel.findOne({ activationToken: token }, function(err, user) {
            if (err) {
                console.log(err);
                audit.logEvent('[mongodb]', 'Users', 'Activation', '', '', 'failed', 'Mongodb attempted to find a user by token');
                return res.status(500).send(err);
            } else {
                if (!user) {
                    return res.json({
                        activated: false
                    });
                } else {
                    user.activationToken = "0";
                    user.save(function(err) {
                        if (err) {
                            console.log(err);
                            audit.logEvent('[mongodb]', 'Users', 'Activation', "username", user.username, 'failed',
                                           "Mongodb attempted to save the modified user");
                            return res.status(500).send(err);
                        } else {
                            audit.logEvent(user.username, 'Users', 'Activation', "username", user.username, 'succeed',
                                           'The user has successfully activated his account');
                            return res.json({
                                activated: true,
                                email: user.email
                            });
                        }
                    });
                }
            }
        });
    }
};


exports.signout = function(req, res) {
    var token = tokenManager.getToken(req.headers);
    if(token !== null){
        tokenManager.expireToken(token, true);
        audit.logEvent(jsonwebtoken.decode(token).id, 'Users', 'Sign out', '', '', 'succeed', 'A user has successfully logged out');
        delete req.user;
        return res.sendStatus(200);
    } else {
        audit.logEvent('[anonymous]', 'Users', 'Sign out', '', '', 'failed', 'The user was not authenticated');
        return res.send(401);
    }
};

exports.changePassword = function(req, res) {
    var token = tokenManager.getToken(req.headers);
    if(token != null){
        var userID = jsonwebtoken.decode(token).id;
        var oldPassword = req.body.oldPassword || '';
        var newPassword = req.body.newPassword || '';
        var newPasswordConfirmation = req.body.newPasswordConfirmation || '';

        if (oldPassword === '' || newPassword === '' || newPasswordConfirmation === '') {
            audit.logEvent(userID, 'Users', 'Change password', '', '', 'failed',
                           'The user tried to change his password but one or more params of the request was not defined');
            return res.sendStatus(400); 
        } else {
            if (newPassword !== newPasswordConfirmation) {
                audit.logEvent(userID, 'Users', 'Change password', '', '', 'failed',
                               'The user tried to change his password but the password was not equal to its confirmation');
                return res.json({
                    new: false
                });
            } else {
                db.userModel.findOne({_id: userID}, function (err, user) {
                    if (err) {
                        console.log(err);
                        audit.logEvent('[mongodb]', 'Users', 'Change password', "user id", userID, 'failed', "Mongodb attempted to find the user");
                        return res.send(500).send(err);
                    } else {
                        if (user == undefined) {
                            audit.logEvent('[mongodb]', 'Users', 'Change password', '', '', 'failed',
                                   'Mongodb attempted to find the user but it revealed not defined');
                            return res.sendStatus(401);
                        } else {
                            user.comparePassword(oldPassword, function(isMatch) {
                                if (!isMatch) {
                                    audit.logEvent(user.username, 'Users', 'Change password', '', '', 'failed',
                                                   'The user tried to change the password but the old one was incorrect');
                                    return res.json({
                                        old: false,
                                        new: true
                                    });
                                }
                                else{
                                    user.password = newPassword;
                                    user.save(function(err) {
                                        if (err) {
                                            console.log(err);
                                            audit.logEvent('[mongodb]', 'Users', 'Change password', "username", user.username, 'failed',
                                                           "Mongodb attempted to save the modified user");
                                            return res.status(500).send(err);
                                        } else {
                                            audit.logEvent(user.username, 'Users', 'Change password', '', '', 'succeed',
                                                           'The user has successfully changed the password of his account');
                                            return res.json({
                                                old: true,
                                                new: true
                                            });
                                        }
                                    });
                                }
                            });
                        }
                    }
                });
            }
        }
    } else {
        audit.logEvent('[anonymous]', 'Users', '', '', '', 'failed','The user was not authenticated');
        return res.send(401);
    }
};

exports.profile = function(req, res){
    var token = tokenManager.getToken(req.headers);
    if(token !== null){
        var actorID = jsonwebtoken.decode(token).id;
        db.userModel.findOne({
            _id: actorID
        }, {
            _id: 0, username: 1, "preferences.avatar": 1, birthdate: 1, gender: 1, condition: 1, homeAddress: 1, phone: 1, email: 1, language: 1
        }, function (err, user) {
            if (err) {
                console.log(err);
                audit.logEvent('[mongodb]', 'Users', 'Profile', "user id", actorID, 'failed', "Mongodb attempted to find the user");
                return res.send(500).send(err);
            } else {
                if (user === null) {
                    audit.logEvent('[mongodb]', 'Users', 'Read profile', '', '', 'failed', 'Mongodb attempted to find the user but it revealed not defined');
                    return res.sendStatus(401);
                } else {
                    return res.json(user);
                }
            }
        });
    } else {
        audit.logEvent('[anonymous]', 'Users', 'Read profile', '', '', 'failed','The user was not authenticated');
        return res.sendStatus(401); 
    }
};

exports.update = function(req, res) {
    var token = tokenManager.getToken(req.headers);
    if(token != null){
        var userID = jsonwebtoken.decode(token).id;
        var avatar = req.body.avatar;
        var birthdate = req.body.birthdate;
        var gender = req.body.gender;
        var condition = req.body.condition;
        var homeAddress = req.body.homeAddress;
        var phone = req.body.phone;
        var email = req.body.email;
        var language = req.body.language;
        
        var toUpdate = {};
        var toRemove = {};
        
        // -- Required if exist --
        //condition
        if (condition !== undefined && condition != ''){
            toUpdate['condition'] = condition;
        }
        
        //email
        if (email !== undefined && email != ''){
            toUpdate['email'] = email;
        }
        
        //language
        if (language !== undefined && language != ''){
            toUpdate['language'] = language
        };
        
        // -- Not Required --
        //avatar
        if (avatar !== undefined && avatar != '') {
            toUpdate['preferences.avatar'] = avatar
        } else if (avatar === '') {
            toRemove['preferences.avatar'] = 1
        };
        
        //birthdate
        if (birthdate !== undefined && birthdate != ''){
            toUpdate['birthdate'] = birthdate
        } else if (birthdate === '') {
            toRemove['birthdate'] = 1
        };
        
        //gender
        if (gender !== undefined && gender != ''){
            toUpdate['gender'] = gender
        } else if (gender === ''){
            toRemove['gender'] = 1
        };

        //homeAddress
        if (homeAddress !== undefined && homeAddress !== ''){
            toUpdate['homeAddress'] = homeAddress
        } else if (homeAddress === '') {
            toRemove['homeAddress'] = 1
        };

        //phone
        if (phone !== undefined && phone !== ''){
            toUpdate['phone'] = phone
        } else if (phone === ''){
            toRemove['phone'] = 1
        };
        
        db.userModel.findOne({_id: userID}, function (err, user) {
            if (err) {
                console.log(err);
                return res.send(500).send(err);
            } else {
                if (user === null) {
                    return res.sendStatus(401);
                } else {
                    if(Object.keys(toRemove).length > 0 && Object.keys(toUpdate).length > 0){
                        //remove AND update
                        db.userModel.update({_id:userID}, { $unset: toRemove }, function(err, nbRow) {
                            if (err) {
                                console.log(err);
                                return res.status(500).send(err);
                            } else {
                                user.save(function(err) {
                                    if (err) {
                                        console.log(err);
                                        audit.logEvent('[mongodb]', 'Users', 'Update', "username", user.username, 'failed',
                                                       "Mongodb attempted to save the new user");
                                        return res.status(500).send(err);
                                    } else {
                                        db.userModel.update({_id:userID}, toUpdate, function(err, nbRow) {
                                            if (err) {
                                                console.log(err);
                                                return res.status(500).send(err);
                                            } else {
                                                user.save(function(err, savedUser) {
                                                    if (err) {
                                                        console.log(err);
                                                        audit.logEvent('[mongodb]', 'Users', 'Update', "username", user.username, 'failed',
                                                                       "Mongodb attempted to save the new user");
                                                        return res.status(500).send(err);
                                                    } else {
                                                    	if(toUpdate.condition){
                                                    	 var expiration = tokenManager.TOKEN_EXPIRATION;
                                                    	 var token = jsonwebtoken.sign({id: user._id, condition : toUpdate.condition}, tokenSecret, { expiresInMinutes: expiration });

                                                    	 return res.status(200).json({activated:true,token:token,language: user.language});
                                                    	}else{
                                                    		return res.sendStatus(200);
                                                    	}
                                                    }
                                                });
                                            }
                                        });
                                    }
                                });
                            }
                        });
                    } else if(Object.keys(toRemove).length == 0 && Object.keys(toUpdate).length > 0){
                        //just update
                        db.userModel.update({_id:userID}, toUpdate, function(err, nbRow) {
                            if (err) {
                                console.log(err);
                                return res.status(500).send(err);
                            } else {
                                user.save(function(err, savedUser) {
                                    if (err) {
                                        console.log(err);
                                        audit.logEvent('[mongodb]', 'Users', 'Update', "username", user.username, 'failed',
                                                       "Mongodb attempted to save the new user");
                                        return res.status(500).send(err);
                                    } else {
                                    	if(toUpdate.condition){
                                       	 var expiration = tokenManager.TOKEN_EXPIRATION;
                                       	 var token = jsonwebtoken.sign({id: user._id, condition : toUpdate.condition}, tokenSecret, { expiresInMinutes: expiration });

                                       	 return res.status(200).json({activated:true,token:token,language: user.language});
                                       	}else{
                                       		return res.sendStatus(200);
                                       	}
                                    }
                                });
                            }
                        });
                    } else if(Object.keys(toRemove).length > 0 && Object.keys(toUpdate).length == 0){
                        //just remove
                        db.userModel.update({_id:userID}, { $unset: toRemove }, function(err, nbRow) {
                            if (err) {
                                console.log(err);
                                return res.status(500).send(err);
                            } else {
                                user.save(function(err, savedUser) {
                                    if (err) {
                                        console.log(err);
                                        audit.logEvent('[mongodb]', 'Users', 'Update', "username", user.username, 'failed',
                                                       "Mongodb attempted to save the new user");
                                        return res.status(500).send(err);
                                    } else {
                                    	if(toUpdate.condition){
                                       	 var expiration = tokenManager.TOKEN_EXPIRATION;
                                       	 var token = jsonwebtoken.sign({id: user._id, condition : toUpdate.condition}, tokenSecret, { expiresInMinutes: expiration });

                                       	 return res.status(200).json({activated:true,token:token,language: user.language});
                                       	}else{
                                       		return res.sendStatus(200);
                                       	}
                                    }
                                });
                            }
                        })
                    }
                }
            }
        });
    } else {
        return res.send(401);
    }
};




exports.getUser = function getUser(userID, callback){
    db.userModel.findOne({ _id : userID }, {}, function(err, user) {
        if (err)
            callback(err, null);
        else{
            callback(null, user);
        }
    });
};

exports.getUserID = function getUserID(username, callback){
    db.userModel.findOne({ username : username }, {_id: 1}, function(err, userID) {
        if (err)
            callback(err, null);
        else if ((!userID) || (typeof userID._id === 'undefined'))
            callback("User " +username+ " not found.", null);
        else
            callback(null, userID._id);
    });
};

exports.getUsername = function getUsername(userID, callback){
    db.userModel.findOne({ _id : userID }, {username: 1, _id: 0}, function(err, username) {
        if (err)
            callback(err, null);
        else if (typeof username.username === 'undefined')
            callback("User " +userID+ " not found.", null);
        else
            callback(null, username.username);
    });
};




function sendMail(mail, callback) {
    var smtpTransport = nodemailer.createTransport({
    	/*
        host: mailerConfig.host,
        port: mailerConfig.port,
        secure: true,
        auth: {
            user: mailerConfig.auth.user,
            pass: mailerConfig.auth.pass
        }
        */
    });

    var mailOptions = {
        to: mail.to,
        //from: mailerConfig.sender.name + ' <' + mailerConfig.sender.address + '>',
        from: 'noReply@egle.com',
        subject: mail.subject,
        html: mail.html
    };
    console.log("mail: " + JSON.stringify(mailOptions));
    smtpTransport.sendMail(mailOptions, function(err) {
        if(err){
            console.log(err);
            callback(err);
        } else {
            callback(null);
        }
    });
}

function verifyRecaptcha(key, callback) {
    https.get("https://www.google.com/recaptcha/api/siteverify?secret=" + recaptchaSecret + "&response=" + key, function(res) {
        var data = "";
        res.on('data', function (chunk) {
            data += chunk.toString();
        });
        res.on('end', function() {
            try {
                var parsedData = JSON.parse(data);
                callback(parsedData.success);
            } catch (e) {
                callback(false);
            }
        });
    });
};

function escapeRegExp(string) {
    return string.replace(/([.*+?^=!:${}()|\[\]\/\\])/g, "\\$1");
}

function replaceAll(string, find, replace) {
    return string.replace(new RegExp(escapeRegExp(find), 'g'), replace);
}

function replaceInFile(file, toReplace, callback){
    fs.readFile(file, 'utf8', function (err, data) {
        if (err) {
            callback(err);
        }
        for(var i=0;i<toReplace.length;i++){
            for(var j=0;j<toReplace[i].length-1;j++){
                data = replaceAll(data, toReplace[i][j], toReplace[i][j+1]);
            }
        }
        callback(null, data);
    });
};