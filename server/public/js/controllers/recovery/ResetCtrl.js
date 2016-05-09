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

angular.module('ResetCtrl', [[
    'css/templates/sign.css'
]]).controller('ResetController', function($scope, gettextCatalog, $ocLazyLoad, $injector, $stateParams, $state) {
    $scope.alert = {};

    $ocLazyLoad.load('js/services/UserService.js').then(function() {
        var User = $injector.get('User');

        $scope.reset = function(form) {
            $scope.alert = {};
            if(form.newPassword.$valid){
                User.resetPassword({
                    token: $stateParams.token,
                    newPassword: $scope.newPassword,
                    newPasswordConfirmation: $scope.newPasswordConfirmation
                }).success(function(data) {
                    if(!data.token){
                        $scope.newPassword = "";
                        $scope.newPasswordConfirmation = "";
                        $scope.alert = { 
                            type:'warning', 
                            msg: gettextCatalog.getString('The link you used to reset your password is invalid or has expired.')
                        };
                    }
                    else{
                        if(!data.changed){
                            $scope.newPassword = "";
                            $scope.newPasswordConfirmation = "";
                            $scope.alert = { 
                                type:'warning', 
                                msg: gettextCatalog.getString('Please, fill out the form correctly.')
                            };
                        } else {
                            $state.go("signin", {"isResetted": true, "email": data.email});
                        }
                    }
                }).error(function(status, data) {
                    $scope.newPassword = "";
                    $scope.newPasswordConfirmation = "";
                    $scope.alert = { 
                        type:'danger', 
                        msg: gettextCatalog.getString('Internal Server Error')
                    };
                });
            }
            else{
                $scope.newPassword = "";
                $scope.newPasswordConfirmation = "";
                $scope.alert = { 
                    type:'warning', 
                    msg: gettextCatalog.getString('Please, fill out the form correctly.')
                };
            }
        }
    });
});
