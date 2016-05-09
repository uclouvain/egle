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

angular.module('HeaderCtrl', [[
    'css/templates/sidebar.css',
]]).controller('HeaderController', function($scope, $state, $window, $timeout, gettextCatalog, $ocLazyLoad, $injector, $rootScope) {
    $scope.alert = {};
    $scope.night = (new Date).getHours() > 18  ? true : false;
    $scope.currentState = $state.current.name;
    $scope.dropdown = false;
    
    $rootScope.$on("ERR_CONNECTION_REFUSED", function () {
        if (Object.keys($scope.alert).length == 0 && $rootScope.ERR_CONNECTION_REFUSED) {
            var msg = "";
            if (navigator.onLine) {
                msg = gettextCatalog.getString('Eglé Server Unreachable.');
            } else {
                msg = gettextCatalog.getString('No Internet Connection.');
            }
            $scope.alert = {
                msg: msg, 
                type: 'black',
                priority: 1
            };
        } else if(Object.keys($scope.alert).length > 0 && !$rootScope.ERR_CONNECTION_REFUSED){
            $scope.alert = {};
        }
    });
    
    function autoHide(sec){
        $timeout(function() {
            $scope.alert = {};
        }, sec);
    };
    
    $rootScope.$watch('rootAlerts', function(newValue, oldValue) {
        if(newValue.length > 0){
            $scope.alert = {
                msg: newValue[newValue.length - 1].msg,
                type: newValue[newValue.length  - 1].type
            };
            if(newValue[newValue.length - 1].priority > 3){
                autoHide(3000);
            } else if(newValue[newValue.length - 1].priority === 3){
                autoHide(5000);
            }
        }
    }, true);
    
    $ocLazyLoad.load('js/services/UserService.js').then(function() {
        var User = $injector.get('User');
        
        $scope.signout = function signout() {
            if ($window.localStorage.token) {
                User.signout().success(function(data) {
                    delete $window.localStorage.language;
                    delete $window.localStorage.token;
                    $state.go("signin", {}, {reload: true});
                }).error(function(status, data) {
                    $rootScope.rootAlerts.push({
                        type:'danger',
                        msg: gettextCatalog.getString('An error occurred, please try again later'),
                        priority: 2
                    });
                });
            }
        };

        $ocLazyLoad.load('js/services/UIService.js').then(function() {
            var UI = $injector.get('UI');
            UI.nav().success(function(data) {
                for(var i=0; i< data.nav.left.length; i++){
                     data.nav.left[i].title = gettextCatalog.getString(data.nav.left[i].title);
                }
                $scope.navLeft = data.nav.left;
                $scope.navRight = data.nav.right;
                
                if($scope.navRight.length != 1){
                    $ocLazyLoad.load('js/services/ChatService.js').then(function() {
                        var Chat = $injector.get('Chat');

                        $ocLazyLoad.load('js/services/NotificationService.js').then(function() {
                            var Notification = $injector.get('Notification');

                            $scope.notifications = [];
                            $scope.chatsList = [];
                            $scope.pendingNotifications = 0;
                            $scope.pendingMessages = 0;
                            $scope.helperChat = [];
                            $scope.helperNotification = [];

                            function getChatsList(){
                                Chat.getChatsList().then(function(data){
                                    if (data.length > 0){
                                        if ($scope.helperChat.length > 0) {
                                            $scope.helperChat = [];
                                        }

                                        // copy the array only where necessary, to avoid angular refresh and a flickering
                                        if ( ! angular.equals($scope.chatsList, data)) {
                                            if ($scope.chatsList.length != data.length) {
                                                // refresh anyway
                                                angular.copy(data, $scope.chatsList);
                                            }
                                            else{
                                                // refresh only the modified contents to avoid flickering
                                                $scope.chatsList.forEach(function (chat, index) {
                                                    angular.copy(data[index], $scope.chatsList[index]);
                                                });
                                            }
                                            var pending = 0;
                                            $scope.chatsList.forEach(function (chat) {
                                                if((! chat.archived) && (chat.unreadCount > 0)){
                                                    pending += 1;
                                                }
                                            });
                                            if (pending !== $scope.pendingMessages) {
                                                $scope.pendingMessages = pending;
                                            }
                                        }
                                    }
                                    else{
                                        $scope.chatsList = [];
                                        if ($scope.helperChat.length == 0){
                                            $scope.helperChat = {
                                                msg1: gettextCatalog.getString("No conversation yet?"),
                                                msg2: gettextCatalog.getString("Use the button See All to begin one.")
                                            }
                                        }
                                    }
                                });
                            }

                            function getNotifications(){
                                Notification.listLimited().success(function(notifications) {
                                    if (notifications.length > 0){
                                        if ($scope.helperNotification.length > 0) {
                                            $scope.helperNotification = [];
                                        }
                                        for(var i=0; i<notifications.length; i++){
                                            notifications[i].content = gettextCatalog.getString(notifications[i].content);
                                        }
                                        $scope.notifications = notifications;
                                    }
                                    else{
                                        if ($scope.helperNotification.length == 0) {
                                            $scope.helperNotification = {
                                                msg1: gettextCatalog.getString("No recent notification!")
                                            };
                                        }
                                    }
                                }).error(function(status, data) {
                                    $rootScope.rootAlerts.push({
                                        type:'danger',
                                        msg: gettextCatalog.getString('An error occurred, please try again later'),
                                        priority: 2
                                    });
                                });
                            };

                            function refresh() {
                                $scope.onTimeout = function(){
                                    getChatsList();
                                    getNotifications();
                                    mytimeout = $timeout($scope.onTimeout,2000);
                                }
                                var mytimeout = $timeout($scope.onTimeout,2000);

                                $scope.$on('$destroy', function() {
                                    // Make sure that the interval is destroyed too
                                    $timeout.cancel(mytimeout);
                                });
                            }


                            getChatsList();
                            getNotifications();
                            refresh();

                            $scope.typesMapping = { 
                                glycaemia: {name: gettextCatalog.getString("Objectives"), href: 'home.notifications'},//objectives
                                contacts: {name: gettextCatalog.getString("My Contacts"), href: 'home.contacts.main'}
                            }
                            
                            $scope.readLast = function(){
                                if($scope.notifications[$scope.notifications.length-1] && !$scope.notifications[$scope.notifications.length-1].datetimeRead){
                                    Notification.update({
                                        id: $scope.notifications[$scope.notifications.length-1]._id
                                    }).success(function() {
                                        
                                    }).error(function(status, data) {
                                        $rootScope.rootAlerts.push({
                                            type:'danger',
                                            msg: gettextCatalog.getString('An error occurred, please try again later'),
                                            priority: 2
                                        });
                                    });
                                }
                            };

                            $scope.markAsRead = function(notification, redirect){
                                if(!notification.datetimeRead){
                                    Notification.update({
                                        id: notification._id
                                    }).success(function() {
                                        if($scope.typesMapping[notification.type]){
                                            $state.go($scope.typesMapping[notification.type].href);
                                        } else {
                                            $state.go('home.notifications');
                                        }
                                    }).error(function(status, data) {
                                        $rootScope.rootAlerts.push({
                                            type:'danger',
                                            msg: gettextCatalog.getString('An error occurred, please try again later'),
                                            priority: 2
                                        });
                                    });
                                } else if(notification.datetimeRead) {
                                    if($scope.typesMapping[notification.type]){
                                        $state.go($scope.typesMapping[notification.type].href);
                                    } else {
                                        $state.go('home.notifications');
                                    }
                                }
                            };

                            $scope.$watch('notifications', function() {
                                $ocLazyLoad.load('bower_components/underscore/underscore-min.js').then(function() {
                                    $scope.pendingNotifications = _.filter($scope.notifications, function(notification){
                                        return !notification.datetimeRead;
                                    }).length;
                                });
                            }, true);
                        });
                    });
                }
            }).error(function(status, data) {
                $rootScope.rootAlerts.push({
                    type:'danger',
                    msg: gettextCatalog.getString('An error occurred, please try again later'),
                    priority: 2
                });
            });
        });
    });
});