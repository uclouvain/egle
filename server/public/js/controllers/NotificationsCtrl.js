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

angular.module('NotificationsCtrl', []).controller('NotificationsController', function($scope, gettextCatalog, $state, $ocLazyLoad, $injector) {
    $ocLazyLoad.load('js/services/NotificationService.js').then(function() {
        var Notification = $injector.get('Notification');
        function getNotifications(){
            Notification.list({}).success(function(notifications) {
                for(var i=0; i<notifications.length; i++){
                    notifications[i].content = gettextCatalog.getString(notifications[i].content);
                }
                $scope.notifications = notifications;

                $scope.helper = [];
                if($scope.notifications.length == 0){
                    $scope.helper = {
                        msg1: gettextCatalog.getString('No recent notification!')
                    };
                }
            }).error(function(status, data) {
                $rootScope.rootAlerts.push({
                    type:'danger',
                    msg: gettextCatalog.getString('An error occurred, please try again later'),
                    priority: 2
                });
            });
        }
        getNotifications();

        $scope.typesMapping = { 
            glycaemia: {name: gettextCatalog.getString("Objectives"), href: 'home.notifications'},//objectives
            contacts: {name: gettextCatalog.getString("My Contacts"), href: 'home.contacts.main'}
        }

        $scope.go = function(notification){
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
    });
});