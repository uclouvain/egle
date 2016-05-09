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

angular.module('WeightChartDirective', []).directive('weightchart', function(gettextCatalog, $ocLazyLoad, $injector, $rootScope, $window, $filter, $state, ModalService) {
    return {
        restrict: 'E',
        templateUrl: 'templates/dashboard/cards/directives/chart.html',
        scope: {
            title: '@',
            name: '@',
            objective: '@'
        },
        link: function($scope, $element, $attrs) {
            $ocLazyLoad.load('additional_components/highcharts-ng/dist/highcharts-ng.min.js').then(function () {
                $scope.fractionSize = 1;
                $scope.view = '';
                $scope.unit = 'kg';
                
                // Global configuration
                Highcharts.setOptions({global: {useUTC : false}});

                // Copy the basic configuration
                $scope.chart = JSON.parse(JSON.stringify($scope.$parent.aChart));
                
                // Define chart type
                $scope.chart.options.chart.type = 'line';
                
                // Data
                $scope.chart.series[0] = {name: gettextCatalog.getString('Weight'), id: 'weight', color: '#827717'};
                
                // Create a personalized tooltip
                $scope.chart.options.tooltip.formatter = function() {
                    return $filter('ddMMyyyy')(new Date(this.x).toISOString()) + '<br><span style="color:#827717;">●</span>  <b>' + this.y + '</b> ' + $scope.unit;
                }
                
                // Define X axis
                $scope.chart.xAxis.type = 'datetime';
                $scope.chart.xAxis.labels = {
                    overflow: 'justify'
                };
                $scope.chart.xAxis.dateTimeLabelFormats = {
                    month: '%e. %b',
                    year: '%b'
                };
                $scope.chart.xAxis.min = new Date(new Date().setDate(new Date().getDate() - 30)).getTime();
                $scope.chart.xAxis.max = (new Date).getTime();
                
                // Define Y axis
                $scope.chart.yAxis.plotLines[0].label.text = gettextCatalog.getString('obj.');
                $scope.chart.yAxis.title.text = $scope.unit;
                
                //Size
                if($window.innerWidth<535){
                    $scope.chart.size.height = 250;
                }

                // Get objective
                $ocLazyLoad.load('js/services/ObjectiveService.js').then(function() {
                    var Objective = $injector.get('Objective');
                    Objective.read({type:'weight'}).success(function(data){
                        if (data) {
                            $scope.chart.yAxis.plotLines[0].value = data.values[0].value;
                            $scope.chart.yAxis.plotLines[0].label.text = $scope.chart.yAxis.plotLines[0].label.text + " (" + data.values[0].value + $scope.unit + ")";
                        }
                    }).error(function(status, data) {
                        $rootScope.rootAlerts.push({
                            type:'danger',
                            msg: gettextCatalog.getString('An error occurred, please try again later'),
                            priority: 2
                        });
                    });
                });
                
                // Build the chart
                $scope.build = function(view) {
                    var from;
                    switch(view){
                        case '6m':
                            $scope.view = '6m';
                            from = new Date(new Date().setDate(new Date().getDate() - 180));
                            
                        break;
                        case '1y':
                            $scope.view = '1y';
                            from = new Date(new Date().setDate(new Date().getDate() - 360));
                        break;
                        case 'list':
                            $scope.view = 'list';                            
                        break;
                        default:
                            $scope.view = '';
                            from = new Date(new Date().setDate(new Date().getDate() - 90));
                        break;
                    }
                    
                    if(view !== 'list'){
                        $scope.chart.xAxis.min = from.getTime();
                        $scope.$parent.buildChart($scope.chart, {from: from, to: new Date}, function(data){
                            $scope.chart.series[0].data = data;
                        });
                    } else {
                        $scope.$parent.buildList({type: 'weight'}, function(data){
                            $scope.list = data;
                        });
                    }
                }
                
                // First build
                $scope.build();
            });
        }
    }
});