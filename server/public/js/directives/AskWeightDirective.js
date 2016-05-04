angular.module('AskWeightDirective', []).directive('askweight', function(gettextCatalog, $ocLazyLoad, $injector, $rootScope) {
    return {
        restrict: 'A',
        templateUrl: 'templates/dashboard/asks/directives/ask_weight.html',
        link: function($scope, $element, $attrs) {
            $ocLazyLoad.load('js/services/ObjectiveService.js').then(function() {
                var Objective = $injector.get('Objective');
                $scope.weight = undefined;
                $scope.objective = undefined;

                Objective.read({type:'weight'}).success(function(data){
                    if (data) {
                        $scope.objective = data.values[0].value;
                    }
                }).error(function(status, data) {
                    $rootScope.rootAlerts.push({
                        type:'danger',
                        msg: gettextCatalog.getString('An error occurred, please try again later'),
                        priority: 2
                    });
                });

                //Answer
                $scope.answer = function(){
                    $scope.$parent.addEntry({type: 'weight', value: $scope.weight}, function(){
                        if($scope.objective > 0){
                            Objective.createOrUpdate({
                                objective: {
                                    type : 'weight',
                                    values : {value: $scope.objective}
                                }
                            }).success(function(data){
                                $scope.$parent.buildDashboard();
                            }).error(function(status, data) {
                                $rootScope.rootAlerts.push({
                                    type:'danger',
                                    msg: gettextCatalog.getString('An error occurred, please try again later'),
                                    priority: 2
                                });
                            });
                        } else {
                            $rootScope.rootAlerts.push({
                                type:'info',
                                msg: gettextCatalog.getString('Target value must be greater than 1'),
                                priority: 4
                            });
                        }
                    });
                }
            });
        }
    }
});