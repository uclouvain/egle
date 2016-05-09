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

angular.module('AskWeightDirective', []).directive('askweight', function(gettextCatalog, $ocLazyLoad, $injector, $rootScope) {
    return {
        restrict: 'A',
        templateUrl: 'templates/dashboard/asks/directives/ask_weight.html',
        link: function($scope, $element, $attrs) {
            $ocLazyLoad.load('js/services/ObjectiveService.js').then(function() {
                var Objective = $injector.get('Objective');
                $scope.weight = undefined;
                $scope.objective = undefined;

                Objective.read({type:'weight'}).success(function(data){
                    if (data) {
                        $scope.objective = data.values[0].value;
                    }
                }).error(function(status, data) {
                    $rootScope.rootAlerts.push({
                        type:'danger',
                        msg: gettextCatalog.getString('An error occurred, please try again later'),
                        priority: 2
                    });
                });

                //Answer
                $scope.answer = function(){
                    $scope.$parent.addEntry({type: 'weight', value: $scope.weight}, function(){
                        if($scope.objective > 0){
                            Objective.createOrUpdate({
                                objective: {
                                    type : 'weight',
                                    values : {value: $scope.objective}
                                }
                            }).success(function(data){
                                $scope.$parent.buildDashboard();
                            }).error(function(status, data) {
                                $rootScope.rootAlerts.push({
                                    type:'danger',
                                    msg: gettextCatalog.getString('An error occurred, please try again later'),
                                    priority: 2
                                });
                            });
                        } else {
                            $rootScope.rootAlerts.push({
                                type:'info',
                                msg: gettextCatalog.getString('Target value must be greater than 1'),
                                priority: 4
                            });
                        }
                    });
                }
            });
        }
    }
});