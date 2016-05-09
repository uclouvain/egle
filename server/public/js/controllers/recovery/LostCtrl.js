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

angular.module('LostCtrl', [[
    'css/templates/sign.css'
]]).controller('LostController', function($scope, gettextCatalog, $ocLazyLoad, $injector, $state) {
    $scope.alert = {};
    $scope.patEmail = /^[a-z]+[a-z0-9._]+@[a-z]+\.[a-z.]{2,5}$/;
    $scope.loading = false;
    
    $ocLazyLoad.load('bower_components/angular-recaptcha/release/angular-recaptcha.min.js').then(function() {
        var vcRecaptchaService = $injector.get('vcRecaptchaService');
        $scope.response = '';
        
        $ocLazyLoad.load('js/services/UserService.js').then(function() {
            var User = $injector.get('User');

            $scope.lost = function(form) {
                $scope.alert = {};
                if($scope.response !== ''){
                    if(!form.email.$error.pattern){
                        $scope.loading = true;
                        User.lostPassword({
                            captcha: $scope.response,
                            email: $scope.email
                        }).success(function(data) {
                            $scope.loading = false;
                            if(!data.captcha){
                                $scope.alert = { 
                                    type:'warning', 
                                    msg: gettextCatalog.getString('Captcha verification failed. Please retry later.')
                                };
                            } else {
                                if(!data.exists){
                                    $scope.alert = { 
                                        type:'warning', 
                                        msg: gettextCatalog.getString('No account found with that email address.')
                                    };
                                } else {
                                    $state.go("signin", {"isLost": true});
                                }
                            }
                        }).error(function(status, data) {
                            $scope.loading = false;
                            $scope.alert = { 
                                type:'danger', 
                                msg: gettextCatalog.getString('Internal Server Error')
                            };
                        });
                    }
                    else{
                        $scope.alert = { 
                            type:'warning', 
                            msg: gettextCatalog.getString('Please, fill out the form correctly.')
                        };
                    }
                }
                else{
                    $scope.alert = { 
                        type:'warning', 
                        msg: gettextCatalog.getString("Don't forget to mark the verification box.")
                    };
                }
            }
        });
    });
});
