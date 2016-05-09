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

angular.module('TipsCtrl', []).controller('TipsController', function ($scope, gettextCatalog, $ocLazyLoad, $injector, $stateParams, $state, $rootScope) {
    $ocLazyLoad.load('js/services/TipService.js').then(function () {
        // Bookmark a tip
        function bookmark (id, callback) {
            var Tip = $injector.get('Tip');
            Tip.bookmark({id: id}).success(function (data) {
                var msg = '';
                if(data.bookmarked){
                    msg = gettextCatalog.getString('Tip has been added to favorites');
                } else {
                    msg = gettextCatalog.getString('Tip has been deleted from favorites');
                }
                callback(msg);
            }).error(function (status, data) {
                $rootScope.rootAlerts.push({
                    type:'danger',
                    msg: gettextCatalog.getString('An error occurred, please try again later'),
                    priority: 2
                });
            });
        };

        if ($stateParams.id === undefined) {
            $scope.mode = {
                status: false,
                title: gettextCatalog.getString("All tips"),
                text: gettextCatalog.getString("Favorites"),
            }
            
            $scope.helper = {
                title: gettextCatalog.getString("Favorites appear here"),
                text: gettextCatalog.getString("Use the heart to add to favorites")
            };

            // Retrieve all tips
            function getTips() {
                var Tip = $injector.get('Tip');
                Tip.list().success(function (data) {
                    $scope.tips = data;
                }).error(function (status, data) {
                    $rootScope.rootAlerts.push({
                        type:'danger',
                        msg: gettextCatalog.getString('An error occurred, please try again later'),
                        priority: 2
                    });
                });
            }
            getTips();

            // Toggle mode (all tips/favorite tips)
            $scope.toggleMode = function () {
                if (!$scope.mode.status) {
                    $scope.mode.title = gettextCatalog.getString("All tips");
                } else {
                    $scope.mode.title = gettextCatalog.getString("Favorite tips");
                }
            };

            $scope.filterTips = function (item) {
                if ($scope.mode.status) {
                    return item.bookmarked === true;
                } else {
                    return item;
                }
            };
            
            // Bookmark a tip, see bookmark(id, callback)
            $scope.bookmark = function (id) {
                bookmark(id, function(msg){
                    getTips();
                    $rootScope.rootAlerts.push({
                        type:'success',
                        msg: msg,
                        priority: 4
                    });
                });
            }
        } else if ($stateParams.id && $stateParams.id !== "") {
            // Retrieve the tip
            function getTip () {
                var Tip = $injector.get('Tip');
                Tip.read($stateParams.id).success(function (data) {
                    if (data.image) {
                        $scope.image = {'background': 'url(' + data.image + ') no-repeat center center #fff', 'background-size': 'contain', 'height': '300px'};
                    }
                    $scope.tip = data;
                }).error(function (status, data) {
                    $rootScope.rootAlerts.push({
                        type:'danger',
                        msg: gettextCatalog.getString('An error occurred, please try again later'),
                        priority: 2
                    });
                });
            }
            getTip();

            // Bookmark a tip, see bookmark(id, callback)
            $scope.bookmark = function (id) {
                bookmark(id, function(msg){
                    getTip();
                    $rootScope.rootAlerts.push({
                        type:'success',
                        msg: msg,
                        priority: 4
                    });
                });
            }
        } else {
            $state.go("home.tips.main");
        }
    });
});