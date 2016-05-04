angular.module('ContactService', []).factory('Contact', function($http) {
    return {
        accepted: function() {
            return $http.get('/api/contacts/relationships/accepted');
        },
        sent: function() {
            return $http.get('/api/contacts/relationships/sent');
        },
        received: function() {
            return $http.get('/api/contacts/relationships/received');
        },
        search: function(info) {
            return $http.get('/api/contacts/search/' + info.name);
        },
        searchAccepted: function(info) {
            return $http.get('/api/contacts/search/' + info.name + '/relationships/accepted');
        },
        read: function(info) {
            return $http.get('/api/contacts/read/' + info.username);
        },
        readLight: function(info) {
            return $http.get('/api/contacts/read/' + info.username + '/light');
        },
        update: function(info) {
            return $http.put('/api/contacts/', info);
        },
        delete: function(info) {
            return $http.delete('/api/contacts/' + info.username);
        },
        frequent: function() {
            return $http.get('/api/contacts/frequent');
        }
    }
});