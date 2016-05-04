angular.module('UserService', []).factory('User', function($http) {
    return {
        signin: function(user) {
            return $http.post('/api/users/signin', user);
        },
        
        lostPassword: function(user) {
            return $http.post('/api/users/lostPassword', user);
        },
        
        resetPassword: function(user) {
            return $http.post('/api/users/resetPassword', user);
        },
 
        signout: function() {
            return $http.get('/api/users/signout');
        },

        signup: function(user) {
            return $http.post('/api/users/signup', user);
        },
        
        activation: function(user) {
            return $http.post('/api/users/activation', user);
        },

        changePassword: function(user) {
            return $http.post('/api/users/changePassword', user);
        },
        
        read: function() {
            return $http.get('/api/users/profile');
        },
        
        update: function(user) {
            return $http.put('/api/users', user);
        }
    }
});