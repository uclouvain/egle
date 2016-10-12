
angular.module('SymptomsChartDirective', []).directive('symptomschart', function(gettextCatalog, $ocLazyLoad, $injector, $rootScope, $window, $filter, $state, ModalService) {
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
                $scope.unit = gettextCatalog.getString('Degree');
                
                // Global configuration
                Highcharts.setOptions({global: {useUTC : false}});

                // Copy the basic configuration
                $scope.chart = JSON.parse(JSON.stringify($scope.$parent.aChart));
                
                // Define chart type
                //$scope.chart.options.chart.type = 'line';
                $scope.chart.options.chart.polar = true;                

                // Create a personalized tooltip
                $scope.chart.options.tooltip.enabled = false;
                
                //Define X axis
                $scope.chart.xAxis = {
                	categories: [gettextCatalog.getString('Dyspnea'), 
                	             gettextCatalog.getString('Fatigue'), 
                	             gettextCatalog.getString('Swellings'), 
                	             gettextCatalog.getString('Abdominal Pain'),
                	             /*gettextCatalog.getString('Weight')*/
                                ],
                     tickmarkPlacement: 'on',
                     lineWidth: 0
                 };
                
                //Define Y axis
                $scope.chart.yAxis = {
                    gridLineInterpolation: 'polygon',
                    lineWidth: 0,
                    min: 0,
                    max: 100
                };
                
                //Size
                $scope.chart.size.height = 220;                

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
                        /*
                        case 'list':
                            $scope.view = 'list';                            
                        break;
                        */
                        default:
                            $scope.view = '';
                            from = new Date(new Date().setDate(new Date().getDate() - 30));
                        break;
                    }
                    
                    if(view !== 'list'){
                        $ocLazyLoad.load('js/services/ChartService.js').then(function() {
                            var Chart = $injector.get('Chart');
                            Chart.build({
                                type: 'symptoms',
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
                    } 
                    /*else {
                        $scope.$parent.buildList({type: 'meal'}, function(data){
                            console.log(data);
                            $scope.list = data;
                        });
                    }*/
                }
                
                // First build
                $scope.build();
            });
        }
    }
});