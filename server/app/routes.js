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

var jwt             = require('express-jwt');
var path            = require('path');
var jsonwebtoken    = require('jsonwebtoken');
var _               = require('underscore');
var tokenManager    = require('./token_manager');
var nconf           = require('nconf');nconf.file("config/server.json");
var secret          = nconf.get('token').secret;
var dbUser          = require('./models/user');
var aclRoutes       = require('./acl/routes.json');
var audit           = require('./audit-log');


// Controllers
var controllers = {};
controllers.users = require('./controllers/users');
controllers.entries = require('./controllers/entries');
controllers.patients = require('./controllers/patients');
controllers.chats = require('./controllers/chats');
controllers.notifications = require('./controllers/notifications');
controllers.tips = require('./controllers/tips');
controllers.audit = require('./controllers/audit');
controllers.events = require('./controllers/events');
controllers.charts = require('./controllers/charts');
controllers.objectives = require('./controllers/objectives');
controllers.contacts = require('./controllers/contacts');
controllers.ui = require('./controllers/ui');
controllers.angular = function(req, res) {res.sendFile(path.join(__dirname, '../public', 'index.html'));};


//Routes
var routes = [
    
    // API ROUTES ===============================================================
    // === USERS ROUTES ========================================================
    // Send a link to reset user's passowrd
    {
        path: _.findWhere(aclRoutes, {id: 54}).uri,
        httpMethod: _.findWhere(aclRoutes, {id: 54}).method,
        middleware: [controllers.users.lostPassword]
    },
    
    // Reset a password
    {
        path: _.findWhere(aclRoutes, {id: 55}).uri,
        httpMethod: _.findWhere(aclRoutes, {id: 55}).method,
        middleware: [controllers.users.resetPassword]
    },
    
    // Sign in
    {
        path: _.findWhere(aclRoutes, {id: 0}).uri,
        httpMethod: _.findWhere(aclRoutes, {id: 0}).method,
        middleware: [controllers.users.signin]
    },
    
    // Sign up
    {
        path: _.findWhere(aclRoutes, {id: 1}).uri,
        httpMethod: _.findWhere(aclRoutes, {id: 1}).method,
        middleware: [controllers.users.signup]
    },
    
    // Activate a user account
    {
        path: _.findWhere(aclRoutes, {id: 56}).uri,
        httpMethod: _.findWhere(aclRoutes, {id: 56}).method,
        middleware: [controllers.users.activation]
    },

    // Sign out
    {
        path: _.findWhere(aclRoutes, {id: 2}).uri,
        httpMethod: _.findWhere(aclRoutes, {id: 2}).method,
        middleware: [jwt({secret: secret}), tokenManager.verifyToken, controllers.users.signout]
    },
    
    // Change user's password
    {
        path: _.findWhere(aclRoutes, {id: 13}).uri,
        httpMethod: _.findWhere(aclRoutes, {id: 13}).method,
        middleware: [jwt({secret: secret}), tokenManager.verifyToken, controllers.users.changePassword]
    },
    
    // Update user infos
    {
        path: _.findWhere(aclRoutes, {id: 33}).uri,
        httpMethod: _.findWhere(aclRoutes, {id: 33}).method,
        middleware: [jwt({secret: secret}), tokenManager.verifyToken, controllers.users.update]
    },
    
    // Get user's own profile
    {
        path: _.findWhere(aclRoutes, {id: 25}).uri,
        httpMethod: _.findWhere(aclRoutes, {id: 25}).method,
        middleware: [jwt({secret: secret}), tokenManager.verifyToken, controllers.users.profile],
        access: _.findWhere(aclRoutes, {id: 25}).roles
    },
    
    // === UI ROUTES ==========================================================    
    // Build user's nav menu
    {
        path: _.findWhere(aclRoutes, {id: 17}).uri,
        httpMethod: _.findWhere(aclRoutes, {id: 17}).method,
        middleware: [jwt({secret: secret}), tokenManager.verifyToken, controllers.ui.nav],
        access: _.findWhere(aclRoutes, {id: 17}).roles
    },
    
    // Build user's cards (widgets)
    {
        path: _.findWhere(aclRoutes, {id: 18}).uri,
        httpMethod: _.findWhere(aclRoutes, {id: 18}).method,
        middleware: [jwt({secret: secret}), tokenManager.verifyToken, controllers.ui.cards],
        access: _.findWhere(aclRoutes, {id: 18}).roles
    },
    
    // Build user's asks (widgets)
    {
        path: _.findWhere(aclRoutes, {id: 48}).uri,
        httpMethod: _.findWhere(aclRoutes, {id: 48}).method,
        middleware: [jwt({secret: secret}), tokenManager.verifyToken, controllers.ui.asks],
        access: _.findWhere(aclRoutes, {id: 48}).roles
    },
    
    // Toggle the state of a card (widgets)
    {
        path: _.findWhere(aclRoutes, {id: 58}).uri,
        httpMethod: _.findWhere(aclRoutes, {id: 58}).method,
        middleware: [jwt({secret: secret}), tokenManager.verifyToken, controllers.ui.toggleCard],
        access: _.findWhere(aclRoutes, {id: 58}).roles
    },
    
    // Get cards settings (widgets)
    {
        path: _.findWhere(aclRoutes, {id: 26}).uri,
        httpMethod: _.findWhere(aclRoutes, {id: 26}).method,
        middleware: [jwt({secret: secret}), tokenManager.verifyToken, controllers.ui.settings],
        access: _.findWhere(aclRoutes, {id: 26}).roles
    },
    
    // Notify that the user "got it"
    {
        path: _.findWhere(aclRoutes, {id: 61}).uri,
        httpMethod: _.findWhere(aclRoutes, {id: 61}).method,
        middleware: [jwt({secret: secret}), tokenManager.verifyToken, controllers.ui.gotit],
        access: _.findWhere(aclRoutes, {id: 61}).roles
    },
    
    // Verify if the user "got it"
    {
        path: _.findWhere(aclRoutes, {id: 62}).uri,
        httpMethod: _.findWhere(aclRoutes, {id: 62}).method,
        middleware: [jwt({secret: secret}), tokenManager.verifyToken, controllers.ui.verifyAppTip],
        access: _.findWhere(aclRoutes, {id: 62}).roles
    },
    
    // Audit client and generate a CSV
    {
        path: _.findWhere(aclRoutes, {id: 8}).uri,
        httpMethod: _.findWhere(aclRoutes, {id: 8}).method,
        middleware: [jwt({secret: secret}), tokenManager.verifyToken, controllers.ui.auditClient],
        access: _.findWhere(aclRoutes, {id: 8}).roles
    },
    
    // Generate the todo list (widgets)
    {
        path: _.findWhere(aclRoutes, {id: 21}).uri,
        httpMethod: _.findWhere(aclRoutes, {id: 21}).method,
        middleware: [jwt({secret: secret}), tokenManager.verifyToken, controllers.ui.todo],
        access: _.findWhere(aclRoutes, {id: 21}).roles
    },
    
    
    // === Objectives ROUTES ========================================================
    {
        path: _.findWhere(aclRoutes, {id: 52}).uri,
        httpMethod: _.findWhere(aclRoutes, {id: 52}).method,
        middleware: [jwt({secret: secret}), controllers.objectives.createOrUpdate],
        access: _.findWhere(aclRoutes, {id: 52}).roles
    },
    {
        path: _.findWhere(aclRoutes, {id: 53}).uri,
        httpMethod: _.findWhere(aclRoutes, {id: 53}).method,
        middleware: [jwt({secret: secret}), tokenManager.verifyToken, controllers.objectives.read],
        access: _.findWhere(aclRoutes, {id: 53}).roles
    },
    {
        path: _.findWhere(aclRoutes, {id: 57}).uri,
        httpMethod: _.findWhere(aclRoutes, {id: 57}).method,
        middleware: [jwt({secret: secret}), controllers.objectives.delete],
        access: _.findWhere(aclRoutes, {id: 57}).roles
    },
    
    // === ENTRIES ROUTES ========================================================
    // Create a new entry
    {
        path: _.findWhere(aclRoutes, {id: 6}).uri,
        httpMethod: _.findWhere(aclRoutes, {id: 6}).method,
        middleware: [jwt({secret: secret}), tokenManager.verifyToken, controllers.entries.create],
        access: _.findWhere(aclRoutes, {id: 6}).roles
    },
    
    // Retrieve entries of a specified type (patient view)
    {
        path: _.findWhere(aclRoutes, {id: 46}).uri,
        httpMethod: _.findWhere(aclRoutes, {id: 46}).method,
        middleware: [jwt({secret: secret}), tokenManager.verifyToken, controllers.entries.list],
        access: _.findWhere(aclRoutes, {id: 46}).roles
    },
    
    // Delete an entry
    {
        path: _.findWhere(aclRoutes, {id: 20}).uri,
        httpMethod: _.findWhere(aclRoutes, {id: 20}).method,
        middleware: [jwt({secret: secret}), tokenManager.verifyToken, controllers.entries.delete],
        access: _.findWhere(aclRoutes, {id: 20}).roles
    },

    // === CHAT ROUTES ========================================================
    // Get the list of my chats
    {
        path: _.findWhere(aclRoutes, {id: 7}).uri,
        httpMethod: _.findWhere(aclRoutes, {id: 7}).method,
        middleware: [jwt({secret: secret}), tokenManager.verifyToken, controllers.chats.readChatsList],
        access: _.findWhere(aclRoutes, {id: 7}).roles
    },

    // Read the messages after the specified date
    {
        path: _.findWhere(aclRoutes, {id: 15}).uri,
        httpMethod: _.findWhere(aclRoutes, {id: 15}).method,
        middleware: [jwt({secret: secret}), tokenManager.verifyToken, controllers.chats.readChat],
        access: _.findWhere(aclRoutes, {id: 15}).roles,
        verifyRelationship: true
    },

    // Send a message
    {
        path: _.findWhere(aclRoutes, {id: 9}).uri,
        httpMethod: _.findWhere(aclRoutes, {id: 9}).method,
        middleware: [jwt({secret: secret}), tokenManager.verifyToken, controllers.chats.sendMessage],
        access: _.findWhere(aclRoutes, {id: 9}).roles,
        verifyRelationship: true
    },
    
    // Manage WebRTC calls
    {
        path: _.findWhere(aclRoutes, {id: 63}).uri,
        httpMethod: _.findWhere(aclRoutes, {id: 63}).method,
        middleware: [jwt({secret: secret}), tokenManager.verifyToken, controllers.chats.webrtc],
        access: _.findWhere(aclRoutes, {id: 63}).roles,
        verifyRelationship: true
    },
    
    // Set or reset my archive flag
    {
        path: _.findWhere(aclRoutes, {id: 5}).uri,
        httpMethod: _.findWhere(aclRoutes, {id: 5}).method,
        middleware: [jwt({secret: secret}), tokenManager.verifyToken, controllers.chats.setArchiveFlag],
        access: _.findWhere(aclRoutes, {id: 5}).rolesroles
    },

    // Delete the chat
    {
        path: _.findWhere(aclRoutes, {id: 10}).uri,
        httpMethod: _.findWhere(aclRoutes, {id: 10}).method,
        middleware: [jwt({secret: secret}), tokenManager.verifyToken, controllers.chats.deleteChat],
        access: _.findWhere(aclRoutes, {id: 10}).roles
    },
    
    // Get credentials to get access to the signaling server
    {
        path: _.findWhere(aclRoutes, {id: 37}).uri,
        httpMethod: _.findWhere(aclRoutes, {id: 37}).method,
        middleware: [jwt({secret: secret}), tokenManager.verifyToken, controllers.chats.getSignalingToken],
        access: _.findWhere(aclRoutes, {id: 37}).roles
    },
    

    // === NOTIFICATIONS ROUTES ========================================================
    // Retrieve last notifications (30 days)
    {
        path: _.findWhere(aclRoutes, {id: 22}).uri,
        httpMethod: _.findWhere(aclRoutes, {id: 22}).method,
        middleware: [jwt({secret: secret}), tokenManager.verifyToken, controllers.notifications.list],
        access: _.findWhere(aclRoutes, {id: 22}).roles
    },

    // Retrieve last notifications (7 days)
    {
        path: _.findWhere(aclRoutes, {id: 24}).uri,
        httpMethod: _.findWhere(aclRoutes, {id: 24}).method,
        middleware: [jwt({secret: secret}), tokenManager.verifyToken, controllers.notifications.listLimited],
        access: _.findWhere(aclRoutes, {id: 24}).roles
    },
    
    // Update a notification
    {
        path: _.findWhere(aclRoutes, {id: 32}).uri,
        httpMethod: _.findWhere(aclRoutes, {id: 32}).method,
        middleware: [jwt({secret: secret}), tokenManager.verifyToken, controllers.notifications.update],
        access: _.findWhere(aclRoutes, {id: 32}).roles
    },
    
    // === TIPS ROUTES ========================================================
    // Retrieve all tips
    {
        path: _.findWhere(aclRoutes, {id: 28}).uri,
        httpMethod: _.findWhere(aclRoutes, {id: 28}).method,
        middleware: [jwt({secret: secret}), tokenManager.verifyToken, controllers.tips.list],
        access: _.findWhere(aclRoutes, {id: 28}).roles
    },
    
    // Read a tip
    {
        path: _.findWhere(aclRoutes, {id: 34}).uri,
        httpMethod: _.findWhere(aclRoutes, {id: 34}).method,
        middleware: [jwt({secret: secret}), tokenManager.verifyToken, controllers.tips.read],
        access: _.findWhere(aclRoutes, {id: 34}).roles
    },
    
    // Bookmark or unbookmark a tip
    {
        path: _.findWhere(aclRoutes, {id: 36}).uri,
        httpMethod: _.findWhere(aclRoutes, {id: 36}).method,
        middleware: [jwt({secret: secret}), tokenManager.verifyToken, controllers.tips.bookmark],
        access: _.findWhere(aclRoutes, {id: 36}).roles
    },
    
    // === AUDIT ROUTES ========================================================
    // Retrieve audit logs by date
    {
        path: _.findWhere(aclRoutes, {id: 27}).uri,
        httpMethod: _.findWhere(aclRoutes, {id: 27}).method,
        middleware: [jwt({secret: secret}), tokenManager.verifyToken, controllers.audit.listByDate],
        access: _.findWhere(aclRoutes, {id: 27}).roles
    },
    
    // === PATIENTS ROUTES ========================================================
    // Retrieve a patient by ID in the medical record
    {
        path: _.findWhere(aclRoutes, {id: 3}).uri,
        httpMethod: _.findWhere(aclRoutes, {id: 3}).method,
        middleware: [jwt({secret: secret}), tokenManager.verifyToken, controllers.patients.read],
        access: _.findWhere(aclRoutes, {id: 3}).roles,
        verifyRelationship: true
    },
    
    // Retrieve entries of a specified patient and a specified type of entry (doctor view)
    {
        path: _.findWhere(aclRoutes, {id: 16}).uri,
        httpMethod: _.findWhere(aclRoutes, {id: 16}).method,
        middleware: [jwt({secret: secret}), tokenManager.verifyToken, controllers.entries.list],
        access: _.findWhere(aclRoutes, {id: 16}).roles,
        verifyRelationship: true
    },
    
    // Build a chart with a specified patient id, a type of entry and a date range (doctor view)
    {
        path: _.findWhere(aclRoutes, {id: 4}).uri,
        httpMethod: _.findWhere(aclRoutes, {id: 4}).method,
        middleware: [jwt({secret: secret}), tokenManager.verifyToken, controllers.charts.build],
        access: _.findWhere(aclRoutes, {id: 4}).roles,
        verifyRelationship: true
    },
    
    // === CHARTS ROUTES ==========================================================    
    // Build a chart with a specified type of entry and a date range (patient view)
    {
        path: _.findWhere(aclRoutes, {id: 23}).uri,
        httpMethod: _.findWhere(aclRoutes, {id: 23}).method,
        middleware: [jwt({secret: secret}), tokenManager.verifyToken, controllers.charts.build],
        access: _.findWhere(aclRoutes, {id: 23}).roles
    },

    // === EVENTS ROUTES ==========================================================
    // Retrieve events in a specified date range
    {
        path: _.findWhere(aclRoutes, {id: 39}).uri,
        httpMethod: _.findWhere(aclRoutes, {id: 39}).method,
        middleware: [jwt({secret: secret}), tokenManager.verifyToken, controllers.events.listByDateRange],
        access: _.findWhere(aclRoutes, {id: 39}).roles
    },
    // Read an event
    {
        path: _.findWhere(aclRoutes, {id: 40}).uri,
        httpMethod: _.findWhere(aclRoutes, {id: 40}).method,
        middleware: [jwt({secret: secret}), tokenManager.verifyToken, controllers.events.read],
        access: _.findWhere(aclRoutes, {id: 40}).roles  
    },
    // Create or update an event
    {
        path: _.findWhere(aclRoutes, {id: 41}).uri,
        httpMethod: _.findWhere(aclRoutes, {id: 41}).method,
        middleware: [jwt({secret: secret}), tokenManager.verifyToken, controllers.events.createOrUpdate],
        access: _.findWhere(aclRoutes, {id: 41}).roles
    },
    // Delete an event
    {
        path: _.findWhere(aclRoutes, {id: 42}).uri,
        httpMethod: _.findWhere(aclRoutes, {id: 42}).method,
        middleware: [jwt({secret: secret}), tokenManager.verifyToken, controllers.events.delete],
        access: _.findWhere(aclRoutes, {id: 42}).roles
    },
    
    // === CONTACTS ROUTES ==========================================================
    // Search contacts
    {
        path: _.findWhere(aclRoutes, {id: 29}).uri,
        httpMethod: _.findWhere(aclRoutes, {id: 29}).method,
        middleware: [jwt({secret: secret}), tokenManager.verifyToken, controllers.contacts.search],
        access: _.findWhere(aclRoutes, {id: 29}).roles
    },
    // Search accepted contacts (relationship)
    {
        path: _.findWhere(aclRoutes, {id: 47}).uri,
        httpMethod: _.findWhere(aclRoutes, {id: 47}).method,
        middleware: [jwt({secret: secret}), tokenManager.verifyToken, controllers.contacts.searchAccepted],
        access: _.findWhere(aclRoutes, {id: 47}).roles
    },
    
    // User's contacts list (relationship request accepted)
    {
        path: _.findWhere(aclRoutes, {id: 30}).uri,
        httpMethod: _.findWhere(aclRoutes, {id: 30}).method,
        middleware: [jwt({secret: secret}), tokenManager.verifyToken, controllers.contacts.list],
        access: _.findWhere(aclRoutes, {id: 30}).roles
    },
    
    // User's contacts list (relationship request sent)
    {
        path: _.findWhere(aclRoutes, {id: 43}).uri,
        httpMethod: _.findWhere(aclRoutes, {id: 43}).method,
        middleware: [jwt({secret: secret}), tokenManager.verifyToken, controllers.contacts.list],
        access: _.findWhere(aclRoutes, {id: 43}).roles
    },
    
    // User's contacts list (relationship request received)
    {
        path: _.findWhere(aclRoutes, {id: 44}).uri,
        httpMethod: _.findWhere(aclRoutes, {id: 44}).method,
        middleware: [jwt({secret: secret}), tokenManager.verifyToken, controllers.contacts.list],
        access: _.findWhere(aclRoutes, {id: 44}).roles
    },
    
    // Create or Update a relationship
    {
        path: _.findWhere(aclRoutes, {id: 31}).uri,
        httpMethod: _.findWhere(aclRoutes, {id: 31}).method,
        middleware: [jwt({secret: secret}), tokenManager.verifyToken, controllers.contacts.createOrUpdate],
        access: _.findWhere(aclRoutes, {id: 31}).roles
    },
    
    // Delete a contact
    {
        path: _.findWhere(aclRoutes, {id: 38}).uri,
        httpMethod: _.findWhere(aclRoutes, {id: 38}).method,
        middleware: [jwt({secret: secret}), tokenManager.verifyToken, controllers.contacts.delete],
        access: _.findWhere(aclRoutes, {id: 38}).roles
    },
    
    // Read a contact
    {
        path: _.findWhere(aclRoutes, {id: 45}).uri,
        httpMethod: _.findWhere(aclRoutes, {id: 45}).method,
        middleware: [jwt({secret: secret}), tokenManager.verifyToken, controllers.contacts.read],
        access: _.findWhere(aclRoutes, {id: 45}).roles,
        verifyRelationship: true
    },
    
    // Read a contact (light view)
    {
        path: _.findWhere(aclRoutes, {id: 19}).uri,
        httpMethod: _.findWhere(aclRoutes, {id: 19}).method,
        middleware: [jwt({secret: secret}), tokenManager.verifyToken, controllers.contacts.read],
        access: _.findWhere(aclRoutes, {id: 19}).roles
    },
    
    // Frequent contacts
    {
        path: _.findWhere(aclRoutes, {id: 35}).uri,
        httpMethod: _.findWhere(aclRoutes, {id: 35}).method,
        middleware: [jwt({secret: secret}), tokenManager.verifyToken, controllers.contacts.frequent],
        access: _.findWhere(aclRoutes, {id: 35}).roles
    },
      
    // FRONTEND ROUTES ========================================================
    // Route to handle all angular requests
    {
        path: _.findWhere(aclRoutes, {id: 11}).uri,
        httpMethod: _.findWhere(aclRoutes, {id: 11}).method,
        middleware: [controllers.angular]
    }
];


module.exports = function(app) {
    _.each(routes, function(route) {
        route.middleware.unshift(ensureAuthorized);
        var args = _.flatten([route.path, route.middleware]);
        switch(route.httpMethod.toUpperCase()) {
            case 'GET':
                app.get.apply(app, args);
                break;
            case 'POST':
                app.post.apply(app, args);
                break;
            case 'PUT':
                app.put.apply(app, args);
                break;
            case 'DELETE':
                app.delete.apply(app, args);
                break;
            default:
                throw new Error('Invalid HTTP method specified for route ' + route.path);
                break;
        }
    });
};


function ensureAuthorized(req, res, next) {
    if(_.contains(["*", "/api/users/signin", "/api/users/signup", "/api/users/activation", "/api/users/lostPassword", "/api/users/resetPassword"], req.route.path)){
        return next();
    } else {
        var token, completeDecodedToken;
        token = tokenManager.getToken(req.headers);
        if (token) completeDecodedToken = jsonwebtoken.decode(token, {complete:true});
        if (completeDecodedToken && typeof completeDecodedToken.payload.id !== 'undefined') {
            if (completeDecodedToken.header.alg === 'HS256') {
                var decodedToken = completeDecodedToken.payload;
                var userID = decodedToken.id;
                dbUser.userModel.findOne({_id: userID}, function (err, user) {
                    if(err){
                        audit.logEvent('[mongodb]', 'Routes', 'Ensure authorized', 'userID', userID, 'failed', 'Mongodb attempted to retrieve a user');
                        console.log(err);
                        return res.sendStatus(500);
                    } else {
                        if (user !== null) {
                            var userRole = parseInt(user.role);
                            var route = _.findWhere(routes, {
                                path: req.route.path, 
                                httpMethod: req.method
                            });
                            var allowedRoles = route.access;
                            if (typeof(allowedRoles) !== "undefined") {
                                var accessGranted = false;
                                for(i=0; i<allowedRoles.length; i++){
                                    if (userRole === allowedRoles[i]) accessGranted = true;
                                }
                                if (accessGranted) {
                                    if (typeof(route.verifyRelationship) !== "undefined" && route.verifyRelationship === true) {
                                        controllers.contacts.verifyRelationship(userID, req.params.id, req.params.username || req.body.username, function (err, authorized){
                                            if (err) {
                                                return res.sendStatus(500);
                                            } else {
                                                if (authorized) {
                                                    req.forbidden = false;
                                                } else {
                                                    req.forbidden = true;
                                                }
                                                return next();
                                            }
                                        });
                                    } else {
                                        return next();
                                    }
                                } else {
                                    console.log('Forbidden for his role');
                                    audit.logEvent(user.username, 'Routes', 'Ensure authorized', 'route', req.route.path, 'failed',
                                                   'The user tried to access a route which is forbidden for his role');
                                    return res.sendStatus(403);
                                }
                            } else {// typeof allowedRoles is undefined
                                return next();
                            }
                        } else {
                            console.log('User not found (' + userID + ')');
                            audit.logEvent('[anonymous]', 'Routes', 'Ensure authorized', 'userID', userID, 'failed', 'User not found');
                            return res.sendStatus(401);
                        }
                    }
                });
            } else {
                console.log('ensureAuthorized received a suspicious token with customized algorithm (' + completeDecodedToken.header.alg + ')');
                audit.logEvent('[anonymous]', 'Routes', 'Ensure authorized', 'token', completeDecodedToken.header.alg, 'failed', 'Received a suspicious token with customized algorithm');
                return res.sendStatus(401);
            }
        } else {
            console.log('ensureAuthorized did not receive a valid token ("', token, '")');
            audit.logEvent('[anonymous]', 'Routes', 'Ensure authorized', 'token', token, 'failed', 'Did not receive a valid token');
            return res.sendStatus(401);
        }
    }
}
