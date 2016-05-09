/*
 * The copyright in this software is being made available under MIT License 
 * MIT License, included below. This software may be subject to other third 
 * party and contributor rights, including patent rights, and no such rights
 * are granted under this license.
 *
 * Copyright (c) 2014-2016, Universite catholique de Louvain (UCL), Belgium
 * Copyright (c) 2014-2016, Professor Benoit Macq
 * Copyright (c) 2014-2016, Benoît Dereck-Tricot
 * All rights reserved.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

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