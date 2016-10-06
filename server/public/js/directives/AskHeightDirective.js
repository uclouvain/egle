
angular.module('AskHeightDirective', []).directive('askheight', function(gettextCatalog, $ocLazyLoad, $injector, $rootScope) {
    return {
        restrict: 'A',
        templateUrl: 'templates/dashboard/asks/directives/ask_height.html',
        link: function($scope, $element, $attrs) {            
               
            $scope.height = undefined;            

            //Answer
            $scope.answer = function(){
                $scope.$parent.addEntry({type: 'height', value: $scope.height}, function(){
                	$scope.$parent.buildDashboard();
                });
            }
           
        }
    }
});