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

angular.module('UserService', []).factory('User', function($http) {
    return {
        signin: function(user) {
            return $http.post('/api/users/signin', user);
        },
        
        lostPassword: function(user) {
            return $http.post('/api/users/lostPassword', user);
        },
        
        resetPassword: function(user) {
            return $http.post('/api/users/resetPassword', user);
        },
 
        signout: function() {
            return $http.get('/api/users/signout');
        },

        signup: function(user) {
            return $http.post('/api/users/signup', user);
        },
        
        activation: function(user) {
            return $http.post('/api/users/activation', user);
        },

        changePassword: function(user) {
            return $http.post('/api/users/changePassword', user);
        },
        
        read: function() {
            return $http.get('/api/users/profile');
        },
        
        update: function(user) {
            return $http.put('/api/users', user);
        }
    }
});