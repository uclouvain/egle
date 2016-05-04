angular.module('SettingsCtrl', []).controller('SettingsController', function($scope, $state, $window, gettextCatalog, $ocLazyLoad, $injector, $rootScope) {
    $ocLazyLoad.load('js/services/UserService.js').then(function() {
        var User = $injector.get('User');
        $ocLazyLoad.load('js/services/UIService.js').then(function() {
            var UI = $injector.get('UI');
            
            $scope.items = [];
            $scope.languagesList = [
                {name:'English', value:'EN'},
                {name:'Français', value:'FR'},
                {name:'Nederlands', value:'NL'}
            ];
            $scope.language = $window.localStorage.language;
            $scope.oldPassword = "";
            $scope.newPassword = "";
            $scope.newPasswordConfirmation = "";
            
            // Build cards list
            function buildList(){
                UI.settings().success(function(data) {
                    if($scope.items.length > 0){
                        for(i=0;i<data.items.length;i++){
                            for(j=0;j<$scope.items.length;j++){
                                if(data.items[i].name == $scope.items[j].name){
                                    if(data.items[i].enabled != $scope.items[j].enabled){
                                        $scope.items[j].enabled = data.items[i].enabled;
                                    }
                                    if(data.items[i].subitems && $scope.items[j].subitems){
                                        for(k=0;k<data.items[i].subitems.length;k++){
                                            for(l=0;l<$scope.items[j].subitems.length;l++){
                                                if(data.items[i].subitems[k].name == $scope.items[j].subitems[l].name){
                                                    if(data.items[i].subitems[k].enabled != $scope.items[j].subitems[l].enabled){
                                                        $scope.items[i].subitems[l].enabled = data.items[i].subitems[k].enabled;
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                        
                    } else {
                        for(i=0;i<data.items.length;i++){
                            data.items[i].title = gettextCatalog.getString(data.items[i].title);
                            if(data.items[i].subitems){
                                for(j=0;j<data.items[i].subitems.length;j++){
                                    data.items[i].subitems[j].title = gettextCatalog.getString(data.items[i].subitems[j].title);
                                }
                            }
                        }
                        $scope.items = data.items;
                    }
                    
                }).error(function(status, data) {
                    $rootScope.rootAlerts.push({
                        type:'danger',
                        msg: gettextCatalog.getString('An error occurred, please try again later'),
                        priority: 2
                    });
                });
            }
            // First build
            buildList();
            
            // Enable/disable a card
            $scope.toggle = function(item, subitem){
                var body = {
                    name: item.name
                }
                if(subitem){
                    body.subitem = subitem.name
                }
                UI.toggleCard(body).success(function(data) {
                    if(!subitem){
                        buildList();
                    }
                }).error(function(status, data) {
                    $rootScope.rootAlerts.push({
                        type:'danger',
                        msg: gettextCatalog.getString('An error occurred, please try again later'),
                        priority: 2
                    });
                });
            }        
        
            // Change user's language
            $scope.changeLanguage = function(){
                User.update({
                    language: $scope.language,
                }).success(function(data) {
                    $window.localStorage.language = $scope.language;
                    $state.go("home.settings.main",{}, {reload: true});
                    $rootScope.rootAlerts.push({
                        type:'success',
                        msg: gettextCatalog.getString("Language changed!"),
                        priority: 5
                    });
                }).error(function(status, data) {
                    $rootScope.rootAlerts.push({
                        type:'danger',
                        msg: gettextCatalog.getString('An error occurred, please try again later'),
                        priority: 2
                    });
                });
            };

            // Change user's password
            $scope.changePassword = function(form){
                if(form.newPassword.$valid && $scope.newPassword === $scope.newPasswordConfirmation){
                    User.changePassword({
                        oldPassword: $scope.oldPassword,
                        newPassword: $scope.newPassword,
                        newPasswordConfirmation: $scope.newPasswordConfirmation
                    }).success(function(data) {
                        if(!data.new){
                            $scope.oldPassword= "";
                            $scope.newPassword= "";
                            $scope.newPasswordConfirmation= "";
                            $rootScope.rootAlerts.push({
                                type:'warning',
                                msg: gettextCatalog.getString("These passwords don't match."),
                                priority: 3
                            });
                        } else {
                            if(!data.old){
                                $scope.oldPassword= "";
                                $scope.newPassword= "";
                                $scope.newPasswordConfirmation= "";
                                $rootScope.rootAlerts.push({
                                    type:'warning',
                                    msg: gettextCatalog.getString("The current password you entered is incorrect"),
                                    priority: 3
                                });
                            } else {
                                $scope.oldPassword= "";
                                $scope.newPassword= "";
                                $scope.newPasswordConfirmation= "";
                                $state.go("home.settings.main");
                                $rootScope.rootAlerts.push({
                                    type:'success',
                                    msg: gettextCatalog.getString("Your password was changed with success."),
                                    priority: 5
                                });
                            }
                        }
                    }).error(function(status, data) {
                        $rootScope.rootAlerts.push({
                            type:'danger',
                            msg: gettextCatalog.getString('An error occurred, please try again later'),
                            priority: 2
                        });
                    });
                } else {
                    if(!form.newPassword.$valid || $scope.newPassword.length < 6 ||
                       !form.newPasswordConfirmation.$valid && $scope.newPasswordConfirmation.length < 6){
                        $rootScope.rootAlerts.push({
                            type:'warning',
                            msg: gettextCatalog.getString("Please, use at least 6 characters for your password."),
                            priority: 3
                        });
                        $scope.newPassword = "";
                        $scope.newPasswordConfirmation = "";
                    } else if($scope.newPassword !== $scope.newPasswordConfirmation){
                        $rootScope.rootAlerts.push({
                            type:'warning',
                            msg: gettextCatalog.getString("Sorry, but passwords don't match."),
                            priority: 3
                        });
                        $scope.newPassword = "";
                        $scope.newPasswordConfirmation = "";
                    } else {
                        $scope.oldPassword= "";
                        $scope.newPassword= "";
                        $scope.newPasswordConfirmation= "";
                        $rootScope.rootAlerts.push({
                            type:'warning',
                            msg: gettextCatalog.getString("Please, fill out the form correctly."),
                            priority: 3
                        });
                    }
                }
            };
        });
    });
});
