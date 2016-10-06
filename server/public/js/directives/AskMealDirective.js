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

angular.module('AskMealDirective', []).directive('askmeal', function(gettextCatalog, $ocLazyLoad, $injector, $rootScope, ModalService) {
    return {
        restrict: 'A',
        templateUrl: 'templates/dashboard/asks/directives/ask_meal.html',
        link: function($scope, $element, $attrs) {
            // Display a title in accordance with time
            if((new Date >= new Date().setHours(7, 0, 0) && new Date <= new Date().setHours(10, 0, 0))){
                $scope.title = gettextCatalog.getString("Please describe your breakfast");
            } else if (new Date >= new Date().setHours(12, 0, 0) && new Date <= new Date().setHours(14, 0, 0)){
                $scope.title = gettextCatalog.getString("Please describe your lunch");
            } else {
                $scope.title = gettextCatalog.getString("Please describe your dinner");
            }
            
            $scope.radio = {
	                buttons: [],
	                levels: [1,2,3,4,5]
	            };

            $ocLazyLoad.load('js/services/TokenInterceptorService.js').then(function() {
                var TI = $injector.get('TokenInterceptor');
                
                var conditions = TI.decode().condition;                
	            
	            if(conditions.indexOf('d1') > -1 || conditions.indexOf('d2') > -1){
	            	$scope.radio.buttons.push({
	                    type: 'slow',
	                    title: gettextCatalog.getString('Slow sugars'),
	                    desc: gettextCatalog.getString('bread'),
	                    img: {'background': 'url(./img/slow.jpg) no-repeat center center', 'background-size': 'cover'},
	                    value: undefined,
	                    score: 2
	                });
	            	$scope.radio.buttons.push({
	                    type: 'fast',
	                    title: gettextCatalog.getString('Fast sugars'),
	                    desc: gettextCatalog.getString('soda'),
	                    img: {'background': 'url(./img/fast.jpg) no-repeat center center', 'background-size': 'cover'},
	                    value: undefined,
	                    score: 1
	                });
	            	$scope.radio.buttons.push({
	                    type: 'fats',
	                    title: gettextCatalog.getString('Fats'),
	                    desc: gettextCatalog.getString('butter'),
	                    img: {'background': 'url(./img/fats.jpg) no-repeat center center', 'background-size': 'cover'},
	                    value: undefined,
	                    score: 1
	                });
	            }
	            if(conditions.indexOf('hf') > -1){
	            	$scope.radio.buttons.push({
	                    type: 'salt',
	                    title: gettextCatalog.getString('Salt'),
	                    desc: gettextCatalog.getString('salty food'),
	                    img: {'background': 'url(./img/salt.jpg) no-repeat center center', 'background-size': 'cover'},
	                    value: undefined,
	                    score: 0
	                });
	            }
	            
	            //Answer
	            $scope.answer = function(){
	                var average = 0;
	                var total = 0;
	                var values = [];
	                for(i = 0; i < $scope.radio.buttons.length; i++) {
	                    if($scope.radio.buttons[i].value === undefined){
	                        $scope.radio.buttons[i].value = 0;
	                    }	                    
	                    values.push({type:$scope.radio.buttons[i].type, value: $scope.radio.buttons[i].value});
	                    
		                average = average + parseFloat($scope.radio.buttons[i].value) * $scope.radio.buttons[i].score;
		                total = total + $scope.radio.buttons[i].score;
	                    
	                }
	                $scope.$parent.addEntry({type: 'meal', value: average, values: values}, function(){
	                    average = average/total;
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
	                    $scope.$parent.buildDashboard();
	                });
	            }
	
	            // Reset radio buttons
	            $scope.reset = function(button){
	                if(button.clicked){
	                    button.value = undefined;
	                    button.clicked = false;
	                } else {
	                    button.clicked = true;
	                }
	            };
            });
        }
    }
});