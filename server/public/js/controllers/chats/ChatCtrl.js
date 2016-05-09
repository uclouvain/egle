/*
 * The copyright in this software is being made available under MIT License 
 * MIT License, included below. This software may be subject to other third 
 * party and contributor rights, including patent rights, and no such rights
 * are granted under this license.
 *
 * Copyright (c) 2014-2016, Universite catholique de Louvain (UCL), Belgium
 * Copyright (c) 2014-2016, Professor Benoit Macq
 * Copyright (c) 2014-2016, Benoît Dereck-Tricot
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

angular.module('ChatCtrl', []).controller('ChatController', function ($scope, $window, gettextCatalog, $stateParams, $state, $ocLazyLoad, $injector, $rootScope, ModalService) {
    $ocLazyLoad.load('js/services/ChatService.js').then(function () {
        var Chat = $injector.get('Chat');
        $scope.hideOptions = true;
        $scope.forbidden = false;
        // keep a copy of the root scope
        var rootScope = $scope.$root;
        
        // contactUsername is the username of the contact if its account still exists,
        // otherwise it is underscore+old ID ("_23ANID3236234...")
        $scope.contactUsername = $stateParams.username;

        // check whether the contact account has been deleted
        $scope.contactIsDeleted = ($stateParams.username[0] === '_');

        if ($scope.contactUsername !== "") {
            $scope.alerts = [];
            $scope.isWebRTCSupported = $window.mozRTCPeerConnection || $window.webkitRTCPeerConnection;
            $scope.$root.isWebRTCActive = false;
            $scope.$root.callDirection = 'outgoing';
            $scope.isFullscreen = false;
            $scope.messages = [];
            $scope.accountDeleted = gettextCatalog.getString("Deleted account");
            var latestEventDate = null;
            var readChatInterval = null;
            var periodChat = 1000; // 1 second

            if (!$scope.contactIsDeleted) {
                $ocLazyLoad.load('js/services/ContactService.js').then(function () {
                    var Contact = $injector.get('Contact');
                    Contact.readLight({
                        username: $scope.contactUsername
                    }).success(function (profile) {
                        $scope.contactAvatar = profile.avatar;
                        $scope.contactUsername = profile.username;
                    });
                });
            }

            function readChat() {
                if (readChatInterval) {
                    clearInterval(readChatInterval);
                    readChatInterval = null;
                }

                readChatTimer();
                readChatInterval = setInterval(function () {
                    readChatTimer();
                }, periodChat);
            }

            var onWebRTC = function(data) {
//                console.log("onWebRTC : status : ", data);
                if (rootScope.callStatus !== data.status) rootScope.callStatus = data.status;
                if (rootScope.callDirection !== data.callDirection) rootScope.callDirection = data.callDirection;
            }

            function readChatTimer() {
                var command;
                if ($scope.$root.ringing || $scope.$root.calling) {
                    command = 'token';
                } else {
                    command = 'poll';
                }

                Chat.webrtc({
                    username: $stateParams.username,
                    command: command
                }).success(function(data){
                    onWebRTC(data);
                });

                Chat.readChat({
                    username: $scope.contactUsername,
                    afterDate: latestEventDate
                }).success(function (data) {
                    if ($scope.alerts.length > 0) {
                        $scope.alerts = [];
                    }
                    if(data.forbidden){
                        $scope.forbidden = true;
                        $scope.alerts.push({
                            type: 'warning',
                            msg: gettextCatalog.getString("You cannot reply to this conversation"),
                            show: true
                        });
                    }

                    if(data.archived !== null) {
                        $scope.hideOptions = false;
                        $scope.archived = data.archived;
                    }

                    // append to the current array
                    for (var i = 0; i < data.chat.length; i++) {
                        var documentDate = new Date(data.chat[i].datetime);
                        if (!latestEventDate || (documentDate > latestEventDate)) {
                            $scope.messages.push(data.chat[i]);
                            latestEventDate = documentDate;
                        }
                    }
                }).error(function (status, data) {
                    if ($scope.alerts.length === 0) {
                        $scope.alerts.push({
                            type: 'danger',
                            msg: gettextCatalog.getString('An error occurred, please try again later'),
                            show: true
                        });
                    }
                });
            }
            readChat();

            $scope.sendMessage = function () {
                if ($scope.message && !$scope.contactIsDeleted) {
                    var message = $scope.message;
                    $scope.message = "";
                    Chat.sendMessage({
                        username: $stateParams.username,
                        msg: message
                    }).success(function (data) {
                        if ($scope.alerts.length > 0) {
                            $scope.alerts = [];
                        }
                        readChat();
                    }).error(function (status, data) {
                        $scope.message = message;
                        if ($scope.alerts.length === 0) {
                            $scope.alerts.push({
                                type: 'danger',
                                msg: gettextCatalog.getString('An error occurred, please try again later'),
                                show: true
                            });
                        }
                    });
                }
            };

            $scope.toggleArchiveFlag = function () {
                var newFlag = !$scope.archived;
                Chat.setArchiveFlag({
                    username: $scope.contactUsername,
                    flag: newFlag
                }).success(function (data) {
                    if ($scope.alerts.length > 0) {
                        $scope.alerts = [];
                    }
                }).error(function (status, data) {
                    if ($scope.alerts.length === 0) {
                        $scope.alerts.push({
                            type: 'danger',
                            msg: gettextCatalog.getString('An error occurred, please try again later'),
                            show: true
                        });
                    }
                });
            }
            
            $scope.deleteChat = function(){
                ModalService.showModal({
                    templateUrl: "templates/modals/deleteChat.html",
                    controller: function($scope, close){
                        $scope.chat = {username: $stateParams.username};
                        $scope.close = function(result) {
                            close(result, 500); // close, but give 500ms for bootstrap to animate
                        };
                    }
                }).then(function(modal) {
                    modal.element.modal();
                    modal.close.then(function(result) {
                        if(result){
                            Chat.deleteChat({
                                username: $stateParams.username
                            }).success(function (data) {
                                if ($scope.alerts.length > 0) {
                                    $scope.alerts = [];
                                }
                                $state.go("home.chats.main");
                            }).error(function (status, data) {
                                if ($scope.alerts.length === 0) {
                                    $scope.alerts.push({
                                        type: 'danger',
                                        msg: gettextCatalog.getString('An error occurred, please try again later'),
                                        show: true
                                    });
                                }
                            });
                        }
                    });
                });
            }

            $scope.toggleFullScreen = function () {
                $scope.isFullscreen = !$scope.isFullscreen;
            };

            $scope.$on('$stateChangeStart', function (event) {
                if (readChatInterval) {
                    clearInterval(readChatInterval);
                    readChatInterval = null;
                }
            });

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
            if (!$scope.contactIsDeleted && $scope.isWebRTCSupported) {
                $ocLazyLoad.load('additional_components/socket.io/socket.io.0.9.16.js').then(function () {
                    $ocLazyLoad.load('additional_components/simplewebrtc/simplewebrtc.bundle-2.1.0.js').then(function () {
                        $ocLazyLoad.load('additional_components/webrtc/webrtc.js').then(function () {

                            rootScope.callStatus = 'inactive';

                            // compute the roomID (the two usernames sorted alphabetically and separated by '_')
                            // and keep it as a global variable
                            roomID = null;
                            if ($rootScope.user.username.localeCompare($scope.contactUsername) < 0){
                                roomID = $rootScope.user.username + '_' + $scope.contactUsername;
                            } else {
                                roomID = $scope.contactUsername + '_' + $rootScope.user.username;
                            }

                            var getSignalingToken = function _getSignalingToken(cb) {
                                Chat.getSignalingToken(roomID).success(function (token) {
                                    return cb(null, token);
                                }).error(function (err) {
                                    console.error('Error: could not get a signaling token for room "' + roomID + '" ', arguments);
                                    if ($scope.alerts.length === 0) {
                                        $scope.alerts.push({
                                            type: 'danger',
                                            msg: gettextCatalog.getString('An error occurred, please try again later'),
                                            show: true
                                        });
                                    }
                                    return cb(null);
                                });
                            }

                            if (! rootScope.webrtc) {
                                w =
                                rootScope.webrtc = new WebRTC($rootScope.user.username, roomID, "https://beta.egle.be:8888", getSignalingToken);
                                rootScope.webrtc.onStopped      = function() { rootScope.isWebRTCActive = false; }
                                rootScope.webrtc.onMediaClosed  = function() { rootScope.isWebRTCActive = false; }
                                rootScope.webrtc.onMediaOpened  = function() { rootScope.isWebRTCActive = true; }
                                rootScope.webrtc.onReadyToCall  = function() { rootScope.isWebRTCActive = true; }
                            } else {
                                // ensure that webrtc is stopped and update the room for this scope
                                rootScope.webrtc.stop();
                                rootScope.webrtc.room = roomID;
                            }


                            $scope.call = function _call() {
                                // if the server responds 'inactive', activate the media before issuing the call
                                rootScope.isWebRTCActive = true;
                                if (rootScope.callStatus === 'inactive') {
                                    // we are calling, activate media
                                    rootScope.webrtc.start(true, false, false);
                                }
                                Chat.webrtc({
                                    username: $stateParams.username,
                                    command: 'call'
                                }).success(function (data) {
//                                    if (data.status === 'calling' && rootScope.callStatus !== 'calling') {
                                        rootScope.webrtc.start(true,  true,  true);
//                                    }
                                    onWebRTC(data);

                                }).error(function (status, data) {
                                    if ($scope.alerts.length === 0) {
                                        $scope.alerts.push({
                                            type: 'danger',
                                            msg: gettextCatalog.getString('An error occurred, please try again later'),
                                            show: true
                                        });
                                    }
                                    rootScope.webrtc.stop();
                                    rootScope.isWebRTCActive = false;
                                });
                            }

                            $scope.hangup = function _hangup() {
                                rootScope.webrtc.stop();
                                rootScope.isWebRTCActive = false;
                                
                                // send hangup command to the server
                                Chat.webrtc({
                                    username: $stateParams.username,
                                    command: 'hangup'
                                }).success(function (data) {
                                    onWebRTC(data);
                                });
                            }

                            rootScope.$watch('callStatus', function(newVal, oldVal) {
//                                console.log("WATCH : ", oldVal, '->', newVal);
                                if (newVal === 'calling') $scope.call();
                                else if (newVal === 'inactive') $scope.hangup();
                            });

                            // Trigger when exit this route
                            $scope.$on('$stateChangeStart', function (event) {
                                if (rootScope.callStatus !== 'inactive') $scope.hangup();
                            });


                            // helper functions (for the console)
                            wr = w.webrtc.webrtc;
                            ls = wr.localStreams;
                            rs = rootScope;
                            stat = function() { console.log(w.status()); }
                            pause = function() { wr.pause(); }
                            mute = function() { wr.mute(); }
                            resume = function() { wr.resume(); }
                            call = function() { $scope.call() }
                            hangup = function() { $scope.hangup() }
                            target = function(media, signaling, peer) {
                                rootScope.webrtc.start(media, signaling, peer);
                            }
                            toggle = $scope.toggle = function() { if (rootScope.webrtc.peer) target(0,0,0); else target(1,1,1); }
                            tgmedia = function() { 
                                if (rootScope.webrtc.media) target(0,rootScope.webrtc.signaling,0);
                                else                        target(1,rootScope.webrtc.signaling,rootScope.webrtc.signaling && rootScope.webrtc.peer);
                            }
                            tgsignal = function() { 
                                if (rootScope.webrtc.signaling) target(rootScope.webrtc.media,0,0);
                                else                            target(rootScope.webrtc.media,1,rootScope.webrtc.media && rootScope.webrtc.peer);
                            }
                            tgpeer = function() { 
                                if (rootScope.webrtc.peer) target(rootScope.webrtc.media, rootScope.webrtc.signaling, 0);
                                else                       target(1,1,1);
                            }
                            room = function() { rootScope.webrtc.connection.emit('getRoomDescription'); }
                            toggleActive = function() { rootScope.isWebRTCActive = !rootScope.isWebRTCActive; }
                            
                            localStreams = function() { return wr.peers[0].pc.pc.getLocalStreams(); }
                            remoteStreams = function() { return wr.peers[0].pc.pc.getRemoteStreams(); }
                            localStream = function() { return localStreams()[0]; }
                            remoteStream = function() { return remoteStreams()[0]; }
                            localTracks = function() { return localStream().getTracks() }
                            remoteTracks = function() { return remoteStream().getTracks() }
                            
                            countStreams = function() { 
                                console.log('localStreams : ' + localStreams().length);
                                console.log('remoteStreams : ' + remoteStreams().length);
                            }
                            
                            p = function() { return wr.getPeers()[0]; }
                            ps = function() { return wr.getPeers(); }
                            pc = function() { return p().pc; }
                            
                            
                            addPeer = function() {
                                return w.addPeer(p().id, {
                                    audio: {receive: false, send: false},
                                    video: {receive: true , send: true }
                                })
                            }
                            
                            showPeerTracks = function(peer) {
                                console.log('remote stream :');
                                peer.pc.getRemoteStreams()[0].getTracks().forEach(function(track) {
                                    console.log(peer.id, track.type, track.readyState ? track.readyState : 'readyState not supported');
                                });
                                console.log('local stream :');
                            }
                            
                            showPeersTracks = function(peer) {
                                wr.getPeers().forEach(function(peer) { showPeerTracks(peer); });
                            }
                            
                            stats = function() {
                                wr.peers.forEach(function(peer) {
                                    peer.pc.getStats(function(error, data){
                                        var sent = 0,
                                            received = 0;
                                        console.log(data)
                                        for (var attr in data) {
                                            if (typeof data[attr]['ssrc'] !== "undefined") {
                                                console.log('SSRC  '+('____________'+data[attr]['ssrc']).slice(-12)+'__ :  '+data[attr]['id']);
                                                console.log('    sent : ' + ("          "+((typeof data[attr]['bytesSent'] !== 'undefined') ?
                                                                                         data[attr]['bytesSent']:0)).slice(-10) + ' bytes    ' + attr);
                                                console.log('received : ' + ("          "+((typeof data[attr]['bytesReceived'] !== 'undefined') ?
                                                                                         data[attr]['bytesReceived']:0)).slice(-10) + ' bytes    ' + attr);
                                                
                                                console.log('\n');
                                            }
                                            sent     += new Number((typeof data[attr]['bytesSent']     !== 'undefined') ? data[attr]['bytesSent'] : 0);
                                            received += new Number((typeof data[attr]['bytesReceived'] !== 'undefined') ? data[attr]['bytesReceived'] : 0);
                                        }
                                        console.log('total bytes sent : ', sent, '  bytes received : ', received);
                                    });
                                });
                            }
                            
                            
                            listCommands = function() {
                                console.log('wr            =>    w.webrtc.webrtc;');
                                console.log('ls            =>    w.webrtc.webrtc.localStreams;');
                                console.log('stat          =>    console.log(w.status());');
                                console.log('pause         =>    w.webrtc.webrtc.pause();');
                                console.log('mute          =>    w.webrtc.webrtc.mute();');
                                console.log('resume        =>    w.webrtc.webrtc.resume();');
                                console.log();
                                console.log('target        =>    rootScope.webrtc.start(media, signaling, peer);');
                                console.log();
                                console.log('toggle        =>    if (rootScope.webrtc.peer) target(0,0,0); else target(1,1,1);');
                                console.log('tgmedia       =>    switches media');
                                console.log('tgsignal      =>    switches signaling');
                                console.log();
                                console.log('toggleActive  =>    rootScope.isWebRTCActive = !rootScope.isWebRTCActive;');
                                console.log('room          =>    sends "getRoomDescription" to get an updated list of peers');
                                console.log();
                                console.log('localStreams  =>    w.webrtc.webrtc.peers[0].pc.pc.getLocalStreams();');
                                console.log('remoteStreams =>    w.webrtc.webrtc.peers[0].pc.pc.getRemoteStreams();');
                                console.log('localStream   =>    w.webrtc.webrtc.peers[0].pc.pc.getLocalStreams()[0];');
                                console.log('remoteStream  =>    w.webrtc.webrtc.peers[0].pc.pc.getRemoteStreams()[0];');
                                console.log('localTracks   =>    w.webrtc.webrtc.peers[0].pc.pc.getLocalStreams()[0].getTracks();');
                                console.log('remoteTracks  =>    w.webrtc.webrtc.peers[0].pc.pc.getRemoteStreams()[0].getTracks();');
                                console.log();
                                console.log('p             =>    w.webrtc.webrtc.getPeers()[0];');
                                console.log('pc            =>    w.webrtc.webrtc.getPeers()[0].pc;');
                                console.log();
                                console.log('stats         =>    returns a table of sent and received bytes by peer/stream/track/rtp flow');
                            }
                            
                            
                        }); //$ocLazyLoad.load('additional_components/webrtc/webrtc.js')
                    }); //$ocLazyLoad.load('additional_components/simplewebrtc/simplewebrtc.bundle-2.1.0.js')
                }); //$ocLazyLoad.load('additional_components/socket.io/socket.io.0.9.16.js')
            } //if WebRTC Supported
        } else {
            $state.go("home.chats.main");
        }  
    });
});
