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

angular.module('SigninCtrl', [[
    'css/templates/sign.css'
]]).controller('SigninController', function($scope, $state, $window, gettextCatalog, $ocLazyLoad, $injector, $stateParams, ModalService) {    
    $ocLazyLoad.load('js/services/UserService.js').then(function() {
        var User = $injector.get('User');
        
        $scope.rememberme = true;
        $scope.rememberLabel = gettextCatalog.getString('Stay signed in');
        $scope.alert = {};

        // If the user came from SignUp page
        if($stateParams.isNew){
            ModalService.showModal({
                templateUrl: "templates/modals/signActivation.html",
                controller: function($scope, close){
                    $scope.close = function(result) {
                        close(result, 500); // close, but give 500ms for bootstrap to animate
                    };
                }
            }).then(function(modal) {
                modal.element.modal();
                modal.close.then(function(result) {
                    $stateParams.isNew = null;
                });
            });
        }
        
        // If the user came from reset password page
        if($stateParams.isResetted && $stateParams.email){
            ModalService.showModal({
                templateUrl: "templates/modals/signReset.html",
                controller: function($scope, close){
                    $scope.close = function(result) {
                        close(result, 500); // close, but give 500ms for bootstrap to animate
                    };
                }
            }).then(function(modal) {
                modal.element.modal();
                modal.close.then(function(result) {
                    $scope.email = $stateParams.email;
                    $('#password').focus();
                    $stateParams.isResetted = null;
                    $stateParams.email = null;
                });
            });
        }
        
        // If the user came from lost password page
        if($stateParams.isLost){
            ModalService.showModal({
                templateUrl: "templates/modals/signSent.html",
                controller: function($scope, close){
                    $scope.close = function(result) {
                        close(result, 500); // close, but give 500ms for bootstrap to animate
                    };
                }
            }).then(function(modal) {
                modal.element.modal();
                modal.close.then(function(result) {
                    $stateParams.isLost = null;
                });
            });
        }

        // If a token exists, redirect to dashboard
        if($window.localStorage.token){
            $state.transitionTo('home.dashboard.main');
        }
        
        // If a token is available in URL
        if($stateParams.token){
            User.activation({
                token: $stateParams.token
            }).success(function(data) {
                if(data.activated){
                    $scope.email = data.email;
                    $('#password').focus();
                    $scope.alert = {
                        type:'success', 
                        msg: gettextCatalog.getString('Your account has been activated! You can now sign in.')
                    };
                } else {
                    $scope.alert = {
                        type:'danger', 
                        msg: gettextCatalog.getString('The link you used to activate your account is invalid.')
                    };
                }
            }).error(function(status, data) {
                $scope.alert = {
                    type:'danger', 
                    msg: gettextCatalog.getString('Internal Server Error')
                };
            });
        }

        // Sign in
        $scope.signin = function signin() {
            $scope.alert = {};
            if ($scope.email !== undefined && $scope.password !== undefined) {
                User.signin({
                    email: $scope.email,
                    password: $scope.password,
                    rememberme: $scope.rememberme
                }).success(function(data) {
                    if(data.activated){
                        $window.localStorage.language = data.language;
                        $window.localStorage.token = data.token;
                        $state.transitionTo('home.dashboard.main');
                    } else {
                        $scope.alert = {
                            type:'warning', 
                            msg: gettextCatalog.getString('You need to activate your account.')
                        };
                    }
                }).error(function(status, data) {
                    $scope.password = "";
                    if(data === 401){
                        $scope.alert = {
                            type:'danger', 
                            msg: gettextCatalog.getString('The email or password you entered is incorrect')
                        };
                    } else {
                        $scope.alert = {
                            type:'danger', 
                            msg: status
                        };
                    }
                });
            } else {
                $scope.alert = {
                    type:'danger', 
                    msg: gettextCatalog.getString('The email or password is empty')
                };
            }
        }
    });
});
