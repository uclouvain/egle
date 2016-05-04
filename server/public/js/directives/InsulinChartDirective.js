angular.module('InsulinChartDirective', []).directive('insulinchart', function(gettextCatalog, $ocLazyLoad, $injector, $rootScope, $window, $state, ModalService) {
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
                $scope.moments = [];
                $scope.moment = 'morning';
                $scope.view = '';
                $scope.unit = gettextCatalog.getString('Unit(s)');
                var weekDays = new Array(gettextCatalog.getString("Sunday"), 
                                gettextCatalog.getString("Monday"), 
                                gettextCatalog.getString("Tuesday"), 
                                gettextCatalog.getString("Wednesday"), 
                                gettextCatalog.getString("Thursday"), 
                                gettextCatalog.getString("Friday"), 
                                gettextCatalog.getString("Saturday"));

                // Fill moments
                $ocLazyLoad.load('js/services/UIService.js').then(function() {
                    var UI = $injector.get('UI');
                    UI.settings().success(function(data) {
                        for(i=0; i<data.items.length; i++){
                            if(data.items[i].name == 'insulin'){
                                for(j=0; j<data.items[i].subitems.length; j++){
                                    if(data.items[i].subitems[j].enabled){
                                       $scope.moments.push({
                                            name: gettextCatalog.getString(data.items[i].subitems[j].title),
                                            value: data.items[i].subitems[j].name
                                        }); 
                                    }
                                }
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

                // Global configuration
                Highcharts.setOptions({global: {useUTC : false}});

                // Copy the basic configuration
                $scope.chart = JSON.parse(JSON.stringify($scope.$parent.aChart));

                // Define chart type
                $scope.chart.options.chart.type = 'bar';
                
                // Create a personalized tooltip
                $scope.chart.options.tooltip.enabled = false;
                
                // Define X axis
                $scope.chart.xAxis.categories = [];
                
                // Define Y axis
                $scope.chart.yAxis.title.text = $scope.unit;
                $scope.chart.yAxis.stackLabels.enabled = true;
                $scope.chart.yAxis.stackLabels.formatter = function () {
                    var toReturn = '';
                    if($scope.chart.xAxis.glycaemias[this.x] > 0){
                        toReturn = $scope.chart.xAxis.glycaemias[this.x] + "mg/dl";
                    }
                    return toReturn;
                };
                
                // Size
                $scope.chart.size.height = 300;
                
                // Design options
                $scope.chart.options.plotOptions.series.stacking = 'normal';
                $scope.chart.options.legend.enabled = true;
                $scope.chart.options.legend.reversed = true;

                //Build the chart
                $scope.build = function(view) {
                    $scope.view = view;
                    if(view !== 'list'){
                        $ocLazyLoad.load('js/services/ChartService.js').then(function() {
                            var Chart = $injector.get('Chart');
                            Chart.build({
                                type: $scope.moment,
                                from: new Date(new Date().setDate(new Date().getDate() - 6)),
                                to: new Date
                            }).success(function(data) {
                                for(var i=0; i< data.categories.length; i++){
                                    data.categories[i] = weekDays[data.categories[i]];
                                }
                                data.categories[0] = gettextCatalog.getString("Today");
                                for(var i=0; i< data.series.length; i++){
                                    data.series[i].name = gettextCatalog.getString(data.series[i].title);
                                }
                                $scope.chart.xAxis.categories = data.categories;
                                $scope.chart.xAxis.glycaemias = data.glycaemias;
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
                        $scope.$parent.buildList({type: 'insulin'}, function(data){
                            $scope.list = data;
                        });
                    }
                }
                
                // First build
                $scope.build('');
            });
        }
    }
});