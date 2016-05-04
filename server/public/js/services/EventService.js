angular.module('EventService', []).factory('Event', function($http) {
    return{
        
        listByDateRange: function(daterange) {
            return $http.get('/api/events/from/' + daterange.from + '/to/' + daterange.to);
        },
        list: function(event) {
            return $http.get('/api/events/' + event.event_id)
        },
        // Creat and update an event
        create: function(event) {
            return $http.put('/api/events', event);
        },
        delete: function(event) {
            return $http.delete('/api/events/' + event.event_id);
        }
    }
});
