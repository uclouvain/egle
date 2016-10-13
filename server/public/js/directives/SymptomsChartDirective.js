
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
                //$scope.unit = gettextCatalog.getString('Degree');
                
                // Global configuration
                Highcharts.setOptions({global: {useUTC : false}});

                // Copy the basic configuration
                $scope.chart = JSON.parse(JSON.stringify($scope.$parent.aChart));
                
                // Define chart type
                $scope.chart.options.chart.type = 'line';
                $scope.chart.options.chart.polar = true;                

                // Create a personalized tooltip
                $scope.chart.options.tooltip.enabled = false;
                
                $scope.chart.options.legend.enabled = true;
                $scope.chart.options.legend.reversed = true;
                
                //Define X axis
                $scope.chart.xAxis = {
                	categories: [ gettextCatalog.getString('Dyspnea'), gettextCatalog.getString('Sleep')
                         		, gettextCatalog.getString('Swellings'), gettextCatalog.getString('Palpitations')
                        		, gettextCatalog.getString('Dizziness'), gettextCatalog.getString('Fatigue')
                        		],
                     tickmarkPlacement: 'on',
                     lineWidth: 0
                 };
                
                //Define Y axis
                $scope.chart.yAxis = {
                    gridLineInterpolation: 'polygon',
                    lineWidth: 0,
                    min: 0,
                    max: 2,
                    plotLines: [{
                        color: '#cfd8dc', // Color value
                        value: 1, // Value of where the line will appear
                        width: 1 // Width of the line    
                      }]
                };
                
                //Size
                $scope.chart.size.height = 220;                

                // Build the chart
                $scope.build = function(view) {
                    switch(view){
                        case 'list':
                            $scope.view = 'list';                            
                        break;                        
                        default:
                            $scope.view = '';
                        break;
                    }
                    
                    if(view !== 'list'){
                        $ocLazyLoad.load('js/services/ChartService.js').then(function() {
                            var Chart = $injector.get('Chart');
                            Chart.build({
                                type: 'symptoms',
                                from: null,
                                to: new Date
                            }).success(function(data) {
                            	
                                for(var i=0; i< data.categories.length; i++){
                                    data.categories[i] = gettextCatalog.getString(data.categories[i]);
                                }
                                for(var i=0; i< data.series.length; i++){
                                    data.series[i].name = gettextCatalog.getString(data.series[i].name);
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
                        $scope.$parent.buildList({type: 'symptoms'}, function(data){
                            console.log(data);                           
                            
                            for(var i = 0; i < data.length; ++i){
                            	data[i].buttons = [];
                            	for(var k = 0; k < data[i].values.length; ++k)
                            		if(data[i].values[k].value == 0){
                            			data[i].buttons.push({
                                            title: gettextCatalog.getString('Good'),
                                            img: {'background': 'url(./img/good.png) no-repeat center center', 'background-size': 'cover', 'opacity' : '1.0'},                                            
                                        });
                            		}else if(data[i].values[k].value == 1){
                            			data[i].buttons.push({
                                            title: gettextCatalog.getString('NotWell'),
                                            img: {'background': 'url(./img/notWell.png) no-repeat center center', 'background-size': 'cover', 'opacity' : '1.0'},                                            
                                        });                            			
                            		}else{
                            			data[i].buttons.push({
                                            title: gettextCatalog.getString('Bad'),
                                            img: {'background': 'url(./img/bad.png) no-repeat center center', 'background-size': 'cover', 'opacity' : '1.0'},                                            
                                        }); 
                            		}                            	
                            }
                            
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