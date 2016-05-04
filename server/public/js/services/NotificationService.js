angular.module('NotificationService', []).factory('Notification', function($http) {
    return {
        list: function() {
            return $http.get('/api/notifications');
        },
        
        listLimited: function() {
            return $http.get('/api/notifications/limited');
        },
        
        update: function(notification) {
            return $http.put('/api/notifications/' + notification.id);
        }
    }
});