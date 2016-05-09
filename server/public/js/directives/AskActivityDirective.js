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

angular.module('AskActivityDirective', []).directive('askactivity', function(gettextCatalog, $ocLazyLoad, $injector, $rootScope) {
    return {
        restrict: 'A',
        templateUrl: 'templates/dashboard/asks/directives/ask_activity.html',
        link: function($scope, $element, $attrs) {
            $scope.radio = {
                buttons : [{
                    type: 'sedentary',
                    title: gettextCatalog.getString('Office'),
                    desc: gettextCatalog.getString('be sitting, TV/PC, reading, video games'),
                    value: undefined,
                    icon: 'mdi-hardware-desktop-windows',
                    color: '#4A148C'
                },{
                    type: 'social',
                    title: gettextCatalog.getString('Social'),
                    desc: gettextCatalog.getString('family, friends, professional network'),
                    value: undefined,
                    icon: 'mdi-social-people',
                    color: '#8E24AA'
                },{
                    type: 'sport',
                    title: gettextCatalog.getString('Sport'),
                    desc: gettextCatalog.getString('jogging, swimming, tennis, golf'),
                    value: undefined,
                    icon: 'mdi-action-accessibility',
                    color: '#BA68C8',
                    intensity: undefined
                }],
                levels: [1,2,3,4,5]
            };
            
            //Answer
            $scope.answer = function(){
                var ok = false;
                if($scope.radio.buttons[2].value !== undefined && $scope.radio.buttons[2].value != 0 && $scope.radio.buttons[2].intensity === undefined){
                    $rootScope.rootAlerts.push({
                        type:'warning',
                        msg: gettextCatalog.getString('Please select an intensity'),
                        priority: 3
                    });
                } else {
                    ok = true;
                }

                if(ok){
                    for(i = 0; i < $scope.radio.buttons.length; i++) {
                        if($scope.radio.buttons[i].value){
                            if($scope.radio.buttons[i].type === "sport"){
                                $scope.$parent.addEntry({type: 'activity', subType: $scope.radio.buttons[i].type, value: $scope.radio.buttons[i].value, values: [{type:'intensity', value: $scope.radio.buttons[i].intensity}]}, function(){
                                });
                            } else {
                                $scope.$parent.addEntry({type: 'activity', subType: $scope.radio.buttons[i].type, value: $scope.radio.buttons[i].value}, function(){
                                });
                            }
                        }
                    }
                    $scope.$parent.buildDashboard();
                }
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