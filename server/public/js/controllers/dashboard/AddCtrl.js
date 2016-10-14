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

angular.module('AddCtrl', [[
    'bower_components/pickadate/lib/themes/classic.css',
    'bower_components/pickadate/lib/themes/classic.date.css',
    'bower_components/pickadate/lib/themes/classic.time.css',
    'css/templates/dashboard.css'
]])
.controller('AddController', function($scope, gettextCatalog, $ocLazyLoad, $injector, $stateParams, $state, $rootScope, ModalService, TokenInterceptor) {

    var conditions = TokenInterceptor.decode().condition;       
    // Check if input type 'date' is supported by the current browsers
    $scope.checkDateInput = function () {
        var input = document.createElement('input');
        input.setAttribute('type','date');
        var notADateValue = 'not-a-date';
        input.setAttribute('value', notADateValue); 
        return !(input.value === notADateValue);
    }
    
    $scope.more = false;
    $scope.value = undefined;
    $scope.advancedDuration = new Date(new Date().setHours(0, 15, 0, 0));
    $scope.myDate = new Date();
    
    if(($stateParams.timeslot && new Date() >= new Date().setHours(
        $stateParams.timeslot.from[0],
        $stateParams.timeslot.from[1],
        $stateParams.timeslot.from[2],
        $stateParams.timeslot.from[3]
    ) && new Date() < new Date().setHours(
        $stateParams.timeslot.to[0],
        $stateParams.timeslot.to[1],
        $stateParams.timeslot.to[2],
        $stateParams.timeslot.to[3]
    )) || !$stateParams.timeslot){
        $scope.myTime = new Date();
    } else {
        $scope.myTime = new Date(new Date().setHours($stateParams.timeslot.suggestion, 0, 0));
    }
    
    $scope.radios = {
        sport:{
            duration: {
                value: undefined,
                levels: [{
                    name: '15',
                    value: '0.25'
                },{
                    name: '30',
                    value: '0.5'
                },{
                    name: '45',
                    value: '0.75'
                },{
                    name: '60',
                    value: '1'
                },{
                    name: '90',
                    value: '1.5'
                }]
            },
            intensity: {
                value: undefined,
                levels: [1,2,3,4,5]
            }
        },
        meal: {
            buttons: [],
            levels: [1,2,3,4,5]
        },
        mobility: {
            buttons: [{
                type: 'motor',
                title: gettextCatalog.getString('Motor vehicule'),
                value: undefined,
                icon: 'mdi-maps-directions-car',
                color: '#F06292',
            },{
                type: 'public',
                title: gettextCatalog.getString('Public transports'),
                value: undefined,
                icon: 'mdi-maps-directions-subway',
                color: '#E91E63',
            },{
                type: 'bike',
                title: gettextCatalog.getString('Bike'),
                value: undefined,
                icon: 'mdi-maps-directions-bike',
                color: '#C2185B',
            },{
                type: 'walk',
                title: gettextCatalog.getString('Walking'),
                value: undefined,
                icon: 'mdi-maps-directions-walk',
                color: '#880E4F',
            }],
            levels: [{
                name: '15',
                value: '0.25'
            },{
                name: '30',
                value: '0.5'
            },{
                name: '45',
                value: '0.75'
            },{
                name: '60',
                value: '1'
            },{
                name: '90',
                value: '1.5'
            }]
        }
    };
    
    var colorFct = function(value){
    	if(value <= 1000)
			return '#d50000';
        if (value <= 3000)
            return '#ff3d00';
        if (value <= 5000)
            return '#ff9100';
        if(value <= 6000)
        	return '#ffc400';
        if (value <= 9000)
            return '#ffea00';
        if (value <= 12000)
        	return '#c6ff00';
        return '#76ff03';
    };
    
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
         
    
    if(conditions.indexOf('d1') > -1 || conditions.indexOf('d2') > -1){
    	$scope.radios.meal.buttons.push({
            type: 'slow',
            title: gettextCatalog.getString('Slow sugars'),
            desc: gettextCatalog.getString('bread'),
            img: {'background': 'url(./img/slow.jpg) no-repeat center center', 'background-size': 'cover'},
            value: undefined,
            score: 2
        });
    	$scope.radios.meal.buttons.push({
            type: 'fast',
            title: gettextCatalog.getString('Fast sugars'),
            desc: gettextCatalog.getString('soda'),
            img: {'background': 'url(./img/fast.jpg) no-repeat center center', 'background-size': 'cover'},
            value: undefined,
            score: 1
        });
    	$scope.radios.meal.buttons.push({
            type: 'fats',
            title: gettextCatalog.getString('Fats'),
            desc: gettextCatalog.getString('butter'),
            img: {'background': 'url(./img/fats.jpg) no-repeat center center', 'background-size': 'cover'},
            value: undefined,
            score: 1
        });
    }
    if(conditions.indexOf('hf') > -1){
    	$scope.radios.meal.buttons.push({
            type: 'salt',
            title: gettextCatalog.getString('Salt'),
            desc: gettextCatalog.getString('salty food'),
            img: {'background': 'url(./img/salt.jpg) no-repeat center center', 'background-size': 'cover'},
            value: undefined,
            score: 1
        });
    }
    


    switch($stateParams.card){
        case 'glycaemia':
            $scope.config = {
                name: 'glycaemia',
                title: gettextCatalog.getString("Glycaemia"),
                subtitle: gettextCatalog.getString("Glucose level"),
                input: gettextCatalog.getString("Measured value"),
                inputPlaceholder: 'mg/dl',
                commentsPlaceholder: gettextCatalog.getString('e.g.') + ' ' + gettextCatalog.getString('missed meal') + '...'
            };
        break;
        case 'insulin':
            $scope.config = {
                name: 'insulin',
                title: gettextCatalog.getString("Insulin"),
                subtitle: gettextCatalog.getString("Insulin intake"),
                input: gettextCatalog.getString("Unit(s)"),
                inputPlaceholder: gettextCatalog.getString('value'),
                commentsPlaceholder: gettextCatalog.getString('e.g.') + ' ' + gettextCatalog.getString('missed meal') + '...',
                insulinTypesList: [
                    {name: gettextCatalog.getString('Short') + " (2-5h)", value: 'short'},
                    {name: gettextCatalog.getString('Rapid') + " (5-7h)", value: 'rapid'},
                    {name: gettextCatalog.getString('Mixed') + " (10-12h)", value: 'mixed'},
                    {name: gettextCatalog.getString('Intermediate') + " (10-12h)", value: 'intermediate'},
                    {name: gettextCatalog.getString('Long') + " (24h)", value: 'long'}
                ]
            };
        break;
        case 'sport':
            $scope.config = {
                name: 'sport',
                title : gettextCatalog.getString("Sport"),
                subtitle: gettextCatalog.getString("Sport"),
                duration: gettextCatalog.getString("Duration"),
                intensity: gettextCatalog.getString("Intensity"),
                commentsPlaceholder: gettextCatalog.getString('e.g.') + ' ' + gettextCatalog.getString('swimming') + '...'
            };
        break;
        case 'weight':
            $scope.config = {
                name: 'weight',
                title : gettextCatalog.getString("Weight"),
                subtitle: gettextCatalog.getString("Weight"),
                input: gettextCatalog.getString("Measured value"),
                inputPlaceholder: 'kg',
                commentsPlaceholder: gettextCatalog.getString('e.g.') + ' ' + gettextCatalog.getString('dressed') + '...'
            };
        break;
        case 'bloodpressure':
        	 $scope.config = {
                name: 'bloodpressure',
                title : gettextCatalog.getString("Blood pressure"),
                subtitle: gettextCatalog.getString("Blood pressure"),
                input: gettextCatalog.getString("Measured value"),
                inputPlaceholder: 'mm Hg',
                commentsPlaceholder: gettextCatalog.getString('e.g.') + ' ' + '...'
            };
            $scope.bp = {
            		diasto : undefined,
            		systo : undefined
            };
        break;
        case 'steps':
            $scope.config = {
                name: 'steps',
                title : gettextCatalog.getString("Number of steps"),
                subtitle: gettextCatalog.getString("Number of steps"),
                input: gettextCatalog.getString("Steps taken"),
                inputPlaceholder: 'nb',
                sliderOptions: {
                	floor: 100, 
                	ceil: 15000,                 
                	step: 1000, 
                	showSelectionBar: true,
                	getSelectionBarColor: colorFct,
                	getPointerColor: colorFct,
                	showTicks: true,
                    getTickColor: colorFct                    
                },
                commentsPlaceholder: gettextCatalog.getString('e.g.') + ' ' + gettextCatalog.getString('Uphill') + '...'
            };
            $scope.value = 6000;
        break;
        case 'meal':
            $scope.config = {
                name: 'meal',
                title : gettextCatalog.getString("Meals"),
                subtitle: gettextCatalog.getString("Meals"),
                commentsPlaceholder: gettextCatalog.getString('e.g.') + ' ' + gettextCatalog.getString('1 fruit, 1 juice') + '...'
            };
        break;
        case 'symptoms':
            $scope.config = {
                name: 'symptoms',
                title : gettextCatalog.getString("Symptoms"),
                subtitle: gettextCatalog.getString("Symptoms"),
                commentsPlaceholder: gettextCatalog.getString('e.g.') + ' ' + gettextCatalog.getString('Palpitations the morning') + '...'
            };
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
        break;
        case 'mobility':
            $scope.config = {
                name: 'mobility',
                title : gettextCatalog.getString("Mobility"),
                subtitle: gettextCatalog.getString("Mobility")
            };
        break;
    }
    
    
    function mergeDatetime(myDate, myTime){
        return new Date(myDate.getFullYear(), myDate.getMonth(), myDate.getDate(), myTime.getHours(), myTime.getMinutes(), myTime.getSeconds());
    }
    
    function toDuration(time){
        return (parseInt(time.getMinutes()) / 60) + parseInt(time.getHours());
    }
    
    //Add an entry
    function addEntry(entry, callback) {
        $ocLazyLoad.load('js/services/EntryService.js').then(function() {
            var Entry = $injector.get('Entry');
            var currentEntry = {
                type : entry.type,
                value: entry.value
            };
            
            if (entry.myDate && entry.myTime) {
                currentEntry.datetimeAcquisition = mergeDatetime(entry.myDate, entry.myTime);
            }
            if (entry.subType) {
                currentEntry.subType = entry.subType;
            }
            if (entry.values) {
                currentEntry.values = entry.values;
            }
            if(entry.comments){
                currentEntry.comments = $scope.comments;
            }

            Entry.create(currentEntry).success(function(data) {
                callback(data);
            }).error(function(status, data) {
                $rootScope.rootAlerts.push({
                    type:'danger',
                    msg: gettextCatalog.getString('Failed to add the entry!'),
                    priority: 2
                });
            });
        });
    }
    
    
    $scope.verify = function(){
        var ok = true;
        var count = 0;
        switch($stateParams.card){
            case 'sport':
                if(!$scope.radios.sport.duration.value && !$scope.more){
                    ok = false;
                }
                if(!$scope.radios.sport.intensity.value){
                    ok = false;
                }
            break;
            case 'insulin':
                if(!$scope.value){
                    ok = false;
                }
                if(!$scope.insulinType){
                    ok = false;
                }
            break;
            case 'bloodpressure':
                if(!$scope.bp.systo){
                    ok = false;
                }
                if(!$scope.bp.diasto){
                    ok = false;
                }
            break;
            case 'meal':
                for(i=0;i<$scope.radios.meal.buttons.length;i++){
                    if(!$scope.radios.meal.buttons[i].value){
                        count++;
                    }
                    if($scope.radios.meal.buttons.length == count){
                        ok = false;
                    }
                }
            break;
            case 'mobility':
                for(i=0;i<$scope.radios.mobility.buttons.length;i++){
                    if(!$scope.radios.mobility.buttons[i].value){
                        count++;
                    }
                    if($scope.radios.mobility.buttons.length == count){
                        ok = false;
                    }
                }
                
            break;
            case 'symptoms':
            	for(i = 0; i < $scope.symptoms.length; i++) {
                    if($scope.symptoms[i].value < 0){
                        ok = false;
                    }
                }
            break;
            default:
                if(!$scope.value){
                    ok = false;
                }
            break;
        }
        return ok;
    }
    
    
    //Add an entry
    $scope.add = function() {
        var entry = {myDate: $scope.myDate, myTime: $scope.myTime};
        if($scope.comments){
            entry.comments = $scope.comments;
        }

        switch($stateParams.card){
            case 'sport':
                entry.type = 'activity';
                entry.subType = $stateParams.card;
                if($scope.more){
                    entry.value = toDuration($scope.advancedDuration);
                } else {
                    entry.value = $scope.radios.sport.duration.value;
                }
                
                entry.values = [{type: 'intensity', value: $scope.radios.sport.intensity.value}];
                addEntry(entry, function(){
                    $state.go("home.dashboard.main");
                });
            break;
            case 'insulin':
                entry.type = $stateParams.card;
                entry.value = $scope.value;
                entry.values = [{type:$scope.insulinType}];
                addEntry(entry, function(){
                    $state.go("home.dashboard.main");
                });
            break;
            case 'bloodpressure':
            	entry.type = $stateParams.card;
            	var values = [];
            	values.push({type: "systolic", value: ""+$scope.bp.systo+""});
            	values.push({type: "diastolic", value: ""+$scope.bp.diasto+""});
            	entry.values = values;
                addEntry(entry, function(){
                	$state.go("home.dashboard.main");
                });
            break;
            case 'symptoms':
            	entry.type = $stateParams.card;
                entry.values = [];
                for(i = 0; i < $scope.symptoms.length; i++) {
                    if($scope.symptoms[i].value < 0){
                        $scope.symptoms[i].value = 0;
                    }	                     
                    entry.values.push({type:$scope.symptoms[i].type, value: $scope.symptoms[i].value});
                }
                addEntry(entry, function(){
                    $state.go("home.dashboard.main");
                });
            break;
            case 'meal':
                var average = 0;
                var total = 0;
                var values = [];
                for(i = 0; i < $scope.radios.meal.buttons.length; i++) {
                    if($scope.radios.meal.buttons[i].value === undefined){
                        $scope.radios.meal.buttons[i].value = 0;
                    }
                    values.push({type:$scope.radios.meal.buttons[i].type, value: $scope.radios.meal.buttons[i].value});
                    average = average + parseFloat($scope.radios.meal.buttons[i].value) * $scope.radios.meal.buttons[i].score;
                    total = total + $scope.radios.meal.buttons[i].score;
                }
                entry.value = average;
                average = average/total;
                entry.type = 'meal';
                entry.values = values;
                addEntry(entry, function(){
                    if(average <= 1.5 || average >= 3.5){
                        if(average <= 1.5){
                            text = gettextCatalog.getString('Your last meal has a low energy intake. Be careful.');
                        } else if(average >= 3.5){
                            text = gettextCatalog.getString('Your last meal has a rich trend. Be careful.');
                        }
                        
                        ModalService.showModal({
                            templateUrl: "templates/modals/warning.html",
                            controller: function($scope, close){
                                $scope.text = text;
                                $scope.close = function(result) {
                                    close(result, 500); // close, but give 500ms for bootstrap to animate
                                };
                            }
                        }).then(function(modal) {
                            modal.element.modal();
                            modal.close.then(function(result) {
                            });
                        });
                    }
                    $state.go("home.dashboard.main");
                });
            break;
            case 'mobility':
                var values = [];
                for(i = 0; i < $scope.radios.mobility.buttons.length; i++) {
                    if($scope.radios.mobility.buttons[i].value !== undefined){
                        values.push({type:$scope.radios.mobility.buttons[i].type, value: $scope.radios.mobility.buttons[i].value});
                    }
                }
                entry.type = 'mobility';
                entry.values = values;
                addEntry(entry, function(data){
                    if(data.duplicate){
                        $rootScope.rootAlerts.push({
                            type:'warning',
                            msg: gettextCatalog.getString('An entry already exists for this date'),
                            priority: 3
                        });
                    } else {
                        $state.go("home.dashboard.main");
                    }
                });
            break;
            default:
                entry.type = $stateParams.card;
                entry.value = $scope.value;                
                addEntry(entry, function(){
                    $state.go("home.dashboard.main");
                });
            break;
        }
    };

    
    $scope.reset = function(button){
        if(button.clicked){
            button.value = undefined;
            button.clicked = false;
        } else {
            button.clicked = true;
        }
    }
    
    function decToDate(dec) {
        var flo = parseFloat(dec);
        var hours   = Math.floor(flo / 60);
        var minutes = Math.floor((flo - (hours * 60)) * 60);
        return new Date(new Date().setHours(hours, minutes, 0, 0));
    }
    
    $scope.toggleMore = function(){
        if($scope.config.name === 'sport'){
            if($scope.radios.sport.duration.value){
                $scope.advancedDuration = decToDate($scope.radios.sport.duration.value);
            }
        }
        $scope.more = !$scope.more;
    }
    
});