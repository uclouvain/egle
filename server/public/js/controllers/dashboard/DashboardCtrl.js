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

angular.module('DashboardCtrl', [[
    'bower_components/highcharts-release/highcharts.js',
    'css/templates/dashboard.css'
]])
.controller('DashboardController', function($scope, gettextCatalog, $ocLazyLoad, $injector, $rootScope, ModalService) {
    $scope.helper = [];
    $scope.asks = [];
    var helper = {
        msg1: gettextCatalog.getString("Empty dashboard"),
        msg2: gettextCatalog.getString("You can add dashboard cards from Settings.")
    };
    
    // Merge a date and a time and return the new datetime 
    function mergeDatetime(myDate, myTime){
        return new Date(myDate.getFullYear(), myDate.getMonth(), myDate.getDate(), myTime.getHours(), myTime.getMinutes(), myTime.getSeconds());
    }

    //Build cards
    function cards(){
        $ocLazyLoad.load('js/services/UIService.js').then(function() {
            var UI = $injector.get('UI');
            UI.cards().success(function(data) {
                $scope.cards = data.cards;
                if ($scope.cards.length == 0) {
                    $scope.helper = helper;
                } else {
                    $scope.helper = [];
                }
            }).error(function(status, data) {
                $rootScope.rootAlerts.push({
                    type:'danger',
                    msg: gettextCatalog.getString('An error occurred, please try again later'),
                    priority: 2
                });
            });
        });
    };
    
    // Build asks
    function ask(){
        $ocLazyLoad.load('js/services/UIService.js').then(function() {
            var UI = $injector.get('UI');
            UI.asks().success(function(data) {
                $scope.asks = [];
                if(data.ask !== null){
                    $scope.asks.push(data.ask);
                }
            }).error(function(status, data) {
                $rootScope.rootAlerts.push({
                    type:'danger',
                    msg: gettextCatalog.getString('An error occurred, please try again later'),
                    priority: 2
                });
            });
        });
    };
    
    // Build the dashboard
    $scope.buildDashboard = function(){
        cards();
        ask();
    }
    // First build
    $scope.buildDashboard();
    
    // Skip an ask card
    $scope.skip = function(type){
        $scope.addEntry({
            type: type,
            skipped: true
        }, function(){
            $scope.buildDashboard();
        });
    };
    
    //Add an entry
    $scope.addEntry = function(entry, callback) {
        $ocLazyLoad.load('js/services/EntryService.js').then(function() {
            var Entry = $injector.get('Entry');
            if(entry.value > 0 || !entry.value){
                var currentEntry = {
                    type : entry.type
                };

                if (entry.skipped) {
                    currentEntry.skipped = entry.skipped;
                }
                if (entry.datetimeAcquisition) {
                    currentEntry.datetimeAcquisition = entry.datetimeAcquisition;
                }
                if (entry.value) {
                    currentEntry.value = entry.value;
                }
                if (entry.subType) {
                    currentEntry.subType = entry.subType;
                }
                if (entry.values) {
                    currentEntry.values = entry.values;
                }

                Entry.create(currentEntry).success(function(data) {
                    callback(null);
                }).error(function(status, data) {
                    $rootScope.rootAlerts.push({
                        type:'danger',
                        msg: gettextCatalog.getString('Failed to add the entry!'),
                        priority: 2
                    });
                });
            } else {
                $rootScope.rootAlerts.push({
                    type:'info',
                    msg: gettextCatalog.getString('Value must be greater than 1.'),
                    priority: 4
                });
            }
        });
    }
    
    // Delete an entry
    $scope.deleteEntry = function(entry, callback) {
        ModalService.showModal({
            templateUrl: "templates/modals/deleteEntry.html",
            controller: function($scope, close){
                $scope.entry = entry;
                $scope.close = function(result) {
                    close(result, 500); // close, but give 500ms for bootstrap to animate
                };
            }
        }).then(function(modal) {
            modal.element.modal();
            modal.close.then(function(result) {
                if(result){
                    $ocLazyLoad.load('js/services/EntryService.js').then(function() {
                        var Entry = $injector.get('Entry');
                        Entry.delete({id: entry._id}).success(function(data) {
                            $rootScope.rootAlerts.push({
                                type:'success',
                                msg: gettextCatalog.getString("The entry has been removed"),
                                priority: 5
                            });
                            // Rebuild dashboard
                            $scope.buildDashboard();
                        }).error(function(status, data) {
                            $rootScope.rootAlerts.push({
                                type:'danger',
                                msg: gettextCatalog.getString('An error occurred, please try again later'),
                                priority: 2
                            });
                        });
                    });
                }
            });
        });
    }
    
    //Build a list
    $scope.buildList = function(config, callback){
        $ocLazyLoad.load('js/services/EntryService.js').then(function() {
            var Entry = $injector.get('Entry');
            Entry.list({
                type: config.type,
                subType: config.subType,
            }).success(function(data) {
                callback(data);
            }).error(function(status, data) {
                $rootScope.rootAlerts.push({
                    type:'danger',
                    msg: gettextCatalog.getString('An error occurred, please try again later'),
                    priority: 2
                });
                callback(null);
            });
        });
    };
    //--</entries>

    //--<appTips>
    //Got it
    $scope.gotit = function(name){
        $ocLazyLoad.load('js/services/UIService.js').then(function() {
            var UI = $injector.get('UI');
            UI.gotit({name: name}).success(function(data) {
                
            }).error(function(status, data) {
                $rootScope.rootAlerts.push({
                    type:'danger',
                    msg: gettextCatalog.getString('An error occurred, please try again later'),
                    priority: 2
                });
            });
        });
    }
    
    //Verify the state of an app tip
    $scope.verifyAppTip = function(name, callback){
        $ocLazyLoad.load('js/services/UIService.js').then(function() {
            var UI = $injector.get('UI');
            UI.verifyAppTip({name: name}).success(function(data) {
                callback(data.display);
            }).error(function(status, data) {
                $rootScope.rootAlerts.push({
                    type:'danger',
                    msg: gettextCatalog.getString('An error occurred, please try again later'),
                    priority: 2
                });
            });
        });
    };
    //--</appTips>
    
    //Build a chart
    $scope.buildChart = function(chart, config, callback){
        $ocLazyLoad.load('js/services/ChartService.js').then(function() {
            var Chart = $injector.get('Chart');
            Chart.build({
                type: chart.series[0].id,
                from: config.from,
                to: config.to
            }).success(function(data) {
                for(i=0;i<chart.series.length;i++){
                    chart.series[i].data = [];
                }
                callback(data);
            }).error(function(status, data) {
                for(i=0;i<chart.series.length;i++){
                    chart.series[i].data = [];
                }
                $rootScope.rootAlerts.push({
                    type:'danger',
                    msg: gettextCatalog.getString('An error occurred, please try again later'),
                    priority: 2
                });
                callback(null);
            });
        });
    };
    

    //A chart
    $scope.aChart = {
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
})
.controller('CardAuditController', function($scope, gettextCatalog, $ocLazyLoad, $injector, $rootScope) {
    $ocLazyLoad.load([
        'bower_components/pickadate/lib/themes/classic.css',
        'bower_components/pickadate/lib/themes/classic.date.css',
    ]);
    
    $scope.dateRange = {
        from: new Date(new Date().setDate(new Date().getDate() - 1)),
        to: new Date()
    }

    $scope.fetchResults = function (){
        if(($scope.dateRange.from && $scope.dateRange.to) && ($scope.dateRange.from <= $scope.dateRange.to)){
            $ocLazyLoad.load('js/services/AuditService.js').then(function() {
                var Audit = $injector.get('Audit');
                Audit.listByDate({
                    from: $scope.dateRange.from,
                    to: $scope.dateRange.to
                }).success(function(data) {
                    $scope.logs = data;
                }).error(function(status, data){
                    $rootScope.rootAlerts.push({
                        type:'danger',
                        msg: gettextCatalog.getString('An error occurred, please try again later'),
                        priority: 2
                    });
                });
            });
        } else {
            $rootScope.rootAlerts.push({
                type:'warning',
                msg: gettextCatalog.getString('Please choose a valid date range.'),
                priority: 3
            });
            $scope.logs = [];
        }
    }
    
    $scope.fetchResults();
});
