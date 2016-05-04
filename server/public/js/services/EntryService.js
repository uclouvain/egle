angular.module('EntryService', []).factory('Entry', function($http) {
    return {
        list: function(config) {
            return $http.get('/api/entries/type/'+ config.type + '/subtype/' + config.subType);
        },
        
        create: function(entry) {
            return $http.post('/api/entries', entry);
        },
        
        delete: function(entry) {
            return $http.delete('/api/entries/' + entry.id);
        }
    }
});