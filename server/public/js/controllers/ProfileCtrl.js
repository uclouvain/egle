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

angular.module('ProfileCtrl', [[
    'bower_components/pickadate/lib/themes/classic.css',
    'bower_components/pickadate/lib/themes/classic.date.css',
    'bower_components/pickadate/lib/themes/classic.time.css'
]]).controller('ProfileController', function ($scope, gettextCatalog, $window, $location, $state, $ocLazyLoad, $injector, $filter, $rootScope) {
    $ocLazyLoad.load('js/services/UserService.js').then(function () {
        var User = $injector.get('User'), minDate = new Date('1900-01-01'), maxDate = new Date().setDate(new Date().getDate() - 1);
        
        // Check if input type 'date' is supported by the current browsers
        $scope.checkDateInput = function () {
            var input = document.createElement('input');
            input.setAttribute('type','date');
            var notADateValue = 'not-a-date';
            input.setAttribute('value', notADateValue); 
            return !(input.value === notADateValue);
        }
        
        $scope.numeric = /^\d+$/;
        $scope.gendersList = [
            {name: '', value: '0'},
            {name: gettextCatalog.getString('Male'), value: '1'},
            {name: gettextCatalog.getString('Female'), value: '2'}
        ];
        $scope.conditionsList = [
             {name:gettextCatalog.getString('Diabetes Type 1'), value:'d1', checked: false},
             {name:gettextCatalog.getString('Diabetes Type 2'), value:'d2', checked: false},
             {name:gettextCatalog.getString('Heart Failure'), value:'hf', checked: false}/*,
             {name:gettextCatalog.getString("Alzheimer's Disease"), value:'a', checked: false}*/
        ];
        $scope.colors = ['#bebebe','#E91E63','#9C27B0','#00BCD4','#CDDC39','#FFC107'];
        
        //Get user profile
        User.read().success(function (data) {
            if ($location.path().indexOf('basic') > -1) {
                // Parse birthdate of the user
                if (data.birthdate !== null) {
                    $scope.birthdate = new Date(data.birthdate);
                }
                // Parse gender
                if (data.gender === undefined) {
                    data.gender = '0';
                }
            } else if ($location.path().indexOf('avatar') > -1) {
                // Parse avatar
                if (data.preferences && data.preferences.avatar) {
                    $scope.color = data.preferences.avatar;
                } else {
                    $scope.color = $scope.colors[0];
                }
            } else {
                // Parse patient birthdate
                if (data.birthdate !== undefined) {
                    data.birthdate = $filter('dMMMM')(data.birthdate);
                } else {
                    data.birthdate = gettextCatalog.getString('unknown');
                }
            }
            // Select the right conditions
            if(data.condition){
            	var len = $scope.conditionsList.length;
                var conditions = []
                for(var i = 0; i < len; ++i){
                	if(data.condition.indexOf($scope.conditionsList[i].value) > -1){
                		$scope.conditionsList[i].checked = true;
                	} else{
                		$scope.conditionsList[i].checked = false;
                	}              		
                	
                }
            }
            // Add it to the scope
            $scope.profile = data;
            $scope.profile.conditions = $scope.conditionsList;
        }).error(function (status, data) {
            $rootScope.rootAlerts.push({
                type:'danger',
                msg: gettextCatalog.getString('An error occurred, please try again later'),
                priority: 2
            });
        });
        
        // Select a color
        $scope.selectColor = function (color) {
            $scope.color = color;
        };
        
        // Update the avatar
        $scope.updateAvatar = function () {
            User.update({
                avatar: $scope.color
            }).success(function (data) {
                // Go to main profile page and reload it
                $state.go("home.profile.main", {}, {reload: true});
            }).error(function (status, data) {
                $rootScope.rootAlerts.push({
                    type:'danger',
                    msg: gettextCatalog.getString('An error occurred, please try again later'),
                    priority: 2
                });
            });
        };

        // Update basic informations
        $scope.updateBasic = function () {
            // If birthdate is empty OR if birthdate is valid   
            if ($scope.birthdate === undefined || ($scope.birthdate > minDate && $scope.birthdate < maxDate)) {
                var birthdate = "";
                
                // If gender is empty
                if ($scope.profile.gender === 0) {
                    $scope.profile.gender = "";
                }
                
                // If birthdate is not empty, fix it and keep it
                if ($scope.birthdate !== undefined && $scope.birthdate !== null) {
                    birthdate = new Date($scope.birthdate).setHours(5);
                }
                
                // Conditions
                var len = $scope.profile.conditions.length;
                var conditions = []
                for(var i = 0; i < len; ++i){
                	if($scope.profile.conditions[i].checked){
                		conditions.push($scope.profile.conditions[i].value);
                	}
                }
                
                // Update
                User.update({
                    birthdate: birthdate,
                    gender: $scope.profile.gender,
                    condition: conditions
                }).success(function (data) {
                	if(data.activated)
                        $window.localStorage.token = data.token;
                    
                    // Go to main profile page and reload it
                    $state.go("home.profile.main", {}, {reload: true});
                }).error(function (status, data) {
                    $rootScope.rootAlerts.push({
                        type:'danger',
                        msg: gettextCatalog.getString('An error occurred, please try again later'),
                        priority: 2
                    });
                });
            } else {
                $rootScope.rootAlerts.push({
                    type:'warning',
                    msg: gettextCatalog.getString('Invalid birthdate'),
                    priority: 3
                });
            }
        };

        // Update contact informations
        function updateContact() {
            User.update({
                homeAddress: $scope.profile.homeAddress,
                phone: $scope.profile.phone,
                email: $scope.profile.email
            }).success(function (data) {
                // Go to main profile page and reload it
                $state.go("home.profile.main", {}, {reload: true});
            }).error(function (status, data) {
                $rootScope.rootAlerts.push({
                    type:'danger',
                    msg: gettextCatalog.getString('An error occurred, please try again later'),
                    priority: 2
                });
            });
        }
        
        $scope.updateContact = function (form) {
            if (form.phone.$valid) {
                updateContact();
            } else {
                $rootScope.rootAlerts.push({
                    type:'warning',
                    msg: gettextCatalog.getString('Please check the phone number'),
                    priority: 3
                });
            }
        };
    });
});


