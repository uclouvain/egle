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

angular.module('MealChartDirective', []).directive('mealchart', function(gettextCatalog, $ocLazyLoad, $injector, $rootScope, ModalService) {
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
                $scope.fractionSize = 0;
                $scope.view = '';
                $scope.meal = true;

                // Global configuration
                Highcharts.setOptions({global: {useUTC : false}});

                // Copy the basic configuration
                $scope.chart = JSON.parse(JSON.stringify($scope.$parent.aChart));

                // Define chart type
                $scope.chart.options.chart.type = 'bar';
                
                // Create a personalized tooltip
                $scope.chart.options.tooltip.enabled = false;
                
                //Define X axis
                $scope.chart.xAxis.categories = [];
                
                //Define Y axis
                $scope.chart.yAxis.title.text = gettextCatalog.getString('Score');
                $scope.chart.yAxis.plotLines[0].label.text = gettextCatalog.getString('obj.');
                $scope.chart.yAxis.min = 0;
                $scope.chart.yAxis.max = 20;
                
                //Size
                $scope.chart.size.height = 220;
                
                // Design options
                $scope.chart.options.plotOptions.series.stacking = 'normal';
                $scope.chart.options.legend.enabled = true;
                $scope.chart.options.legend.reversed = true;

                // Build the chart
                $scope.build = function(view) {
                    switch(view){
                        case '2m':
                            $scope.view = '2m';
                            from = new Date(new Date().setDate(new Date().getDate() - 60));
                        break;
                        case '3m':
                            $scope.view = '3m';
                            from = new Date(new Date().setDate(new Date().getDate() - 90));
                        break;
                        case 'list':
                            $scope.view = 'list';                            
                        break;
                        default:
                            $scope.view = '';
                            from = new Date(new Date().setDate(new Date().getDate() - 30));
                        break;
                    }
                    
                    if(view !== 'list'){
                        $ocLazyLoad.load('js/services/ChartService.js').then(function() {
                            var Chart = $injector.get('Chart');
                            Chart.build({
                                type: 'meal',
                                from: from,
                                to: new Date
                            }).success(function(data) {
                                for(var i=0; i< data.categories.length; i++){
                                    data.categories[i] = gettextCatalog.getString(data.categories[i]);
                                }
                                for(var i=0; i< data.series.length; i++){
                                    data.series[i].name = gettextCatalog.getString(data.series[i].name);
                                }
                                $scope.chart.xAxis.categories = data.categories;
                                $scope.chart.series = data.series;
                            }).error(function(status, data) {
                                $rootScope.rootAlerts.push({
                                    type:'danger',
                                    msg: gettextCatalog.getString('An error occurred, please try again later'),
                                    priority: 2
                                });
                            });
                        });
                    } else {
                        $scope.$parent.buildList({type: 'meal'}, function(data){
                            console.log(data);
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