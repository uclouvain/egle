angular.module('AuditService', []).factory('Audit', function($http) {
    return {
        listByDate: function(daterange) {
            return $http.get('/api/audit/from/'+daterange.from+'/to/'+daterange.to);
        }
    }
});