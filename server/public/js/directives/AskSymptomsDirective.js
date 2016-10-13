
angular.module('AskSymptomsDirective', []).directive('asksymptoms', function(gettextCatalog, $ocLazyLoad, $injector, $log, $rootScope, ModalService) {
    return {
        restrict: 'A',
        templateUrl: 'templates/dashboard/asks/directives/ask_symptoms.html',
        link: function($scope, $element, $attrs) {
            
        	$scope.title = gettextCatalog.getString("Please describe your symptoms");

        	
        	var getButtons = function() {
        		return [{        	
                    title: gettextCatalog.getString('Good'),
                    img: {'background': 'url(./img/good.png) no-repeat center center', 'background-size': 'cover', 'opacity' : '1.0'},
                    value: 0
                },{
                    title: gettextCatalog.getString('NotWell'),
                    img: {'background': 'url(./img/notWell.png) no-repeat center center', 'background-size': 'cover', 'opacity' : '1.0'},
                    value: 1
                },{
                    title: gettextCatalog.getString('Bad'),
                    img: {'background': 'url(./img/bad.png) no-repeat center center', 'background-size': 'cover', 'opacity' : '1.0'},
                    value: 2
                }];
        	}

        	$scope.symptoms = [{
        			type : 'dyspnea',
        			title : gettextCatalog.getString('Dyspnea'),
        			buttons : getButtons(),
        			value : -1
        		}, {
        			type : 'sleep',
        			title : gettextCatalog.getString('Sleep'),
        			buttons : getButtons(),
        			value : -1
        		}, {
        			type : 'swellings',
        			title : gettextCatalog.getString('Swellings'),
        			buttons : getButtons(),
        			value : -1
        		}, {
        			type : 'palpitations',
        			title : gettextCatalog.getString('Palpitations'),
        			buttons : getButtons(),
        			value : -1
	        	}, {
        			type : 'dizziness',
        			title : gettextCatalog.getString('Dizziness'),
        			buttons : getButtons(),
        			value : -1
	        	},{
	    			type : 'fatigue',
	    			title : gettextCatalog.getString('Fatigue'),
	    			buttons : getButtons(),
	    			value : -1
    		}];
	        
	     	$scope.select = function(btnNb, symptom){
	     		for(var i = 0; i < $scope.symptoms.length; ++i){
         			if($scope.symptoms[i] == symptom){
         				$scope.symptoms[i].buttons[btnNb].img.opacity = 1.0;         				
         				$scope.symptoms[i].value = $scope.symptoms[i].buttons[btnNb].value;
         				for(var k = 0; k < 3; ++k)
         					if(k != btnNb)
         						$scope.symptoms[i].buttons[k].img.opacity = 0.2;
         			}
         		}	     		     		
	     	};
	     	
	     	$scope.checkValid = function(e){
	     		for(var i = 0; i < $scope.symptoms.length; ++i){
	     			if($scope.symptoms[i].value < 0){
	     				return false;
	     			}
	     		}
	     		return true;
	     	};
        	
        	
        	$scope.addEntries = function(values, i){
        		if(i < values.length){
        			$scope.$parent.addEntry({type:values[i].type, value: values[i].value}, function(){
        				$scope.addEntries(values,i);
                    });   
        			++i;     			
        		}else{
        			$scope.$parent.buildDashboard();
        		}
        	};
	            
            //Answer
            $scope.answer = function(){
            	var values = [];
                for(i = 0; i < $scope.symptoms.length; i++) {
                    if($scope.symptoms[i].value < 0){
                        $scope.symptoms[i].value = 0;
                    }	                     
                    values.push({type:$scope.symptoms[i].type, value: $scope.symptoms[i].value});
                }
                // $scope.addEntries(values, 0);    
                $scope.$parent.addEntry({type: 'symptoms', values: values}, function(){
                	$scope.$parent.buildDashboard();
                });
            }           
        }
    }
});