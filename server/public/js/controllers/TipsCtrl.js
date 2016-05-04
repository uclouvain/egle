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