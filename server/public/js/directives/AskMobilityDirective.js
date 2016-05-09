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

angular.module('AskMobilityDirective', []).directive('askmobility', function(gettextCatalog, $ocLazyLoad, $injector, $rootScope) {
    return {
        restrict: 'A',
        templateUrl: 'templates/dashboard/asks/directives/ask_mobility.html',
        link: function($scope, $element, $attrs) {
            $scope.radio = {
                buttons:[{
                    type: 'motor',
                    title: gettextCatalog.getString('Motor vehicule'),
                    value: undefined,
                    icon: 'mdi-maps-directions-car',
                    color: '#F06292'
                },{
                    type: 'public',
                    title: gettextCatalog.getString('Public transports'),
                    value: undefined,
                    icon: 'mdi-maps-directions-subway',
                    color: '#E91E63'
                },{
                    type: 'bike',
                    title: gettextCatalog.getString('Bike'),
                    value: undefined,
                    icon: 'mdi-maps-directions-bike',
                    color: '#C2185B'
                },{
                    type: 'walk',
                    title: gettextCatalog.getString('Walking'),
                    value: undefined,
                    icon: 'mdi-maps-directions-walk',
                    color: '#880E4F'
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
            };

            //Answer
            $scope.answer = function(){
                var values = [];
                for(i = 0; i < $scope.radio.buttons.length; i++) {
                    if($scope.radio.buttons[i].value !== undefined){
                        values.push({type:$scope.radio.buttons[i].type, value: $scope.radio.buttons[i].value});
                    }
                }
                $scope.$parent.addEntry({type: 'mobility', values: values}, function(){
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
            }
        }
    }
});