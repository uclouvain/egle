angular.module('SportChartDirective', []).directive('sportchart', function(gettextCatalog, $ocLazyLoad, $injector, $rootScope, $window, ModalService) {
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
                $scope.unit = gettextCatalog.getString('hours');

                var months = new Array(gettextCatalog.getString("January"),
                                  gettextCatalog.getString("February"),
                                  gettextCatalog.getString("March"), 
                                  gettextCatalog.getString("April"), 
                                  gettextCatalog.getString("May"), 
                                  gettextCatalog.getString("June"), 
                                  gettextCatalog.getString("July"), 
                                  gettextCatalog.getString("August"), 
                                  gettextCatalog.getString("September"), 
                                  gettextCatalog.getString("October"), 
                                  gettextCatalog.getString("November"), 
                                  gettextCatalog.getString("December"));
                
                // Global configuration
                Highcharts.setOptions({global: {useUTC : false}});

                // Copy the basic configuration
                $scope.chart = JSON.parse(JSON.stringify($scope.$parent.aChart));
                
                // Define chart type
                $scope.chart.options.chart.type = 'column';
                
                // Disable tooltip
                $scope.chart.options.tooltip.enabled = false;
                
                //Define X axis
                $scope.chart.xAxis.categories = [];
                
                //Define Y axis
                $scope.chart.yAxis.plotLines[0].label.text = gettextCatalog.getString('obj.');
                
                //Size
                if($window.innerWidth < 535){
                    $scope.chart.size.height = 250;
                }
                
                // Design options
                $scope.chart.options.plotOptions.series.stacking = 'normal';

                // Get objective
                $ocLazyLoad.load('js/services/ObjectiveService.js').then(function() {
                    var Objective = $injector.get('Objective');
                    Objective.read({type: 'sport'}).success(function(data){
                        if (data) {
                            $scope.chart.yAxis.plotLines[0].value = data.values[0].value;
                            $scope.chart.yAxis.plotLines[0].label.text = $scope.chart.yAxis.plotLines[0].label.text + " ("+ data.values[0].value + gettextCatalog.getString('h/week') + ")";
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
                        case '3m':
                            $scope.view = '3m';
                            $scope.chart.xAxis.title.text = gettextCatalog.getString('months');
                            $scope.chart.yAxis.title.text = gettextCatalog.getString('hours per week');
                            from = new Date(new Date().setDate(new Date().getDate() - 90));
                        break;
                        case '6m':
                            $scope.view = '6m';
                            $scope.chart.xAxis.title.text = gettextCatalog.getString('months');
                            $scope.chart.yAxis.title.text = gettextCatalog.getString('hours per week');
                            from = new Date(new Date().setDate(new Date().getDate() - 180));
                        break;
                        case 'list':
                            $scope.view = 'list';                            
                        break;
                        default:
                            $scope.view = '';
                            $scope.chart.xAxis.title.text = gettextCatalog.getString('weeks');
                            $scope.chart.yAxis.title.text = gettextCatalog.getString('hours');
                            from = new Date(new Date().setDate(new Date().getDate() - 30));
                        break;
                    }
                    
                    if(view !== 'list'){
                        $ocLazyLoad.load('js/services/ChartService.js').then(function() {
                            var Chart = $injector.get('Chart');
                            Chart.build({
                                type: 'sport',
                                from: from,
                                to: new Date
                            }).success(function(data) {
                                for(var i=0; i< data.categories.length; i++){
                                    if(view === '3m' || view === '6m'){
                                        data.categories[i] = months[data.categories[i]-1];
                                    } else {
                                        data.categories[i] = data.categories[i].substr(0, data.categories[i].indexOf('/')) + ' ' + months[data.categories[i].substr(data.categories[i].indexOf('/')+1, data.categories[i].length)-1].substr(0, 3);

                                    }
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
                        $scope.$parent.buildList({type: 'activity', subType: 'sport'}, function(data){
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