angular.module('PatientService', []).factory('Patient', function($http) {
    return {
        medicalRecord: function(patient) {
            return $http.get('/api/patients/' + patient.username);
        },
        
        entries: function(config) {
            return $http.get('/api/patients/'+config.username+'/entries/'+config.type);
        },
        
        chart: function(config) {
            return $http.get('/api/patients/'+config.username+'/charts/'+config.type+'/from/'+config.from+'/to/'+config.to);
        }
    }
});