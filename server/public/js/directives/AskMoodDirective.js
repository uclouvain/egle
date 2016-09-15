
angular.module('AskMoodDirective', []).directive('askmood', function(gettextCatalog, $ocLazyLoad, $injector, $rootScope) {
    return {
        restrict: 'A',
        templateUrl: 'templates/dashboard/asks/directives/ask_mood.html',
        link: function($scope, $element, $attrs) {
        	$scope.mood =   [{
        	         		value : '1',
        	             	subType: 'angry',
        	                 title: gettextCatalog.getString("I am angry"),
        	                 shortForm: gettextCatalog.getString("Angry"),
        	                 img: {'background': 'url(./img/moods/angryRed.png) no-repeat center center', 'background-size': 'cover', 'opacity' : '1.0'},
        	                 text: {'opacity' : '1.0'}
        	             }, {
        	         		value : '2',
        	             	subType: 'upset',
        	                 title: gettextCatalog.getString("I am upset"),
        	                 shortForm: gettextCatalog.getString("Upset"),
        	                 img: {'background': 'url(./img/moods/upsetOrange.png) no-repeat center center', 'background-size': 'cover', 'opacity' : '1.0'},
        	                 text: {'opacity' : '1.0'}
        	             }, {
        	         		value : '3',
        	             	subType: 'afraid',
        	                 title: gettextCatalog.getString('I am afraid'),
        	                 shortForm: gettextCatalog.getString("Afraid"),
        	                 img: {'background': 'url(./img/moods/fearfulPurple.png) no-repeat center center', 'background-size': 'cover'}, 'opacity' : '1.0',
        	                 text: {'opacity' : '1.0'}
        	             }, {
        	         		value : '4',
        	             	subType: 'worried',
        	                 title: gettextCatalog.getString('I am worried'),
        	                 shortForm: gettextCatalog.getString("Worried"),
        	                 img: {'background': 'url(./img/moods/worriedIndigo.png) no-repeat center center', 'background-size': 'cover'}, 'opacity' : '1.0',
        	                 text: {'opacity' : '1.0'}
        	             }, {
        	         		value : '5',
        	             	subType: 'sad',
        	                 title: gettextCatalog.getString('I am sad'),
        	                 shortForm: gettextCatalog.getString("Sad"),
        	                 img: {'background': 'url(./img/moods/sadBlue.png) no-repeat center center', 'background-size': 'cover'}, 'opacity' : '1.0',
        	                 text: {'opacity' : '1.0'}
        	             }, {
        	         		value : '6',
        	             	subType: 'unhappy',
        	                 title: gettextCatalog.getString('I am unhappy'),
        	                 shortForm: gettextCatalog.getString("Unhappy"),
        	                 img: {'background': 'url(./img/moods/unhappyBlue.png) no-repeat center center', 'background-size': 'cover'}, 'opacity' : '1.0',
        	                 text: {'opacity' : '1.0'}
        	             }, {
        	         		value : '7',
        	             	subType: 'happy',
        	                 title: gettextCatalog.getString('I am okay'),
        	                 shortForm: gettextCatalog.getString("Okay"),
        	                 img: {'background': 'url(./img/moods/happyGreen.png) no-repeat center center', 'background-size': 'cover'}, 'opacity' : '1.0',
        	                 text: {'opacity' : '1.0'}
        	             }, {
        	         		value : '8',
        	             	subType: 'joyful',
        	                 title: gettextCatalog.getString('I am feeling great'),
        	                 shortForm: gettextCatalog.getString("Great"),
        	                 img: {'background': 'url(./img/moods/joyfulYellow.png) no-repeat center center', 'background-size': 'cover'}, 'opacity' : '1.0',
        	                 text: {'opacity' : '1.0'}
        	             }, {
        	         		value : '9',
        	             	subType: 'proud',
        	                 title: gettextCatalog.getString('I am proud'),
        	                 shortForm: gettextCatalog.getString("Proud"),
        	                 img: {'background': 'url(./img/moods/proudYellow.png) no-repeat center center', 'background-size': 'cover'}, 'opacity' : '1.0',
        	                 text: {'opacity' : '1.0'}
        	             } ];
        	         	
        	$scope.currentMood = {};
        	         	
	     	$scope.selectMood = function(mood){
	     		
	     		for(var i = 0; i < $scope.mood.length; ++i){
         			if($scope.mood[i] == mood){
         				$scope.mood[i].img.opacity = 1.0;
         				$scope.mood[i].text.opacity = 1.0;
         				$scope.currentMood = $scope.mood[i];
         			}else{
         				$scope.mood[i].img.opacity = 0.3;
         				$scope.mood[i].text.opacity = 0.3;
         			}
         		}
	         		
	     	};
	     	
	     	//Answer
            $scope.answer = function(){
            	$scope.$parent.addEntry({datetimeAcquisition: new Date(), type: "mood", subType: $scope.currentMood.subType, value: $scope.currentMood.value}, function(){
            		$scope.$parent.buildDashboard(); 
                });
            };
        }
    }
});