angular.module('TodoDirective', []).directive('todo', function(gettextCatalog, $ocLazyLoad, $injector, $rootScope, $state) {
    return {
        restrict: 'A',
        templateUrl: 'templates/dashboard/cards/directives/todo.html',
        link: function($scope, $element, $attrs) {
            $ocLazyLoad.load('js/services/UIService.js').then(function() {
                var UI = $injector.get('UI');
                $scope.todoListOK = [];
                $scope.todoListNOK = [];
                
                // Go to the add entry page
                $scope.go = function(item){
                    if(!item.done && item.params){
                        $state.go("home.dashboard.add", {card: item.params.card, timeslot: item.params.timeslot});
                    }
                };
                
                // Skip this entry
                $scope.skip = function(item){
                    $scope.$parent.addEntry({datetimeAcquisition: new Date(new Date().setHours(item.params.timeslot.suggestion, 0, 0)), type: item.params.card, skipped: true}, function(){
                        $scope.$parent.buildDashboard();
                    });
                };
                
                // Build todo list
                UI.todo().success(function(data){
                    for(i=0; i< data.length; i++){
                        data[i].title = gettextCatalog.getString(data[i].title);
                        if(data[i].subitems){
                            for(j=0; j< data[i].subitems.length; j++){
                                data[i].subitems[j].title = gettextCatalog.getString(data[i].subitems[j].title);
                            }
                        }
                        if(data[i].counter <= 0){
                            $scope.todoListOK.push(data[i]);
                        } else {
                            $scope.todoListNOK.push(data[i]);
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
        }
    }
});