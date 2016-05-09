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

angular.module('TodoDirective', []).directive('todo', function(gettextCatalog, $ocLazyLoad, $injector, $rootScope, $state) {
    return {
        restrict: 'A',
        templateUrl: 'templates/dashboard/cards/directives/todo.html',
        link: function($scope, $element, $attrs) {
            $ocLazyLoad.load('js/services/UIService.js').then(function() {
                var UI = $injector.get('UI');
                $scope.todoListOK = [];
                $scope.todoListNOK = [];
                
                // Go to the add entry page
                $scope.go = function(item){
                    if(!item.done && item.params){
                        $state.go("home.dashboard.add", {card: item.params.card, timeslot: item.params.timeslot});
                    }
                };
                
                // Skip this entry
                $scope.skip = function(item){
                    $scope.$parent.addEntry({datetimeAcquisition: new Date(new Date().setHours(item.params.timeslot.suggestion, 0, 0)), type: item.params.card, skipped: true}, function(){
                        $scope.$parent.buildDashboard();
                    });
                };
                
                // Build todo list
                UI.todo().success(function(data){
                    for(i=0; i< data.length; i++){
                        data[i].title = gettextCatalog.getString(data[i].title);
                        if(data[i].subitems){
                            for(j=0; j< data[i].subitems.length; j++){
                                data[i].subitems[j].title = gettextCatalog.getString(data[i].subitems[j].title);
                            }
                        }
                        if(data[i].counter <= 0){
                            $scope.todoListOK.push(data[i]);
                        } else {
                            $scope.todoListNOK.push(data[i]);
                        }
                    }
                }).error(function(status, data) {
                    $rootScope.rootAlerts.push({
                        type:'danger',
                        msg: gettextCatalog.getString('An error occurred, please try again later'),
                        priority: 2
                    });
                });
            });
        }
    }
});