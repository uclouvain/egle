angular.module('AskSwellingsDirective', []).directive('askswellings', function(gettextCatalog, $ocLazyLoad, $injector, $rootScope) {
    return {
        restrict: 'A',
        templateUrl: 'templates/dashboard/asks/directives/ask_swellings.html',
        link: function($scope, $element, $attrs) {
            $ocLazyLoad.load('js/services/EntryService.js').then(function() {
                var Entry = $injector.get('Entry');
                $scope.swellings = 20;

                var colorFct = function(value){
                	if(value <= 15)
                		return '#76ff03';
                    if(value <= 30)
                    	return '#c6ff00';
                    if(value <= 45)
                        return '#ffea00';
                    if(value <= 60)
                    	return '#ffc400';
                    if(value <= 75)
                        return '#ff9100';
                    if(value <= 90)
                        return '#ff3d00';
                	return "#d50000";
                };
                
                $scope.sliderOptions = {
                	floor: 0, 
                	ceil: 100,                 
                	step: 10, 
                	showSelectionBar: true,
                	getSelectionBarColor: colorFct,
                	getPointerColor: colorFct,
                	showTicks: true,
                    getTickColor: colorFct,
                    hideLimitLabels: true
                };

                Entry.last({type:'swellings'}).success(function(data){
                    if (data) {
                        $scope.swellings = data.value;
                        $scope.$apply();
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
                    $scope.$parent.addEntry({type: 'swellings', value: $scope.swellings}, function(){
                    	$scope.$parent.buildDashboard();
                    });
                }
            });
        }
    }
});