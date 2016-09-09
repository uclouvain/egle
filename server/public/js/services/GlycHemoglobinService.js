angular.module('GlycHemoglobinService', []).factory('GlycHemoglobin', function($http) {
    return {
        computeValue: function() {
            return $http.get('/api/hemoglobin');
        }
    }
});