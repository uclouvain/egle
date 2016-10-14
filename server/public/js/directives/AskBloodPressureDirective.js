
angular.module('AskBloodPressureDirective', []).directive('askbloodpressure', function(gettextCatalog, $ocLazyLoad, $injector, $rootScope) {
    return {
        restrict: 'A',
        templateUrl: 'templates/dashboard/asks/directives/ask_bloodpressure.html',
        link: function($scope, $element, $attrs) {
           
            $scope.bp = {
            		diasto : undefined,
            		systo : undefined
            };

            //Answer
            $scope.answer = function(){
            	var values = [];
            	values.push({type: "systolic", value: ""+$scope.bp.systo+""});
            	values.push({type: "diastolic", value: ""+$scope.bp.diasto+""});
                $scope.$parent.addEntry({type: 'bloodpressure', values: values}, function(){
                	$scope.$parent.buildDashboard();
                });
            }           
        }
    }
});