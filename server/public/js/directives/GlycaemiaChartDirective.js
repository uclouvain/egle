angular.module('GlycaemiaChartDirective', []).directive('glycaemiachart', function(gettextCatalog, $ocLazyLoad, $injector, $rootScope, $window, $filter, ModalService) {
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
                $scope.unit = 'mg/dl';
                
                // Global configuration
                Highcharts.setOptions({global: {useUTC : false}});

                // Copy the basic configuration
                $scope.chart = JSON.parse(JSON.stringify($scope.$parent.aChart));

                // Define chart type
                $scope.chart.options.chart.type = 'scatter';
                
                // Create a personalized tooltip
                $scope.chart.options.tooltip.formatter = function() {
                    var origdate = $filter('smartDatetime')(this.point.origdate);
                    var time = $filter('HHmm')(new Date(this.x).toISOString());
                    return time + ' (' + origdate + ')<br><span style="color:#D32F2F;">●</span>  <b>' + this.y + '</b> ' + $scope.unit;
                }
                
                // Define X axis
                $scope.chart.xAxis.type = 'datetime';
                $scope.chart.xAxis.labels = {
                    formatter: function () {
                        return Highcharts.dateFormat('%H', this.value);
                    },
                    overflow: 'justify'
                };
                $scope.chart.xAxis.tickInterval = 3600 * 1000;
                
                // Define Y axis
                $scope.chart.yAxis.title.text = $scope.unit;
                // Objective lines
                $scope.chart.yAxis.plotLines[0].label.text = 'max';
                $scope.chart.yAxis.plotLines.push({
                    value: 0,
                    color: '#000',
                    dashStyle: 'Dash',
                    width: 1,
                    zIndex :99,
                    label: {
                        x: 0
                    }
                });
                $scope.chart.yAxis.plotLines[1].label.text = 'min';
                // Mean line
                $scope.chart.yAxis.plotLines.push({
                    value: 0,
                    color: '#D32F2F',
                    dashStyle: 'Dash',
                    width: 1,
                    zIndex :99,
                    label: {
                        x: 0,
                        style: {color:'#D32F2F'}
                    }
                });
                
                //Size
                if($window.innerWidth < 535){
                    $scope.chart.size.height = 250;
                }

                // Get objectives
                $ocLazyLoad.load('js/services/ObjectiveService.js').then(function() {
                    var Objective = $injector.get('Objective');
                    Objective.read({type:'glycaemia'}).success(function(data){
                        if (data) {
                            if(data.values[0].type == 'max'){
                                $scope.chart.yAxis.plotLines[0].value = data.values[0].value;
                                $scope.chart.yAxis.plotLines[0].label.text = $scope.chart.yAxis.plotLines[0].label.text + " (" + $filter('number')(data.values[0].value, 1) + $scope.unit + ")";
                                $scope.chart.yAxis.plotLines[1].value = data.values[1].value;
                                $scope.chart.yAxis.plotLines[1].label.text = $scope.chart.yAxis.plotLines[1].label.text + " (" + $filter('number')(data.values[1].value, 1) + $scope.unit + ")";
                            } else {
                                $scope.chart.yAxis.plotLines[1].value = data.values[0].value;
                                $scope.chart.yAxis.plotLines[1].label.text = $scope.chart.yAxis.plotLines[1].label.text + " (" + $filter('number')(data.values[0].value, 1) + $scope.unit + ")";
                                $scope.chart.yAxis.plotLines[0].value = data.values[1].value;
                                $scope.chart.yAxis.plotLines[0].label.text = $scope.chart.yAxis.plotLines[0].label.text + " (" + $filter('number')(data.values[1].value, 1) + $scope.unit + ")";
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

                // Build the chart
                $scope.build = function(view) {
                    var from;
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
                                type: 'glycaemia',
                                from: from,
                                to: new Date
                            }).success(function(data) {
                                $scope.chart.yAxis.plotLines[2].value = data.mean;
                                $scope.chart.yAxis.plotLines[2].label.text = gettextCatalog.getString('mean');
                                $scope.chart.yAxis.plotLines[2].label.text = $scope.chart.yAxis.plotLines[2].label.text + " (" + $filter('number')(data.mean, 1) + $scope.unit + ")";
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
                        $scope.$parent.buildList({type: 'glycaemia'}, function(data){
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