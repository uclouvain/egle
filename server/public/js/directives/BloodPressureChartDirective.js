
angular.module('BloodPressureChartDirective', []).directive('bloodpressurechart', function(gettextCatalog, $ocLazyLoad, $injector, $rootScope, $window, $filter, $state, $log, ModalService) {
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
                $scope.unit = 'mm Hg';
                
                // Global configuration
                Highcharts.setOptions({global: {useUTC : false}});

                // Copy the basic configuration
                $scope.chart = JSON.parse(JSON.stringify($scope.$parent.aChart));
                
                // Define chart type
                $scope.chart.options.chart.type = 'line';
                
                $scope.chart.options.legend.enabled = true;
                                
                // Create a personalized tooltip
                $scope.chart.options.tooltip.formatter = function() {
                    return $filter('ddMMyyyy')(new Date(this.x).toISOString()) + '<br><span style="color:#6200ea;">●</span>  <b>' + this.y + '</b> ' + $scope.unit;
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
                

                $scope.chart.yAxis.plotBands = [{
                    color: '#ede7f6', 
                    from: 90, 
                    to: 140
                  },{
                    color: '#e0f7fa', 
                    from: 60,
                    to: 90
                  }];
                
                // Define Y axis
                $scope.chart.yAxis.plotLines = [{
                    color: '#6200ea',
                    value: 140,
                    dashStyle: 'dashdot', 
                    width: 1
                  },{
                      color: '#00BCD4',
                      value: 90, 
                      dashStyle: 'dashdot', 
                      width: 1
                   }];
                
                
                $scope.chart.yAxis.title.text = $scope.unit;
                $scope.chart.yAxis.min = 40; 
                $scope.chart.yAxis.max = 200; 
                
                $scope.chart.series = [{
	                name: 'Systolic',
	                data: [],
                    color: '#6200ea',
	                pointPlacement: 'on'
	            },{
	                name: 'Diastolic',
	                data: [],
                    color: '#00BCD4',
	                pointPlacement: 'on'
	            }];
                
                //Size
                if($window.innerWidth<535){
                    $scope.chart.size.height = 250;
                }

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
                        $ocLazyLoad.load('js/services/ChartService.js').then(function() {
                            var Chart = $injector.get('Chart');
                            Chart.build({
                                type: 'bloodpressure',
                                from: from,
                                to: new Date()
                            }).success(function(data) {
                            	
                                for(var i=0; i< data.series.length; i++){
                                    data.series[i].name = gettextCatalog.getString(data.series[i].name);
                                    for(var k = 0; k < data.series[i].data.length; ++k){
                                    	if(data.series[i].data[k][1] > $scope.chart.yAxis.max){
                                    		$scope.chart.yAxis.max = data.series[i].data[k][1];
                                    	}
                                    	if(data.series[i].data[k][1] < $scope.chart.yAxis.min){
                                    		$scope.chart.yAxis.min = data.series[i].data[k][1];
                                    	}
                                    }
                                }
                                //$scope.chart.xAxis.categories = data.categories;
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
                    else {
                        $scope.$parent.buildList({type: 'bloodpressure'}, function(data){
                                               
                            
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