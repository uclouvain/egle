/*
 * The copyright in this software is being made available under MIT License 
 * MIT License, included below. This software may be subject to other third 
 * party and contributor rights, including patent rights, and no such rights
 * are granted under this license.
 *
 * Copyright (c) 2014-2016, Universite catholique de Louvain (UCL), Belgium
 * Copyright (c) 2014-2016, Professor Benoit Macq
 * Copyright (c) 2014-2016, Aissa Ghouti
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

angular.module('ContactService', []).factory('Contact', function($http) {
    return {
        accepted: function() {
            return $http.get('/api/contacts/relationships/accepted');
        },
        sent: function() {
            return $http.get('/api/contacts/relationships/sent');
        },
        received: function() {
            return $http.get('/api/contacts/relationships/received');
        },
        search: function(info) {
            return $http.get('/api/contacts/search/' + info.name);
        },
        searchAccepted: function(info) {
            return $http.get('/api/contacts/search/' + info.name + '/relationships/accepted');
        },
        read: function(info) {
            return $http.get('/api/contacts/read/' + info.username);
        },
        readLight: function(info) {
            return $http.get('/api/contacts/read/' + info.username + '/light');
        },
        update: function(info) {
            return $http.put('/api/contacts/', info);
        },
        delete: function(info) {
            return $http.delete('/api/contacts/' + info.username);
        },
        frequent: function() {
            return $http.get('/api/contacts/frequent');
        }
    }
});