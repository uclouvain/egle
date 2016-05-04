angular.module('LostCtrl', [[
    'css/templates/sign.css'
]]).controller('LostController', function($scope, gettextCatalog, $ocLazyLoad, $injector, $state) {
    $scope.alert = {};
    $scope.patEmail = /^[a-z]+[a-z0-9._]+@[a-z]+\.[a-z.]{2,5}$/;
    $scope.loading = false;
    
    $ocLazyLoad.load('bower_components/angular-recaptcha/release/angular-recaptcha.min.js').then(function() {
        var vcRecaptchaService = $injector.get('vcRecaptchaService');
        $scope.response = '';
        
        $ocLazyLoad.load('js/services/UserService.js').then(function() {
            var User = $injector.get('User');

            $scope.lost = function(form) {
                $scope.alert = {};
                if($scope.response !== ''){
                    if(!form.email.$error.pattern){
                        $scope.loading = true;
                        User.lostPassword({
                            captcha: $scope.response,
                            email: $scope.email
                        }).success(function(data) {
                            $scope.loading = false;
                            if(!data.captcha){
                                $scope.alert = { 
                                    type:'warning', 
                                    msg: gettextCatalog.getString('Captcha verification failed. Please retry later.')
                                };
                            } else {
                                if(!data.exists){
                                    $scope.alert = { 
                                        type:'warning', 
                                        msg: gettextCatalog.getString('No account found with that email address.')
                                    };
                                } else {
                                    $state.go("signin", {"isLost": true});
                                }
                            }
                        }).error(function(status, data) {
                            $scope.loading = false;
                            $scope.alert = { 
                                type:'danger', 
                                msg: gettextCatalog.getString('Internal Server Error')
                            };
                        });
                    }
                    else{
                        $scope.alert = { 
                            type:'warning', 
                            msg: gettextCatalog.getString('Please, fill out the form correctly.')
                        };
                    }
                }
                else{
                    $scope.alert = { 
                        type:'warning', 
                        msg: gettextCatalog.getString("Don't forget to mark the verification box.")
                    };
                }
            }
        });
    });
});
