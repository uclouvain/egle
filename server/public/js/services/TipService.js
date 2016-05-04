angular.module('TipService', []).factory('Tip', function ($http) {
    return {
        list: function () {
            return $http.get('/api/tips');
        },
        read: function (id) {
            return $http.get('/api/tips/' + id);
        },
        bookmark: function (tip) {
            return $http.put('/api/tips/bookmarks', tip);
        }
    };
});