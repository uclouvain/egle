angular.module('ResetCtrl', [[
    'css/templates/sign.css'
]]).controller('ResetController', function($scope, gettextCatalog, $ocLazyLoad, $injector, $stateParams, $state) {
    $scope.alert = {};

    $ocLazyLoad.load('js/services/UserService.js').then(function() {
        var User = $injector.get('User');

        $scope.reset = function(form) {
            $scope.alert = {};
            if(form.newPassword.$valid){
                User.resetPassword({
                    token: $stateParams.token,
                    newPassword: $scope.newPassword,
                    newPasswordConfirmation: $scope.newPasswordConfirmation
                }).success(function(data) {
                    if(!data.token){
                        $scope.newPassword = "";
                        $scope.newPasswordConfirmation = "";
                        $scope.alert = { 
                            type:'warning', 
                            msg: gettextCatalog.getString('The link you used to reset your password is invalid or has expired.')
                        };
                    }
                    else{
                        if(!data.changed){
                            $scope.newPassword = "";
                            $scope.newPasswordConfirmation = "";
                            $scope.alert = { 
                                type:'warning', 
                                msg: gettextCatalog.getString('Please, fill out the form correctly.')
                            };
                        } else {
                            $state.go("signin", {"isResetted": true, "email": data.email});
                        }
                    }
                }).error(function(status, data) {
                    $scope.newPassword = "";
                    $scope.newPasswordConfirmation = "";
                    $scope.alert = { 
                        type:'danger', 
                        msg: gettextCatalog.getString('Internal Server Error')
                    };
                });
            }
            else{
                $scope.newPassword = "";
                $scope.newPasswordConfirmation = "";
                $scope.alert = { 
                    type:'warning', 
                    msg: gettextCatalog.getString('Please, fill out the form correctly.')
                };
            }
        }
    });
});
