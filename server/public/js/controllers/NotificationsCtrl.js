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