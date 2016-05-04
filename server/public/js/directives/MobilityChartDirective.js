angular.module('MobilityChartDirective', []).directive('mobilitychart', function(gettextCatalog, $ocLazyLoad, $injector, $rootScope, ModalService) {
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
                $scope.view = '';
                
                // Global configuration
                Highcharts.setOptions({global: {useUTC : false}});

                // Copy the basic configuration
                $scope.chart = JSON.parse(JSON.stringify($scope.$parent.aChart));

                // Define chart type
                $scope.chart.options.chart.type = 'bar';
                
                // Data
                $scope.chart.series[0] = {name: gettextCatalog.getString('Mobility'), id: 'mobility', color: '#F06292'};
                
                // Disable the tooltip
                $scope.chart.options.tooltip.enabled = false;
                
                // Define X axis
                $scope.chart.xAxis.type = 'category';
                
                // Define Y axis
                $scope.chart.yAxis.title.text = gettextCatalog.getString('Duration');
                
                //Size
                $scope.chart.size.height = 180;

                // Build the chart
                $scope.build = function(view) {
                    var from;
                    switch(view){
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
                        $scope.$parent.buildChart($scope.chart, {from: from, to: new Date}, function(data){
                            for(var i=0; i< data.length; i++){
                                data[i][0] = gettextCatalog.getString(data[i][0]);
                            }
                            $scope.chart.series[0].data = data;
                        });
                    } else {
                        $scope.$parent.buildList({type: 'mobility'}, function(data){
                            for(i=0; i< data.length; i++){
                                data[i].icons = [];
                                for(j=0; j< data[i].values.length; j++){
                                    if(data[i].values[j].type === 'motor'){
                                        data[i].icons.push({
                                            i: 'mdi-maps-directions-car'
                                        });
                                    }
                                    if(data[i].values[j].type === 'public'){
                                        data[i].icons.push({
                                            i: 'mdi-maps-directions-subway'
                                        });
                                    }
                                    if(data[i].values[j].type === 'bike'){
                                        data[i].icons.push({
                                            i: 'mdi-maps-directions-bike'
                                        });
                                    }
                                    if(data[i].values[j].type === 'walk'){
                                        data[i].icons.push({
                                            i: 'mdi-maps-directions-walk'
                                        });
                                    }
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