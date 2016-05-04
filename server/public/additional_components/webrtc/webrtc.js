         
            // = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = //
            //    __      __           _         ___     _____     ___     //
            //    \ \    / /   ___    | |__     | _ \   |_   _|   / __|    //
            //     \ \/\/ /   / -_)   | '_ \    |   /     | |    | (__     //
            //      \_/\_/    \___|   |_.__/    |_|_\    _|_|_    \___|    //
            //    _|"""""|  _|"""""| _|"""""| _|"""""| _|"""""| _|"""""|   //
            //    "`-0-0-'  "`-0-0-' "`-0-0-' "`-0-0-' "`-0-0-' "`-0-0-'   //
            // = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = //
            //         _       __       __     ____  ______ ______         //
            //        | |     / /___   / /_   / __ \/_  __// ____/         //
            //        | | /| / // _ \ / __ \ / /_/ / / /  / /              //
            //        | |/ |/ //  __// /_/ // _, _/ / /  / /___            //
            //        |__/|__/ \___//_.___//_/ |_| /_/   \____/            //
            // = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = //



// - webrtc                 -- the SimpleWebRTC instance, and
// - connection             -- which keeps the websocket object and is linked to the webrtc handlers
//
// SimpleWebRTC will delete its connection object upon disconnection but the connection object must be
// re-used with this SimpleWebRTC instance because SimpleWebRTC registers its events when it initializes itself.
// We keep a backup copy of that object (this.connection) and link it back into webrtc whenever it is deleted.
// 
// The socket will be disconnected when not used.



// flush all eventual remaining remote video elements
var flushRemoteVideos = function () {
    var remotes = document.getElementById('remotes');
    if (remotes) {
        if (remotes.childNodes.length > 0) {
            console.log('warning : flushRemoteVideos() found ' + (remotes.childNodes.length) +
                ' dirty child element(s) in the "remotes" container');
        }
        while (remotes.childNodes.length > 0) {
            console.log('REMOVING child video element : ', remotes.childNodes[0].id);
            remotes.removeChild(remotes.childNodes[0]);
        }
    } else {
        console.log('error : did not find the "remotes" element');
    }
}

function WebRTC(username, room, signalingServerURL, getSignalingToken) {
    var self = this;
    
    this.getSignalingToken = getSignalingToken;
    
    // verbose debug
    this.dbg = false;
    this.dbg_iceSignalingStateChange = false;
    this.dbg_iceConnectionStateChange = false;
    this.dbg_watchdog = false;
    this.dbg_statusChanges = false;
    this.dbg_roomEvents = false;
    this.dbg_socketEvents = false;
    this.dbg_allSocketEvents = false;
    
    
    this.token = 'none';
    this.room = room;
    this.peers = [];            // list of peers we want to be connected with and the desired media directions
                                // the elements format is a string:
                                //      peerid[_audioIN][_audioOUT][_videoIN][_videoOUT]
    
    this.useAudio = true ;      // if true, the peers in the room are automatically added with audio, full duplex
    this.useVideo = true ;      // if true, the peers in the room are automatically added with video, full duplex
                                // if both these flags are false, no peer is added automatically, add the peer in the
                                // peers list with the specified streams directions using addPeer()
    
    // target state
    // the watchdog will try to reach and maintain the required states
    // it will monitor and decide what is the next step to reach those states
    this.media = false;         // the access to the microphone + camera is requested and the local media can be displayed
    this.signaling = false;     // the socket to signalmaster is opened, the tokens must be available via the provided getSignalingToken function
    this.peer = false;          // the peers are added if they are present in the "peers" list
    
    
    // chronometers
    var dummy = new Date(0);
    this.chrono = {
        mediaOpen: dummy,
        mediaClose: dummy,
        token : dummy,
        socket : dummy,
        authenticate : dummy,
        turn : dummy,
        joinRoom : dummy,
        leaveRoom : dummy
    }
    
    this.peerTimers = {};
    

    // create our own connection and pass it to SimpleWebRTC constructor once it is properly authenticated
    // SimpleWebRTC will register its events and delete its connection when its disconnect() method is called
    // we keep the same connection in the global variable all the time as it will remain bound to the webrtc handlers
    this.io = window.io;

    function SocketIoConnection(config) {
        this.connection = io.connect(config.url, config.socketio);
    }
    SocketIoConnection.prototype.on = function (ev, fn) {
        this.connection.on(ev, fn);
    };
    SocketIoConnection.prototype.emit = function () {
        this.connection.emit.apply(this.connection, arguments);
    };
    SocketIoConnection.prototype.getSessionid = function () {
        return this.connection.socket.sessionid;
    };
    SocketIoConnection.prototype.disconnect = function () {
        return this.connection.disconnect();
    };

    // create a global object which will also store the event handlers
    this.connection = new SocketIoConnection({
        url: signalingServerURL,
        socketio: {
            "auto connect": false,
            "force new connection": false,
            "reconnect": true
        }
    });
    
    this.connection.authenticated = false;

    // dump current status in the console
    if (this.dbg_statusChanges) this.connection.connection.socket.on('*', function (event) {
        self.status();
    });

    this.leaveRoom = function() {
        if (self.dbg || self.dbg_statusChanges) console.log('leaving room');
        self.webrtc.leaveRoom();
    }
    
    
    this.getPeerDescription = function(peer) {
        return self.createPeerDescription(peer.id, peer.pc.streamsDirections);
    }
    
    this.createPeerDescription = function(peerID, streamsDirections) {
        var peerDesc = peerID;
        peerDesc += '/';
        peerDesc += streamsDirections.audio.receive ? "_audioIN" : "";
        peerDesc += streamsDirections.audio.send ? "_audioOUT" : "";
        peerDesc += streamsDirections.video.receive ? "_videoIN" : "";
        peerDesc += streamsDirections.video.send ? "_videoOUT" : "";
        return peerDesc;
    }
    
    this.parsePeerDescription = function(peerDesc) {
        result = {};
        result.id = peerDesc.split('/')[0];
        result.streamsDirections = {
            audio : {
                receive : peerDesc.indexOf('_audioIN') !== -1,
                send : peerDesc.indexOf('_audioOUT') !== -1
            },
            video : {
                receive : peerDesc.indexOf('_videoIN') !== -1,
                send : peerDesc.indexOf('_videoOUT') !== -1
            }
        }
        return result;
    }
    
    this.getPeer = function(peerDesc) {
        var foundPeer = null;
        self.webrtc.webrtc.getPeers().forEach(function(peer) {
            if ((!foundPeer) && (self.getPeerDescription(peer) === peerDesc)) {
                foundPeer = peer;
            } 
        });
        return foundPeer;
    }
    
    
    this.connectToPeer = function (peerDesc) {
        var peer = self.getPeer(peerDesc);
        if (peer === null) {
            var parsedDescription = self.parsePeerDescription(peerDesc);
            var peerID = parsedDescription.id;
            var streamsDirections = parsedDescription.streamsDirections;
            var opts = {
                id : peerID,
                sid : Date.now().toString() + Math.random().toString().slice(-6), // adding some "salt" because to avoid sid collisions
                shareMyScreen : false,
                type : streamsDirections.video.receive || streamsDirections.video.send ? "video" : "audio",
                receiveMedia : {
                    offerToReceiveAudio : streamsDirections.audio.receive,
                    offerToReceiveVideo : streamsDirections.video.receive
                }
            }
            peer = self.webrtc.webrtc.createPeer(opts);
            
            // replace default end() method to signal the other side that we are closing (firefox doesn't implement the "readyState" status...)
            var boundEnd = peer.end.bind(peer);
            peer.end = function() {
                peer.send('close');
                boundEnd();
                self.updateRoomDescription();
            }
            
            peer.pc.isInitiator = peer.isInitiator = true;
            peer.pc.streamsDirections = streamsDirections;
            
            self.peerTimers[peerDesc] = new Date();
            
            peer.start();
            self.webrtc.webrtc.emit('createdPeer', peer);
        }
        return peer;
    }
    
    this.updateRoomDescription = function (roomDescription) {
        var self = this;
        
        if (arguments.length < 1) {
            self.connection.emit('getRoomDescription');
        } else {
            // add the peers with the default stream
            if (self.useAudio || self.useVideo) {
                for (var id in roomDescription.clients) {
                    if (id !== self.connection.getSessionid()) {
                        var streamsDirections = {
                            audio : {   send : self.useAudio ? true : false,
                                        receive : self.useAudio ? true : false },
                            video : {   send : self.useVideo ? true : false,
                                        receive : self.useVideo ? true : false }
                        };
                        var newPeer = self.addPeer(id, streamsDirections);
                        if (self.dbg || self.dbg_watchdog) console.log('watchdog: added peer ', self.createPeerDescription(id, streamsDirections), newPeer);
                    }
                }
            }

            // remove the peers missing whose ID is not in the roomDescription
            self.peers = self.peers.filter(function(peerDesc) {
                var keep = (typeof roomDescription.clients[self.parsePeerDescription(peerDesc).id] !== 'undefined');
                if (!keep && (self.dbg || self.dbg_watchdog)) console.log('watchdog : removing peer (which was not in the new roomDescription)', peerDesc);
                return keep;
            });

            self.watchdog();
        }
    }
    
    
    this.joinRoom = function () {
        if (self.dbg || self.dbg_statusChanges) console.log('joining room');
        self.webrtc.roomName = self.room;
        self.webrtc.connection.emit('join', self.room, function (err, roomDescription) {
            if (err) {
                self.webrtc.emit('error', err);
                console.error('webrtc error : could not join room "' + self.room + '": ' + err);
            } else {
                if (self.dbg) console.log('webrtc : joined room "' + self.room + '".   room description: ', roomDescription);
                self.webrtc.emit('joinedRoom', self.room);
                self.updateRoomDescription(roomDescription);
            }
        });
    }

    /* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
     *  WATCHDOG - the "processor" mechanism                                                       *
     *        compares the state with the expected state and performs the next ad-hoc action       *
     * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */
    this.watchdogInterval = null;
    this.stopWatchdog = function () {
        if (self.dbg) console.log('stopping watchdog');
        if (self.watchdogInterval) {
            clearInterval(self.watchdogInterval);
            self.watchdogInterval = null;
        }
    }
    
    // check the flags consistency
    if (this.peer) {
        this.media = true;
        this.signaling = true;
    }

    this.watchdog = function _watchdog() {
        // first remove eventual "broken" closed peers (not properly closed by peer.end)
        var peersToRemove = [];
        self.webrtc.webrtc.getPeers().forEach(function(peer) {
            if (peer.pc.pc.peerconnection.iceConnectionState === 'closed') {
                console.log('peer.pc.pc.peerconnection : ', peer.pc.pc.peerconnection);
                console.log('peer.pc.pc.peerconnection : ', peer.pc.pc.peerconnection);
                console.log('peer.pc.pc.peerconnection : ', peer.pc.pc.peerconnection);
                peersToRemove.push(peer);
            }
        });
        peersToRemove.forEach(function(peer) {
            if (self.dbg || self.dbg_watchdog) console.log('watchdog : removing closed peer : ', peer.id);
            // if the peer is already in closed state, it won't properly remove itself off the webrtc object (happened in Firefox)
            if (self.webrtc.webrtc.peers.indexOf(peer) > -1) {
                console.error('FORCING DELETION', peer);
                peer.handleStreamRemoved();
//                self.webrtc.webrtc.peers.splice(self.webrtc.webrtc.peers.indexOf(peer), 1);
            }
        });
        if (peersToRemove.length > 0) {
            self.updateRoomDescription();
            // updateRoomDescription will call the watchdog so we can leave here
            return;
        }
        
        
        var currentStatus = self.status();
        
        if (self.media) {
            /* * * * * * * * * * * * * * * * * * * * * *
             *           activation (medias)
             * * * * * */
            // starting local media (SYNC?)
            if ((! currentStatus.localMedia) &&
                (new Date().getTime() - self.chrono.mediaOpen.getTime() > 3000)) {
                if (self.dbg || self.dbg_watchdog) console.log('watchdog : requesting medias...');
                self.webrtc.startLocalVideo();
                self.chrono.mediaOpen = new Date();
            }
            
            // double check for media "liveness"  works only in chrome, Firefox has not implemented the readyState attribute yet...
            if (currentStatus.localMedia) {
                if (self.webrtc.webrtc.stopLocalVideo) {
                     self.webrtc.webrtc.localStream.getTracks().forEach(function(track) {
                        if (typeof track.readyState === 'string' && track.readyState === "ended") {
                            console.error('RESETTING MEDIA');
                            self.webrtc.webrtc.stopLocalVideo();
                        }
                    });
                }
            }
        } else {
            /* * * * * * * * * * * * * * * * * * * * * *
             *          de-activation (medias)
             * * * * * */
            // stopping local media (SYNC?)
            if ((currentStatus.localMedia) &&
                (new Date().getTime() - self.chrono.mediaClose.getTime() > 3000)) {
                if (self.dbg || self.dbg_watchdog) console.log('watchdog : closing medias...');
                self.chrono.mediaClose = new Date();
                self.webrtc.stopLocalVideo();
                self.onMediaClosed();
            }
        }
        
        currentStatus = self.status();
        
        if (self.signaling) {
            /* * * * * * * * * * * * * * * * * * * * * *
             *            get a fresh token
             * * * * * */
            if ((self.token === 'none') &&
                (new Date().getTime() - self.chrono.token.getTime() > 3000)) {
                if (self.dbg || self.dbg_watchdog) console.log('watchdog : asking for a new signaling token...');
                self.chrono.token = new Date();
                self.getSignalingToken(function(err, token) {
                    self.token = token;
                    self.watchdog();
                });
            }
            
            /* * * * * * * * * * * * * * * * * * * * * *
             *           connect the socket
             * * * * * */
            if ((self.token !== 'none') &&
                (currentStatus.socketIsConnected === false)) {
                var elapsed = new Date().getTime() - self.chrono.socket.getTime();
                self.connection.authenticated = false;
                self.webrtc.sessionReady = false;
                if (currentStatus.socketIsConnecting === false) {
                    if (self.dbg || self.dbg_watchdog) console.log('watchdog : connecting socket...');
                    self.connection.connection.socket.connect();
                    self.chrono.socket = new Date();
                } else if ((currentStatus.socketIsConnecting === true) && (elapsed > 3000)) {
                    if (self.dbg || self.dbg_watchdog) console.log('watchdog : reconnecting socket...');
                    self.connection.connection.socket.reconnect();
                    self.chrono.socket = new Date();
                }
                conn = self.connection;
            }
            
            /* * * * * * * * * * * * * * * * * * * * * *
             *         authenticate the socket
             * * * * * */
            if ((self.token !== 'none') &&
                (currentStatus.socketIsConnected === true) &&
                (currentStatus.socketIsAuthenticated === false) &&
                (new Date().getTime() - self.chrono.authenticate.getTime() > 3000)) {
                if (self.dbg || self.dbg_watchdog) console.log('watchdog : authenticating...');
                self.chrono.authenticate = new Date();
                self.connection.emit('authentication', self.token);
            }
            
            /* * * * * * * * * * * * * * * * * * * * * *
             *           ask for turnservers
             * * * * * */
            if ((currentStatus.socketIsAuthenticated === true) &&
                (self.chrono.turn < self.chrono.authenticate) &&
                (new Date().getTime() - self.chrono.turn.getTime() > 3000)) {
                if (self.dbg || self.dbg_watchdog) console.log('watchdog : fetching turnservers...');
                self.chrono.turn = new Date();
                self.connection.emit('getStunTurnServers');
            }
            
            /* * * * * * * * * * * * * * * * * * * * * *
             *            join the room
             * * * * * */
            if ((self.webrtc.sessionReady === true) &&
                (self.webrtc.roomName !== self.room) &&
                (new Date().getTime() - self.chrono.joinRoom.getTime() > 3000)) {
                if (self.dbg || self.dbg_watchdog) console.log('watchdog : joining room ' + self.room + '...');
                self.chrono.joinRoom = new Date();
                self.joinRoom();
            }
        } else {
            /* * * * * * * * * * * * * * * * * * * * * *
             *            leave the room
             * * * * * */
            if ((self.webrtc.roomName) &&
                (self.webrtc.webrtc.getPeers().length === 0) &&
                (new Date().getTime() - self.chrono.leaveRoom.getTime() > 3000)) {
                if (self.dbg || self.dbg_watchdog) console.log('watchdog : leaving the room');
                self.chrono.leaveRoom = new Date();
                self.webrtc.connection.emit('leave');
                self.webrtc.emit('leftRoom', this.roomName);
                self.webrtc.roomName = undefined;
                self.peers = [];
                self.peerTimers = {};
            }
            
            /* * * * * * * * * * * * * * * * * * * * * *
             *      disconnect the signaling server
             * * * * * */
            // wait for the peers to disconnect but force disconnection if a socket is currently connecting
            if ((! currentStatus.connectedToPeers) &&
                ((currentStatus.socketIsConnecting === true) ||
                 (currentStatus.socketIsConnected  === true))) {
                if (self.dbg || self.dbg_watchdog) console.log('watchdog : disconnecting socket');
                self.connection.disconnect();
                self.connection.authenticated = false;
                self.webrtc.sessionReady = false;
                self.token = 'none';
            }
        } // if self.signaling
        
        
        currentStatus = self.status();
        /* * * * * * * * * * * * * * * * * * * * * *
         *  maintain the connections with the peers
         * * * * * */
        if (self.peer) {
            // we synchronize the connections with the self.peers list
            if ((currentStatus.socketIsAuthenticated  === true) &&
                (self.webrtc.roomName)){
                for (var peerDesc in currentStatus.peersStates) {
                    var state = currentStatus.peersStates[peerDesc]
                    var peer = self.getPeer(peerDesc);
                    
                    if (state === null) {
                        var elapsed = null;
                        if (self.peerTimers[peerDesc]) elapsed = new Date().getTime() - self.peerTimers[peerDesc].getTime();
                        if (!elapsed || elapsed > 3000) {
                            if (self.dbg || self.dbg_watchdog) {
                                console.log('watchdog : connecting to peer with default streams (audio'
                                            + (this.useVideo ? ' and video, full duplex' :
                                                               ' only, full duplex')
                                            + ') ' + peerDesc);
                            }
                            self.connectToPeer(peerDesc);
                        }
                    } else if (state === "ghost") {
                        if (self.dbg || self.dbg_watchdog) console.log('watchdog : closing peer ', peerDesc);
                        peer.end();
                        self.updateRoomDescription();
//                    } else if (state === "remote") {
                        // the peer exists in webrtc's peers but it is not in our self.peers list
                        // allow it to exist for some time as an entry might (should) be added soon for it
                        
                        // BUT FOR NOW : leave it alone, as there is still no sync from the server
//                        var elapsed = new Date().getTime() - self.peerTimers[peerDesc].getTime();
//                        var limit = 5000;
//                        if (elapsed > limit) {
//                            console.log('closing foreign peer ', peerDesc, ' which was aged ', elapsed, 'ms   status : ', peer.sid);
//                            peer.end();
//                        } else {
//                            if (self.dbg || self.dbg_watchdog) console.log('watchdog : foreign peer found (in grace period, age :', elapsed,'ms) :', peerDesc, peer.sid,
//                                                                           'iceConnectionState:', state.iceConnectionState.toUpperCase(),
//                                                                           'iceGatheringState', state.iceGatheringState.toUpperCase(),
//                                                                           'signalingState', state.signalingState.toUpperCase());
//                        }
                    } else {
//                        if (self.dbg || self.dbg_watchdog) console.log('watchdog : checking peer health :', peerDesc, peer.sid,
//                                                                       'iceConnectionState:', state.iceConnectionState.toUpperCase(),
//                                                                       'iceGatheringState', state.iceGatheringState.toUpperCase(),
//                                                                       'signalingState', state.signalingState.toUpperCase());
                        if (state.negotiating) {
                            var elapsed = new Date().getTime() - self.peerTimers[peerDesc].getTime();
                            var limit = 7000;
                            if (elapsed > limit) {
                                console.log('closing peer ', peerDesc, ' which was aged ', elapsed, 'ms   status : ', state);
                                peer.end();
                                self.updateRoomDescription();
                            }
                        }
                    }
                    
                }
            }
        } else {
            // we are disconnecting all the peers (instead of SimpleWebRTC's leaveRoom()
            // method which would emit "leave", disconnecting the socket)
            if ((self.webrtc.roomName) &&
                (self.webrtc.getPeers().length)){
                if (self.dbg || self.dbg_watchdog) console.log('watchdog : ending all the peers...');
                while (self.webrtc.webrtc.peers.length) {
                    if (self.dbg || self.dbg_watchdog) console.log('watchdog : ending peer', self.webrtc.webrtc.peers[0]);
                    self.webrtc.webrtc.peers.shift().end();
                }
            }
        }
        
        
        
        if (!self.media && ! self.signaling && ! self.peer) {
            // finally stop the watchdog
            if ((currentStatus.socketIsConnected === false) &&
                (currentStatus.localMedia === false)) {
                if (self.watchdogInterval) {
                    if (self.dbg || self.dbg_watchdog) console.log('watchdog : stopping watchdog');
                    clearInterval(self.watchdogInterval);
                    self.watchdogInterval = null;
                    self.onStopped();
                }
            }
        }
    }
    
    this.runWatchdog = function () {
        if (self.watchdogInterval) {
            if (self.dbg) console.log('running watchdog... ');
            clearInterval(self.watchdogInterval);
            self.watchdogInterval = null;
            self.onStarted();
        }
        var justStarted = self.watchdogInterval === null;
        self.watchdogInterval = setInterval(self.watchdog, 300);
    }
    
    this.declineOffer = function(offer, reason) {
        if (self.dbg) {console.log('sending decline offer message : ', reason)}
        var message = {
            to: offer.from,
            sid: offer.sid,
            roomType: offer.roomType,
            type: "decline",
            reason: reason
        };
        self.connection.emit('message', message);
    }
    
    
    // create our webrtc object
    this.webrtc = new SimpleWebRTC({
        // flush the default signalmaster demo server's url to prevent eventual connection attempts
        // but the connection should already be initialized and connected
        url: '',
        // our connection object which is already authenticated and connected
        connection: this.connection,
        // the id/element dom element that will hold "our" video
        localVideoEl: 'localVideo',
        // the id/element dom element that will hold remote videos
        remoteVideosEl: '',
        // immediately ask for camera access
        autoRequestMedia: false,
        debug: false,
        detectSpeakingEvents: false,
        autoAdjustMic: false,
        enableDataChannels: false,
        adjustPeerVolume: false,
        peerVolumeWhenSpeaking: 0.25,
        media: {
            video: true,
            audio: true
        },
        receiveMedia: {
            offerToReceiveAudio: true,
            offerToReceiveVideo: true
        },
        localVideo: {
            autoplay: true,     // automatically play the video stream on the page
            mirror: true,       // flip the local video to mirror mode (for UX)
            muted: true         // mute local video stream to prevent echo
        },
        peerConnectionConfig: {
            debug: false
          //, iceTransports: "relay"
          , useJingle: false
        }
    });
    
    this.webrtc.on('connectivityError', function(peer) {
        console.error('CONNECTIVITY ERROR : ', peer);
    });
    
    this.webrtc.on('iceFailed', function(peer) {
        console.error('ICE FAILED : ', peer);
    });
                                                    
    // remove the default 'connected' handler which has just beed added to our connection
    // because we will call it ourself once the socket is authenticated
    this.webrtc.connection.connection.$events.connect = [
        function _onConnect() {
            self.watchdog();
        }
    ];

    // prevent the default disconnect() method from deleting the connection object
    this.webrtc.__proto__.disconnect = function () {
        self.connection.disconnect();
    }

    // register the handler
    this.connection.on('unauthorized', function _onUnauthorized(err){
        console.log("Error : Authentication with the signaling server FAILED : ", err.message);
        self.connection.authenticated = false;
        self.token = 'none';
        self.watchdog();
    });
    
    this.connection.on('authenticated', function _onAuthenticated(){
        if (self.dbg) console.log('authentication successful');
        self.connection.authenticated = true;
        self.watchdog();
    });

    // once we received all the stun/turn servers, startLocalVideo can be called
    // note : turnservers will always be sent after the stunservers
    this.connection.on('turnservers', function _onTurnServers() {
        if (self.dbg) console.log('received turnservers');
        self.webrtc.emit('connectionReady', self.connection.getSessionid());
        self.webrtc.sessionReady = true;
        self.watchdog();
    });
    
    // replace the default offer handling function of webrtc
    this.connection.on('message', function (message) {
        var peers = self.webrtc.webrtc.getPeers(message.from, message.roomType);
        var peer;

        if (message.type === 'offer') {
            if ( ! message.payload.streamsDirections) {
                console.error('watchdog : error : offer message did not contain streamsDirections');
            } else {
                if (! self.peer) {
                    console.log("a peer tried to connect but self.peer is false   => declining offer");
                    self.declineOffer(message, "currently not accepting connections");
                } else {
                    peers.forEach(function (p) {
                        // if the peer has already been found in a previous iteration, return
                        if (peer) return;

                        // we need to compare the IDs AND the streamsDirections properties, because several
                        // peers can share the same ID (which is basically its socket UUID)
                        if ((p.id === message.from) &&
                            ((message.payload.streamsDirections.audio.receive === p.pc.streamsDirections.audio.receive) &&
                             (message.payload.streamsDirections.audio.send === p.pc.streamsDirections.audio.send) &&
                             (message.payload.streamsDirections.video.receive === p.pc.streamsDirections.video.receive) &&
                             (message.payload.streamsDirections.video.send === p.pc.streamsDirections.video.send))) {
                            peer = p;
                        }
                    });

                    // if a peer has been found and if it has the same sid, just let it handle the message normally,
                    // if a peer has been found and the sid is different, it has the same streamsDirections and it has already sent an offer
                    // I use the smallest sid as a tiebreaker (inspired from https://www.ietf.org/proceedings/82/slides/rtcweb-10.pdf) to
                    // decide if we accept the offer and throw away our "peer-to-be" (still connecting) or if we keep our peer and decline the offer
                    // I keep the smallest sid as it is statistically older, because it is created by SimpleWebRTC's Peer() constructor 
                    // as a new Date().toString()
                    if (peer) {
                        if (peer.sid < message.sid) {
                            // our peer wins the tie-breaker, but if it is "connected", it must have missed a disconnection
                            // and the offer  we receive means that we need to close this peer, because the other side is closed
                            if (peer.pc.iceConnectionState === "connected") {
                                peer.end();
                                peer = null;
                            } else {
                                // signal glare so that the other peer knows he lost
                                // note : the other peer will know when he receives our offer, sooner or later,
                                // but this can speed things up and avoid useless ICE discoveries and free our useless TURN allocations
//                                console.log('DECLINING OFFER (won the glare tie-breaker)');//    our peer => ', peer.sid, ' < ', message.sid, ' <= other peer    ', peer);
                                self.declineOffer(message, "glare");
                            }
                        } else if (peer.sid > message.sid) {
                            // our peer lost the tie-breaker, close it and create a new peer
//                            console.log('closing peer (glare)', peer.sid, '  message from :', message.sid);
                            peer.end();
                            peer = null;
                        } else {
                            //peer.sid === message.sid, this could happen if subsequent offers happen
                            console.log('----- UPDATED OFFER ------ ! ', message);
                            peer.handleMessage(message);
                        }
                    }

                    if (! peer) {
                        // accept the offer
                        peer = self.webrtc.webrtc.createPeer({
                            id: message.from,
                            sid: message.sid,
                            type: message.roomType,
                            enableDataChannels: false,
                            sharemyscreen: false,
                            broadcaster: message.roomType === 'screen' && !message.broadcaster ? self.connection.getSessionid() : null,
                            receiveMedia: {
                                offerToReceiveAudio: message.payload.streamsDirections.audio.receive,
                                offerToReceiveVideo: message.payload.streamsDirections.video.receive
                            }
                        });
                        peer.pc.isInitiator = peer.isInitiator = false;
                        peer.pc.streamsDirections = message.payload.streamsDirections;

                        // replace default end() method to signal the other side that we are closing (firefox doesn't implement the "readyState" status...)
                        var boundEnd = peer.end.bind(peer);
                        peer.end = function() {
                            peer.send('close');
                            boundEnd();
                            self.updateRoomDescription();
                        }
                        self.peerTimers[self.createPeerDescription(message.from, message.payload.streamsDirections)] = new Date();
                        self.webrtc.emit('createdPeer', peer);
                        peer.handleMessage(message);
                    }
                }
            }
        } else {
            // any other message type than 'offer'
            peers.forEach(function (peer) {
                if ((message.sid) && (peer.sid === message.sid)) {
                    if (message.type === 'decline') {
//                        console.log('received "DECLINE" message : closing peer : ', message.reason);
                        peer.end();
                    } else if (message.type === 'close') {
//                        console.log('closing peer : the other side is closing');
                        peer.end();
                    } else {
                        peer.handleMessage(message);
                    }
                }
            });
        }
    });
                                                    
    // logging
    this.connection.on('*', function (event) {
        if ( self.dbg_allSocketEvents ||
            ((self.dbg_socketEvents) && (true
                && event !== 'volumeChange'
                && event !== 'channelMessage'
                && event !== 'remoteVolumeChange')) ||
             ((self.dbg_roomEvents) && (false
                || event === 'join'
                || event === 'remove'
                || event === 'leave')))
        {
            if (event !== 'message') console.log("socket : ", event, arguments);
            else console.log('socket : ', event, '  type :', arguments[1].type);
        }
    });

    // Firefox and Chrome sometimes fail to get in touch, after investigations,
    // the order of the messages sent via the signaling medium (websocket)
    // seemed weird to me : in case of failure, I could identify two symptoms :
    // firefox is the initiator (sends the offer) and Chrome answers immediately
    // instead of waiting for the incoming ice candidates (the trickle
    // grace period not being respected ?)
    // As a fix, I delay the messages and stack them so that they 
    // "approximately" arrive at the same time.
    if (this.webrtc.webrtc.callbacks['message'].length !== 1) {
        console.error("Error : webrtc.webrtc.callbacks['message'] should have length of 1!" + " The fix won't be applied");
    } else {
        this.webrtc.eventStack = [];
        var originalCallback = this.webrtc.webrtc.callbacks['message'][0];
        this.webrtc.webrtc.off('message');
        this.webrtc.webrtc.on('message', function (message) {
            var action = function () {
                originalCallback(message);
            }
            
            self.webrtc.eventStack.push(action);

            setTimeout(function () {
                //console.log('flushing event stack ('+ webrtc.eventStack.length+' elements)');
                var currentStatus = self.status();
                if (!currentStatus.socketIsAuthenticated) {
//                    console.log("not connected, deleting the eventStack");
                    self.webrtc.eventStack = [];
                } else {
                    while (self.webrtc.eventStack.length > 0) {
                        self.webrtc.eventStack.shift()();
                    }
                }
            }, 235);
        });
    }

    // a peer video has been added
    this.webrtc.on('videoAdded', function (video, peer) {
        if (self.dbg) console.log('videoAdded', peer, video);
        var remotes = document.getElementById('remotes');
        if (!remotes) {
            console.error('the "remotes" container was not found.');
        } else {
            // remove all other peers, if any
//            self.webrtc.getPeers().forEach(function (peerToDelete) {
//                if (peer !== peerToDelete) {
//                    peerToDelete.end();
//                }
//            });
            // and their associated eventual elements (if it is dirty for some reason)
//            flushRemoteVideos();

            var container = document.createElement('div');
            container.className = 'videoContainer';
            container.id = 'container_' + self.webrtc.getDomId(peer);
            container.appendChild(video);

            // suppress contextmenu
            video.oncontextmenu = function () {
                return false;
            };

            // track the ice connection state
            if (peer && peer.pc) {
                peer.pc.on('iceConnectionStateChange', function (event) {
                    self.status();
                    switch (peer.pc.iceConnectionState) {
                        case 'checking':
                            if (self.dbg || self.dbg_iceConnectionStateChange)
                                console.log('ICE connection state changed (',
                                    event.target.iceConnectionState, ') : Connecting to peer...');
                            break;
                        case 'connected':
                        case 'completed': // on caller side
                            if (self.dbg || self.dbg_iceConnectionStateChange)
                                console.log('ICE connection state changed (',
                                    event.target.iceConnectionState, ') : Connection established.');
                            break;
                        case 'disconnected':
                            if (self.dbg || self.dbg_iceConnectionStateChange)
                                console.log('ICE connection state changed (',
                                    event.target.iceConnectionState, ') : Disconnected.');
                            break;
                        case 'failed':
                            //if (self.dbg || self.dbg_iceConnectionStateChange)
                            console.log('ICE connection state changed (',
                                event.target.iceConnectionState, ') : Connection failed.');
                            break;
                        case 'closed':
                            if (self.dbg || self.dbg_iceConnectionStateChange)
                                console.log('ICE connection state changed (',
                                    event.target.iceConnectionState, ') : Connection closed.');
                            break;
                    }
                });

                if (self.dbg || self.dbg_iceSignalingStateChange) {
                    peer.pc.on('signalingStateChange', function (event) {
                        self.status();
                        console.log('ICE signaling state changed to ', event.target.signalingState);
                    });
                }

                // dump current status in the console
                peer.pc.on('*', function (event) {
                    self.status();
                });
            }
            remotes.appendChild(container);
            self.onPeerAdded();
        }
    });

    // a peer was removed
    this.webrtc.on('videoRemoved', function (video, peer) {
        if (self.dbg) console.log('videoRemoved', peer);
        var remotes = document.getElementById('remotes');
        var el = document.getElementById(peer ? 'container_' + self.webrtc.getDomId(peer) : 'localScreenContainer');
        if (remotes && el) {
            remotes.removeChild(el);
        }
        self.onPeerLeft(peer);
        self.watchdog();
    });

    this.webrtc.on('readyToCall', function () {
        self.watchdog();
    });
            
    this.webrtc.on('localStream', function () {
        self.onMediaOpened();
        self.watchdog();
    });

    this.webrtc.on('turnservers', function () {
        self.watchdog();
    });

    this.webrtc.on('leftroom', function () {
        console.log('leftroom');
        self.watchdog();
    });
    
    this.connection.on('roomDescription', function(roomDescription) {
        self.updateRoomDescription(roomDescription);
        self.watchdog();
    });
    
    this.connection.on('message', function(message) {
        if (message !== "hello") return;
        self.connection.emit('getRoomDescription');
        console.error('HELLO received')
        self.watchdog();
    });
    

    // reset the sessionReady flag manually because reconnecting is not supported by SimpleWebRTC
    this.connection.connection.socket.on('disconnect', function () {
        if (self.dbg) console.log('disconnect : socket disconnected');
        self.webrtc.sessionReady = false;
        self.connection.authenticated = false;
        self.watchdog();
        
        console.log('disconnect : socket disconnected', arguments);
    });
}


WebRTC.prototype.onStarted          = function() { /*if (this.dbg)*/ /*console.log('default handler :  onStarted()');*/ }
WebRTC.prototype.onStopped          = function() { /*if (this.dbg)*/ /*console.log('default handler :  onStopped()');*/ }
WebRTC.prototype.onMediaOpened      = function() { /*if (this.dbg)*/ /*console.log('default handler :  onMediaOpened()');*/ }
WebRTC.prototype.onMediaClosed      = function() { /*if (this.dbg)*/ /*console.log('default handler :  onMediaClosed()');*/ }
WebRTC.prototype.onPeerAdded        = function() { /*if (this.dbg)*/ /*console.log('default handler :  onPeerAdded()');*/ }
WebRTC.prototype.onPeerLeft         = function() { /*if (this.dbg)*/ /*console.log('default handler :  onPeerLeft()');*/ }


WebRTC.prototype.stop = function() {
    if (this.dbg || this.dbg_statusChanges) console.log('hanging up');
    
    this.media = false;
    this.signaling = false;
    this.peer = false;
    
    // ensure that the keep-alive mechanism will handle the de-activation
    this.runWatchdog();

    // reset the sessionReady flag manually as SimpleWebRTC is not meant to be re-usable once disconnected
    this.webrtc.sessionReady = false;
}

WebRTC.prototype.start = function _start(media, signaling, peer) {
    if (this.dbg || this.dbg_statusChanges) console.log('calling...');
    
    this.status();
    
    // set the desired flags
    if (arguments.length === 3) {
        this.media = media;
        this.signaling = signaling;
        this.peer = peer;
    } else {
        this.media = true;
        this.signaling = true;
        this.peer = true;
    }
    
    console.log(arguments)
    // run the keep-alive mechanism
    this.runWatchdog();
} //_call

WebRTC.prototype.addPeer = function (peerID, streamsDirections) {
    if (peerID === this.connection.getSessionid()) return;
    
    var peerDesc;
    if (typeof streamsDirections !== 'undefined') {
        peerDesc = this.createPeerDescription(peerID, streamsDirections);
    } else {
        // defaults to full media and directions
        peerDesc = peerID + "/_audioIN_audioOUT_videoIN_videoOUT";
    }

    if (peerDesc.split('_').length < 2) {
        console.log('warning : added a "useless" peer, without any stream');
    }
    
    if (this.peers.indexOf(peerDesc) === -1) {
        this.peers.push(peerDesc);
    }
    this.watchdog();
}

WebRTC.prototype.removePeer = function (peerID, streamsDirections) {
    this.peers = this.peers.filter(function(desc) {
        var remove;
        if (arguments.length < 2) {
            // if streamsDirections is missing, remove all the peers with the provided ID
            remove = (peerID === this.parsePeerDescription(desc)[0]);
        } else {
            remove = (this.parsePeerDescription(peerID, streamsDirections) === desc);
        }
        if (remove) console.log('removing peer ',  desc, ' off the peers list');
        return !remove;
    });
        
    this.watchdog();
}

WebRTC.prototype.getId = function () {
    var self = this;
    if (self.webrtc){
        if (self.webrtc.connection) {
            return self.webrtc.connection.getSessionid();
        }
        else return null;
    }
    else return null
}

WebRTC.prototype.status = function () {
    var self = this;
    var result = {
        watchdogIsRunning: null,
        localMedia: null,               // audio/webcam is activated and the localStream is available
        socketState: null,              
        socketIsConnecting: null,       // the websocket is connecting (not yet authenticating/authenticated)
        socketIsConnected: null,        // whether the websocket is connected (may still be unauthenticated)
        connectedToPeers: null,         // at least one peer is connected or negotiating
        negotiatingWithPeers: null,     // at least one peer is not completely connected (all the media tracks)
        peersStates: {}                 // details of the connection status of each peer
    };

    this.lastKnownStatus = this.currentState || null;
    
    // check whether the watchdog is active 
    result.watchdogIsRunning = this.watchdogInterval ? true : false;

    // socket's connection status
    result.socketState =
        (this.connection.connection.socket.connected) ? 'connected' :
        (this.connection.connection.socket.connecting) ? 'connecting' :
        (this.connection.connection.socket.reconnecting) ? 'reconnecting' : 'disconnected';

    // a little helper for the socket status
    result.socketIsConnected = result.socketState === 'connected';
    result.socketIsConnecting = result.socketState === 'connecting' || result.socketState === 'reconnecting';
    result.socketIsAuthenticated = this.connection.authenticated === true;

    // create an expected connections states list with all the peers in the webrtc object AND with our self.peers list
    // 'closed'     broken peer, will be removed by the next watchdog iteration (it has should have missed a disconnection)
    // 'ghost'      the peer has been created by this side, tag it as a ghost until we know it has an entry in the peers list
    // 'remote'     the peer has been created by the other side, it may not (yet) have its own entry in the peers list
    self.webrtc.getPeers().forEach(function(peer) {
        var peerDesc = self.createPeerDescription(peer.id, peer.pc.streamsDirections);
        if (peer.pc.signalingState === 'closed') {
            result.peersStates[peerDesc] = 'closed';
        } else if (peer.isInitiator) {
            result.peersStates[peerDesc] = 'ghost';
        } else {
            result.peersStates[peerDesc] = 'remote';   
        }
    });
    
    // create entries for all the other peers in the peers list and remove the ghost tags
    this.peers.forEach(function(peerDesc) {
        if (typeof result.peersStates[peerDesc] === 'undefined') result.peersStates[peerDesc] = null;
    });
    
    this.peers.forEach(function(peerDesc) {
        var parsedDesc = self.parsePeerDescription(peerDesc);
        
        self.webrtc.getPeers().forEach(function(peer, index) {
            if ((peer.id !== parsedDesc.id) ||
                (peer.pc.streamsDirections.audio.receive !== parsedDesc.streamsDirections.audio.receive) ||
                (peer.pc.streamsDirections.audio.send !== parsedDesc.streamsDirections.audio.send) ||
                (peer.pc.streamsDirections.video.receive !== parsedDesc.streamsDirections.video.receive) ||
                (peer.pc.streamsDirections.video.send !== parsedDesc.streamsDirections.video.send)) {
                return;
            }

            var peerStatus = {
                peer : peer,
                signalingState: null,
                iceConnectionState: null,
                iceGatheringState: null,
                connected: null,
                localSDP: null,
                streamsDirections : parsedDesc.streamsDirections,
                remoteSDP: null,
                isInitiator: null
            };

            peerStatus.signalingState = peer.pc.pc.peerconnection.signalingState;
            peerStatus.iceConnectionState = peer.pc.pc.peerconnection.iceConnectionState;
            peerStatus.iceGatheringState = peer.pc.pc.peerconnection.iceGatheringState;
            if (peerStatus.iceConnectionState !== 'closed') {
                if (peer.pc.pc.localDescription) {
                    peerStatus.localSDP = peer.pc.pc.localDescription.sdp;
                    peerStatus.isInitiator = peer.pc.isInitiator;
                }
                if (peer.pc.pc.remoteDescription) {
                    peerStatus.remoteSDP = peer.pc.pc.remoteDescription.sdp;
                }
            }
            
            // TODO : check the directions and media tracks states
            // for now :
            peerStatus.connected = false;
            if (peerStatus.localSDP && peerStatus.remoteSDP &&
                ((peerStatus.iceConnectionState === 'completed') ||
                 (peerStatus.iceConnectionState === 'connected'))) {
                peerStatus.connected = true;
            }
            
            
            if (peerStatus.connected && typeof peer.pc.getStats === 'function') {
                peer.pc.getStats(function(err, data){
                    if (err) {
                        console.log('getStats returned error : ', err);
                    } else {
//                        console.log(data);
                        var sent = 0,
                            received = 0;
                        for (var attr in data) {                                                        continue;
                            if (typeof data[attr]['ssrc'] !== "undefined") {
                                console.log(attr, data[attr]);
                                console.log('SSRC  '+('____________'+data[attr]['ssrc']).slice(-12)+'__ :  '+data[attr]['id']);
//                                console.log('    sent : ' + ("          "+((typeof data[attr]['bytesSent'] !== 'undefined') ?
//                                                                         data[attr]['bytesSent']:0)).slice(-10) + ' bytes    ' + attr);
//                                console.log('received : ' + ("          "+((typeof data[attr]['bytesReceived'] !== 'undefined') ?
//                                                                         data[attr]['bytesReceived']:0)).slice(-10) + ' bytes    ' + attr);

                                console.log('\n');
                            }
                            sent     += new Number((typeof data[attr]['bytesSent']     !== 'undefined') ? data[attr]['bytesSent'] : 0);
                            received += new Number((typeof data[attr]['bytesReceived'] !== 'undefined') ? data[attr]['bytesReceived'] : 0);
                        }
//                        console.log('total bytes sent : ', sent, '  bytes received : ', received);
                    }
                });
            }

            // check whether a negotiation is in progress with the peer
            /* * * * * *
             * 
             *  enum RTCIceConnectionState {
             *      "new",              
             *      "checking",         occurs if ANY component has received a candidate and can start checking
             *      "connected",        occurs if ALL components have established a working connection
             *      "completed",        occurs if ALL components have finalized the running of their ICE processes
             *      "failed",           occurs if ANY component has given up trying to connect
             *      "disconnected",     occurs if ANY component has failed liveness checks
             *      "closed"            occurs only if RTCPeerConnection’s close() method has been called.
             *  };
             *
             *  enum RTCSignalingState {
             *      "stable",
             *      "have-local-offer",
             *      "have-remote-offer",
             *      "have-local-pranswer",
             *      "have-remote-pranswer",
             *      "closed"
             *  };
             *  
             *  "stable": There is no offer-answer exchange in progress.
             *            This is also the initial state in which case the local and remote descriptions are empty.
             *
             *
             *  enum RTCIceGatheringState {
             *      "new",          The object was just created, and no networking has occurred yet.
             *      "gathering",    The ICE agent is in the process of gathering candidates for this RTCPeerConnection.
             *      "complete"      The ICE agent has completed gathering. Events such as adding a new interface or a new
             *                      TURN server will cause the state to go back to gathering.
             *  };
             *
             *
             *
             */
            peerStatus.negotiating = 
                peerStatus.signalingState &&
                (peerStatus.signalingState !== 'stable' ||
                (peerStatus.signalingState === 'stable' && !peerStatus.connected));
            
            if (peerStatus.negotiating) {
                if (!peer.negotiatingSince) {
                    peer.negotiatingSince = new Date();
                }
            } else {
                delete peer.negotiatingSince;
            }
            
            result.negotiatingWithPeers = result.negotiatingWithPeers || peerStatus.negotiating;
            
            result.connectedToPeers = result.connectedToPeers || peerStatus.connected || peerStatus.negotiating;
            
            result.peersStates[peerDesc] = peerStatus;
        }); //self.webrtc.getPeers().forEach
    }); //this.peers.forEach
    
    
    // whether the local medias are opened
    if (this.webrtc.webrtc.localStreams.length > 0) {
        result.localMedia = true;
    } else {
        result.localMedia = false;
    }


    // keep the current state so that we can track changes
    this.currentState = result;

    // print changes for debugging
    if ((this.dbg_statusChanges) && (typeof this.currentState !== undefined)) {
        if (typeof this.lastKnownStatus !== 'undefined') {
            var hadChanges = false;
            for (var prop in this.lastKnownStatus) {
                if (this.lastKnownStatus[prop] !== this.currentState[prop]) {
                    hadChanges = true;
                    if (prop !== 'localSDP' && prop !== 'remoteSDP'){
                        console.log(prop + ': ' + this.lastKnownStatus[prop] + ' -> ' + this.currentState[prop]);
                    } else {
                        var previous = (!this.lastKnownStatus[prop]) ? 'null' : this.lastKnownStatus[prop].substring(0, 30).replace(/\n/g, ',');
                        var current = (!this.currentState[prop]) ? 'null' : this.currentState[prop].substring(0, 30).replace(/\n/g, ',');
                        console.log(prop + ': ' + previous + '... -> ' + current + '...');
                    }
                }
            }
            if (hadChanges) console.log('- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -');
        }
    } // if (dbg_statusChanges)
    return result;
}



