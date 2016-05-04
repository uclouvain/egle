angular.module('ObjectiveService', []).factory('Objective', function($http) {
    return {
        delete: function(objective) {
            return $http.delete('/api/objectives/'+objective.id);
        },

        read: function(objective) {
            return $http.get('/api/objectives/'+objective.type);
        },
        
        createOrUpdate: function(rcvObj) {
            return $http.put('/api/objectives', rcvObj);
        }
    }
});