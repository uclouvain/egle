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

angular.module('SearchPatientsDirective', []).directive('searchpatients', function(gettextCatalog, $ocLazyLoad, $injector, $rootScope) {
    return {
        restrict: 'A',
        templateUrl: 'templates/dashboard/cards/directives/search_patients.html',
        link: function($scope, $element, $attrs) {
            var trick = gettextCatalog.getString('Enter the username of the patient');
            $scope.helper = "";
            $scope.searchText = '';
            $scope.patients = [];

            $scope.in = function () {
                if($scope.searchText.length == 0){
                    $scope.helper = trick;
                }
            }

            $scope.out = function () {
                $scope.helper = "";
            }

            // Search for a patient
            $scope.search = function () {
                $ocLazyLoad.load('js/services/ContactService.js').then(function() {
                var Contact = $injector.get('Contact');
                    if($scope.searchText.length >= 1){
                        $scope.helper = "";
                        Contact.searchAccepted({
                            name: $scope.searchText.toLowerCase().replace(/[^a-zA-Z- àèìòùÀÈÌÒÙáéíóúýÁÉÍÓÚÝâêîôûÂÊÎÔÛãñõÃÑÕäëïöüÿÄËÏÖÜŸçÇßØøÅåÆæœ]+/g, "")
                        }).success(function(users){
                            if (users.length > 0) {
                                $scope.patients = users;
                            } else {
                                $scope.helper = "";
                                $scope.helper = gettextCatalog.getString("No results for") + " \"" + $scope.searchText + "\"";
                                $scope.patients = [];
                            }
                        }).error(function(status, data){
                            $rootScope.rootAlerts.push({
                                type:'danger',
                                msg: gettextCatalog.getString('An error occurred, please try again later'),
                                priority: 2
                            });
                        });
                    }
                    else{
                        $scope.helper = "";
                        $scope.patients = [];
                    }
                });
            };
        }
    }
});