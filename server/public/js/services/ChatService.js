angular.module('ChatService', []).factory('Chat', function($http, $q) {
    return {
        getChatsList: function() {
            var deferred = $q.defer();
            $http.get('/api/chats/').success(function (data){
                deferred.resolve(data);
            });
            
            return deferred.promise;
        },
        readChat: function(info) {
            var afterDate = (info.afterDate) ? new Date(info.afterDate) : new Date(0);
            return $http.get('/api/chats/' + info.username + '/after/' +  afterDate.toISOString());
        },
        sendMessage: function(info) {
            return $http.post('/api/chats', info);
        },
        deleteChat: function(info) {
            return $http.delete('/api/chats/' + info.username);
        },
        setArchiveFlag: function(info) {
            return $http.post('/api/chats/toArchives', info);
        },
        getSignalingToken: function(roomID) {
            return $http.get('/api/chats/signalingToken/for/' + roomID);
        },
        webrtc: function(infos) {
            return $http.post('/api/chats/webrtc', infos);
        }
    }
});