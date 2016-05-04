/*global console*/
var yetify = require('yetify'),
    config = require('getconfig'),
    uuid = require('node-uuid'),
    crypto = require('crypto'),
    fs = require('fs'),
    port = parseInt(process.env.PORT || config.server.port, 10),
    server_handler = function (req, res) {
        res.writeHead(404);
        res.end();
    },
    server = null;

// Create an http(s) server instance to that socket.io can listen to
if (config.server.secure) {
    server = require('https').Server({
        key: fs.readFileSync(config.server.key),
        cert: fs.readFileSync(config.server.cert),
        passphrase: config.server.password,
        ca: fs.readFileSync(config.server.ca)
    }, server_handler);
} else {
    server = require('http').Server(server_handler);
}
server.listen(port);

var io = require('socket.io').listen(server, { serveClient: false });

io.set('transports', [            // all transports (optional if you want flashsocket)
        'websocket'
        , 'htmlfile'
        , 'xhr-polling'
        , 'jsonp-polling'
//        , 'flashsocket'
]);

io.set('origins', '*:*');

if (config.logLevel) {
    // https://github.com/Automattic/socket.io/wiki/Configuring-Socket.IO
    io.set('log level', config.logLevel);
}

var verifyToken = function(token) {
    /* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
     * token structure : timestamp:roomname:username:digest                      *
     * where the digest is :                                                     *
     *            base64(hmac(sharedKey,"timestamp:room_name:username"))         *
     * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */
    // the token must be a string
    if (typeof token === 'string') {
        // which must be splittable, separator ':' and must have 4 fields
        var splitToken = token.split(':');
        if (splitToken.length === 4) {
            // the roomname must be splittable with length 2 and the username must be one of the fields
            var roomname = splitToken[1];
            var username = splitToken[2];
            var splitRoomname = roomname.split('_');
            if (splitRoomname.length === 2 && (splitRoomname[0] === username || splitRoomname[1] === username)){
                // the timestamp's format must be checked because the signature has not been verified
                var timestamp = new Date(Number(splitToken[0])*1000);
                if (!isNaN(timestamp.getTime()) && timestamp > new Date()) {
                    // verify the signature and we are done !
                    var hmac = crypto.createHmac('sha1', config.authentication.secret);
                    hmac.update(splitToken[0] + ':' + splitToken[1] + ':' + splitToken[2]);
                    var hash = splitToken[3];
                    return (hash === hmac.digest('base64'));
                }
                else return false;
            }
            else return false;
        }
        else return false;
    }
    else return false;
}


function describeRoom(name) {
    var clients = io.sockets.clients(name);
    var result = {
        clients: {},
        length: 0
    };
    clients.forEach(function (client) {
        result.clients[client.id] = client.resources;
        result.length++;
    });
    return result;
}

function clientsInRoom(name) {
    return io.sockets.clients(name).length;
}

function safeCb(cb) {
    if (typeof cb === 'function') {
        return cb;
    } else {
        return function () {};
    }
}


//setInterval(function(){
//    var clients = io.sockets.clients('ari_ben');
//    console.log('clients in room ari_ben (' + clients.length + ') : ');
//    io.sockets.clients('ari_ben').forEach(
//        function(cli){
//            console.log("    "+cli.id, "  auth : "+ (cli.auth === true));
//        }
//    );
//}, 3000);


require('socketio-auth')(io, {
    authenticate : function(socket, data, callback){
        if (verifyToken(data)){
            return callback(null, true);
        }
        else{
            return callback(new Error("invalid token"));
        }
    },
    postAuthenticate : function(client, data){
        // token is valid so we can trust the format
        client.authenticatedRoomName = (data.split(':')[1]);
        client.authenticatedUserName = (data.split(':')[2]);
        var splitRoomName = client.authenticatedRoomName.split('_');
        
        client.resources = {
            screen: false,
            video: true,
            audio: false
        };

        // pass a message to another id
        client.on('message', function (details) {
            if (!details) return;

            var otherClient = io.sockets.sockets[details.to];
            if (!otherClient) return;

            details.from = client.id;
            otherClient.emit('message', details);
        });


        function removeFeed(type) {
            if (client.room) {
                io.sockets.in(client.room).emit('remove', {
                    id: client.id,
                    type: type
                });
                if (!type) {
                    client.leave(client.room);
                    client.room = undefined;
                }
                io.sockets.in(client.room).emit('roomDescription', describeRoom(client.room));
            }
        }

        function join(name, cb) {
            // sanity check
            if (typeof name !== 'string') return;
            if (client.authenticatedRoomName !== name) {
                console.log('warning: client tried to join the room "' + name + '" but the authenticated room name for this client is "'
                            + client.authenticatedRoomName + '"');
                safeCb(cb)('no authorization for this room');
                return;
            }
            
            // check if maximum number of clients reached
            if (config.rooms && config.rooms.maxClients > 0 && clientsInRoom(name) >= config.rooms.maxClients) {
                safeCb(cb)('full');
                return;
            }
            
            var roomDescription = describeRoom(name);
            
            // check whether our username has already been taken and disconnect any previous session
//            for (user in roomDescription.clients) {
//                console.log('FOUND client '+user.id);
//                if (io.sockets.sockets[user].authenticatedUserName === client.authenticatedUserName) {
//                    console.log('warning: joining a room where an other user with username '
//                                + client.authenticatedUserName + ' has been found ! Disconnecting it...');
//                    io.sockets.sockets[user].disconnect('test');
//                }
//            }
//            var roomDescription = describeRoom(name);
            
            // prevent a user from logging in multiple times
            /*for (user in roomDescription.clients) {
                console.log('FOUND client ' + user);
                if (io.sockets.sockets[user].authenticatedUserName === client.authenticatedUserName) {
                    console.log('warning: an other client with the same username ("' +client.authenticatedUserName+ '") is already connected');
                    console.log('roomDescription.length : ' + roomDescription.length);
                    safeCb(cb)('already connected');
                    return;
                }
            }*/
            
            
            // leave any existing rooms
            removeFeed();
            safeCb(cb)(null, roomDescription);
            
            client.join(name);
            client.room = name;
            
            // synchronize all the clients
            io.sockets.in(name).emit('roomDescription', describeRoom(name));
        }

        client.on('join', join);
        
        // we don't want to pass "leave" directly because the
        // event type string of "socket end" gets passed too.
        client.on('disconnect', function () {
            removeFeed();
        });
        client.on('leave', function () {
            removeFeed();
        });
        
        var kickAllClients = function _kickAllClients(room, reason) {
            console.log('KICKING everyone');
            var clients = io.sockets.clients(room);
            clients.forEach(function _kick(cli) {
                console.log('kicking ', cli.id);
                cli.disconnect('disconnect', reason || 'booted');
            });
        }

        // support for logging full webrtc traces to stdout
        // useful for large-scale error monitoring
        client.on('trace', function (data) {
            console.log('trace', JSON.stringify(
                [data.type, data.session, data.prefix, data.peer, data.time, data.value]
            ));
        });

        console.log('adding getStunTurnServers event handler to client ', client.id);
        
        client.on('getStunTurnServers', function () {
            // tell client about stun and turn servers and generate nonces
            client.emit('stunservers', config.stunservers || []);

            // create shared secret nonces for TURN authentication
            // the process is described in draft-uberti-behave-turn-rest
            var credentials = [];
            config.turnservers.forEach(function (server) {
                var hmac = crypto.createHmac('sha1', server.secret);
                // default to 86400 seconds timeout unless specified
                var username = Math.floor(new Date().getTime() / 1000) + (server.expiry || 86400) + "";
                hmac.update(username);
                credentials.push({
                    username: username,
                    credential: hmac.digest('base64'),
                    url: server.url
                });
            });
            client.emit('turnservers', credentials);
        });
        
        client.on('getRoomDescription', function () {
//            client.emit('roomDescription', describeRoom(client.room));
            // emit to all users
            io.sockets.in(client.room).emit('roomDescription', describeRoom(client.room));

        });
        
        var duration = config.call.ringTime;
        var clients = io.sockets.clients(client.authenticatedRoomName);
        
        
        
//        setInterval(function () {
//            console.log('io.sockets.clients(client.authenticatedRoomName) :', io.sockets.clients(client.authenticatedRoomName));
//        }, 1000);
        
        
        
        // if the client is alone, prepare a self-destruction timeout for the socket
        if (clients.length === 0) {
            /*console.log('TIMEOUT armed');
            client.ringingTimeout = setTimeout(function(){
                var clients = io.sockets.clients(client.authenticatedRoomName);
                console.log('ringing timed out, clients in room : ', clients.length);
                
                // there should be no other client in the room because if an other client had joined the room, this timeout should have been cleared
                // in this case, log an error and disconnect everyone in the room
                if (clients.length > 1) {
                    console.log('Error : ringing timed out but the room is not empty, disconnecting all other clients...')
                    kickAllClients(client.authenticatedRoomName, "a server-side error occurred");
                } else {
                    kickAllClients(client.authenticatedRoomName, "The callee didn't answer within " + duration + " seconds");
                }
            }, duration * 1000);*/
        } else {
            console.log('TIMEOUT  NOT armed : ', clients.length, ' client(s) found')
            // if there are other clients in the room (there should be at most one), "defuse" its "disconnection" timeout
            clients.forEach(function(cli) {
                console.log('DEFUSING client ', cli.id)
                clearTimeout(cli.ringingTimeout);
                delete cli.ringingTimeout;
            });
        }
    },
    timeout : 2000
});

if (config.uid) process.setuid(config.uid);

var httpUrl;
if (config.server.secure) {
    httpUrl = "https://localhost:" + port;
} else {
    httpUrl = "http://localhost:" + port;
}
console.log(yetify.logo() + ' -- signal master is running at: ' + httpUrl);
