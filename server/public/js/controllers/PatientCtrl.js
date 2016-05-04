angular.module('PatientCtrl', [[
    'bower_components/highcharts-release/highcharts.js',
    'css/templates/dashboard.css'
]]).controller('PatientController', function ($scope, $state, $stateParams, gettextCatalog, $ocLazyLoad, $injector, $filter, $rootScope) {
    
    // Patient username
    $scope.username = $stateParams.username;
    
    if ($scope.username !== "") {
        $ocLazyLoad.load('js/services/PatientService.js').then(function () {
            var Patient = $injector.get('Patient');
            $ocLazyLoad.load('js/services/ContactService.js').then(function () {
                var Contact = $injector.get('Contact');
                
                // Read the profile of the patient
                Contact.read({
                    username: $scope.username
                }).success(function (data) {
                    $scope.cards = ['profile', 'medicalRecord'];
                    
                    // Add glycaemia chart if patient condition is diabetes 
                    if(data.condition === 'd1' || data.condition === 'd2'){
                        $scope.cards.push('chart_glycaemia');
                    }
                    
                    // Parse birth date of patient
                    if (data.birthdate !== undefined) {
                        data.birthdate = $filter('ddMMyyyy')(data.birthdate);
                    } else {
                        data.birthdate = gettextCatalog.getString('unknown');
                    }
                    
                    // Add it to the scope
                    $scope.profile = data;
                }).error(function (status, data) {
                    $rootScope.rootAlerts.push({
                        type:'danger',
                        msg: gettextCatalog.getString('An error occurred, please try again later'),
                        priority: 2
                    });
                });
            });
        });
    } else {
        $state.go("home.dashboard.main");
    }
}).controller('CardPatientChartGlycaemiaController', function ($scope, gettextCatalog, $ocLazyLoad, $injector, $filter, $window, $rootScope) {
    $ocLazyLoad.load('additional_components/highcharts-ng/dist/highcharts-ng.min.js').then(function () {
        
        $scope.view = '';
        $scope.unit = 'mg/dl';
        
        // Create a basic Highcharts configuration
        var aChart = {
            options: {
                chart: {},
                tooltip: {
                    enabled:true
                },
                legend: {
                    enabled: false
                },
                plotOptions: {
                    series: {
                        stacking: '',
                        dataLabels: {
                            enabled: false
                        }
                    }
                }, 
            },
            series: [
                {data: []}
            ],
            title: {
                text: ''
            },
            xAxis: {
                labels: {},
                title: {
                    text:''
                }
            },
            yAxis: {
                plotLines: [{
                    color: '#000',
                    dashStyle: 'Dash',
                    width: 1,
                    zIndex : 99,
                    label: {
                        x: 0
                    }
                }],
                title: {
                    text:''
                },
                stackLabels: {
                    style: {
                        color: '#D32F2F'
                    },
                    enabled: false,
                    align: 'right'
                },
                formatter: function () {}
            },
            noData: gettextCatalog.getString('No Data'),
            size: {
                height: ''
            }
        };
        
        // Global configuration
        Highcharts.setOptions({global: {useUTC : false}});

        // Copy the basic configuration
        $scope.chart = JSON.parse(JSON.stringify(aChart));

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
        $scope.chart.yAxis.plotLines[2].label.text = 'mean';        
        
        // Size
        if($window.innerWidth < 535){
            $scope.chart.size.height = 250;
        }
        
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
                case '6m':
                    $scope.view = '3m';
                    from = new Date(new Date().setDate(new Date().getDate() - 90));
                break;
                default:
                    $scope.view = '';
                    from = new Date(new Date().setDate(new Date().getDate() - 30));
                break;
            }

            $ocLazyLoad.load('js/services/PatientService.js').then(function() {
                var Patient = $injector.get('Patient');
                Patient.chart({
                    username: $scope.$parent.username,
                    type: 'glycaemia',
                    from: from,
                    to: new Date
                }).success(function(data) {
                    $scope.chart.yAxis.plotLines[2].value = data.mean;
                    $scope.chart.yAxis.plotLines[2].label.text = "";
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
        }
        
        // First build
        $scope.build();
    });
})
.controller('CardMedialRecordController', function ($scope, $ocLazyLoad, $injector, $rootScope) {
    $ocLazyLoad.load('js/services/PatientService.js').then(function () {
        var Patient = $injector.get('Patient');
        
        // Read the patient medical record 
        Patient.medicalRecord({
            username: $scope.$parent.username
        }).success(function (data){
            $scope.patient = data;
        }).error(function (status, data){
            $rootScope.rootAlerts.push({
                type:'danger',
                msg: gettextCatalog.getString('An error occurred, please try again later'),
                priority: 2
            });
        });
    });
});