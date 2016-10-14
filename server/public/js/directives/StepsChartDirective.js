
angular.module('StepsChartDirective', []).directive('stepschart', function(gettextCatalog, $ocLazyLoad, $injector, $rootScope, $window, $filter, $state, $log, ModalService) {
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
                $scope.unit = gettextCatalog.getString('Steps');
                
                // Global configuration
                Highcharts.setOptions({global: {useUTC : false}});

                // Copy the basic configuration
                $scope.chart = JSON.parse(JSON.stringify($scope.$parent.aChart));
                
                // Define chart type
                $scope.chart.options.chart.type = 'line';
                
                // Data
                $scope.chart.series[0] = {name: gettextCatalog.getString('Steps'), id: 'steps', color: '#827717'};
                
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
                $scope.chart.yAxis.max = 11000;
                
                //Size
                if($window.innerWidth<535){
                    $scope.chart.size.height = 250;
                }

                // Get objective
                $ocLazyLoad.load('js/services/ObjectiveService.js').then(function() {
                    var Objective = $injector.get('Objective');
                    Objective.read({type:'steps'}).success(function(data){
                        if (data) {
                            $scope.chart.yAxis.plotLines[0].value = data.values[0].value;
                            $scope.chart.yAxis.plotLines[0].label.text = $scope.chart.yAxis.plotLines[0].label.text + " (" + data.values[0].value + $scope.unit + ")";

                            $scope.chart.yAxis.min = 0; 
                            $scope.chart.yAxis.max = data.values[0].value * 1.5; 
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
                        case '1m':
                            $scope.view = '1m';
                            from = new Date(new Date().setDate(new Date().getDate() - 30));
                            
                        break;
                        case '3m':
                            $scope.view = '3m';
                            from = new Date(new Date().setDate(new Date().getDate() - 90));
                        break;
                        case '6m':
                            $scope.view = '6m';
                            from = new Date(new Date().setDate(new Date().getDate() - 180));                      
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
                        $scope.chart.xAxis.min = from.getTime();
                        $scope.$parent.buildChart($scope.chart, {from: from, to: new Date}, function(data){
                            $scope.chart.series[0].data = data;
                            
                            for(var i = 0; i < data.length; ++i){
                            	if(data[i] > $scope.chart.yAxis.max){
                            		$scope.chart.yAxis.max = data[i][1];
                            	}
                            }
                        });
                    } else {
                        $scope.$parent.buildList({type: 'steps'}, function(data){
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