
angular.module('HemoglobinDirective', []).directive('hemoglobin', function(gettextCatalog, $ocLazyLoad, $injector, $rootScope) {
    return {
        restrict: 'A',
        templateUrl: 'templates/dashboard/cards/directives/hemoglobin.html',
        link: function($scope, $element, $attrs) {
        	$ocLazyLoad.load('js/services/GlycHemoglobinService.js').then(function() {
	        	var GlycHemoglobin = $injector.get('GlycHemoglobin');
	            
	        	 // Retrieve the glycated hemoglobin
	            GlycHemoglobin.computeValue().success(function(data){               
	                // Add it to the scope
	                $scope.glycHemo = data;
	                // Get number of days the value is computed on
	                $scope.nbDays = new Date().getTime();
	                $scope.nbDays = $scope.nbDays - (new Date($scope.glycHemo.start).getTime());
	                $scope.nbDays = parseInt($scope.nbDays / (1000*60*60*24));
	                // NGSP = [0.09148 * IFCC] + 2.152)
	                $scope.IFCCValue = ($scope.glycHemo.value - 2.152 ) / 0.09148;
	                
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