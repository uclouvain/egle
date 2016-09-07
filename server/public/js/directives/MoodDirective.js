
angular.module('MoodDirective', []).directive('mood', function(gettextCatalog, $ocLazyLoad, $injector, $rootScope) {
    return {
        restrict: 'A',
        templateUrl: 'templates/dashboard/cards/directives/mood.html',
        link: function($scope, $element, $attrs) {
        	$scope.mood =   [/*{
        		value : '0',
                subType: 'weird',
                title: gettextCatalog.getString('I feel weird'),
                img: {'background': 'url(./img/weird_face.png) no-repeat center center', 'background-size': 'cover', 'opacity' : '1.0'}
            },*/{
        		value : '1',
            	subType: 'bad',
                title: gettextCatalog.getString('I feel bad'),
                img: {'background': 'url(./img/sad_face.png) no-repeat center center', 'background-size': 'cover', 'opacity' : '1.0'}
            }, {
        		value : '2',
            	subType: 'okay',
                title: gettextCatalog.getString('I feel okay'),
                img: {'background': 'url(./img/neutral_face.png) no-repeat center center', 'background-size': 'cover', 'opacity' : '1.0'}
            }, {
        		value : '3',
            	subType: 'great',
                title: gettextCatalog.getString('I feel great'),
                img: {'background': 'url(./img/happy_face.png) no-repeat center center', 'background-size': 'cover'}, 'opacity' : '1.0'
            } ];
        	
        	$scope.currentMood = '';
        	
        	$scope.selectMood = function(mood){
        		//$scope.$parent.addEntry({datetimeAcquisition: new Date(), type: "Mood", subType: mood.subType, value: mood.value}, function(){
            		for(var i = 0; i < $scope.mood.length; ++i){
            			if($scope.mood[i] == mood){
            				$scope.mood[i].img.opacity = 1.0;
            				$scope.currentMood = $scope.mood[i].title;
            			}else{
            				$scope.mood[i].img.opacity = 0.5;
            			}
            		}
               // });
        	};
            
        }
    }
});