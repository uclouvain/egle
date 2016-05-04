angular.module('SignupCtrl', [[
    'css/templates/sign.css'
]]).controller('SignupController', function($scope, $state, $window, gettextCatalog, $ocLazyLoad, $injector) {
    $scope.alert = {};
    $scope.loading = false;
    $scope.patEmail = /^([\w-]+(?:\.[\w-]+)*)@((?:[\w-]+\.)*\w[\w-]{0,66})\.([a-z]{2,6}(?:\.[a-z]{2})?)$/;
    $scope.rolesList = [
        {name:gettextCatalog.getString('Patient'), value:'3'}/*,
        {name:gettextCatalog.getString('Caregiver'), value:'2'}*/
    ];
    $scope.conditionsList = [
        {name:gettextCatalog.getString('Diabetes Type 1'), value:'d1'},
        {name:gettextCatalog.getString('Diabetes Type 2'), value:'d2'}/*,
        {name:gettextCatalog.getString("Alzheimer's Disease"), value:'a'}*/
    ];
    $scope.languagesList = [
        {name:'English', value:'EN'},
        {name:'Français', value:'FR'},
        {name:'Nederlands', value:'NL'}
    ];
    $scope.language = (navigator.language.substr(0, 2) || navigator.userLanguage.substr(0, 2)).toUpperCase();
    $scope.email = '';
    $scope.username = '';
    $scope.password = '';
    $scope.passwordConfirmation = '';
    $scope.response = '';
    
    // If a token exists, redirect to dashboard
    if($window.localStorage.token){
        $state.transitionTo('home.dashboard.main');
    }
    
    $scope.signup = function signup(form) {
        $scope.alert = {};
        $ocLazyLoad.load('bower_components/angular-recaptcha/release/angular-recaptcha.min.js').then(function() {
            var vcRecaptchaService = $injector.get('vcRecaptchaService');
            $ocLazyLoad.load('js/services/UserService.js').then(function() {
                var User = $injector.get('User');
                
                if(form.password.$valid && !form.email.$error.pattern && $scope.password === $scope.passwordConfirmation && $scope.response != ''){
                    if ($window.localStorage.token) {
                        $state.transitionTo("home.dashboard");
                    } else {
                        var body = {
                            captcha: $scope.response,
                            email: $scope.email,
                            username: $scope.username,
                            password: $scope.password,
                            passwordConfirmation: $scope.passwordConfirmation,
                            role: $scope.role,
                            language: $scope.language
                        }
                        if(body.role == 3) {
                            body.condition = $scope.condition;
                        }
                        $scope.loading = true;
                        User.signup(body).success(function(data) {
                            $scope.loading = false;
                            if(!data.captcha){
                                $scope.alert = { 
                                    type:'warning', 
                                    msg: gettextCatalog.getString('Captcha verification failed. Please retry later.')
                                };
                            } else {
                                $state.go("signin", {"isNew": true});
                            }
                        }).error(function(err, status) {
                            $scope.loading = false;
                            if (status === 400) {
                                $scope.password = "";
                                $scope.passwordConfirmation = "";
                                $scope.alert = {
                                    type:'warning', 
                                    msg: gettextCatalog.getString('Please, fill out the form correctly.')
                                };
                            } else {
                                if(err.errors.email){
                                    $scope.email = "";
                                    $scope.password = "";
                                    $scope.passwordConfirmation = "";
                                    $scope.alert = { 
                                        type:'warning',
                                        msg: gettextCatalog.getString("This email is already used. Please use 'Need Help?' link on sign in page to retrieve your account.")
                                    };
                                } else if(err.errors.username) {
                                    $scope.alert = { 
                                        type:'warning', 
                                        msg: gettextCatalog.getString('This username is already used. Please pick another one.'),
                                    };
                                } else {
                                    $scope.password = "";
                                    $scope.passwordConfirmation = "";
                                    $scope.alert = {
                                        type: 'danger',
                                        msg: gettextCatalog.getString('An error occurred, please try again later')
                                    };
                                }
                            }
                        });
                    }
                } else {
                    if(form.email.$error.pattern || $scope.email.length < 1){
                        $scope.alert = {
                            type: 'warning', 
                            msg: gettextCatalog.getString("Please verify your email address.")
                        };
                    } else {
                        if(!form.username.$valid || $scope.username.length < 1){
                            $scope.alert = {
                                type: 'warning', 
                                msg: gettextCatalog.getString("Please verify your username.")
                            };
                        } else {
                            console.log();
                            if(!form.password.$valid || $scope.password.length < 6 || 
                               !form.passwordConfirmation.$valid && $scope.passwordConfirmation.length < 6){
                               $scope.alert = {
                                    type: 'warning',
                                    msg: gettextCatalog.getString('Please, use at least 6 characters for your password.'),
                                };
                            } else {
                                if($scope.password !== $scope.passwordConfirmation){
                                    $scope.alert = {
                                        type:'warning', 
                                        msg: gettextCatalog.getString("Sorry, but passwords don't match.")
                                    };
                                    $scope.password = "";
                                    $scope.passwordConfirmation = "";
                                } else {
                                    if($scope.response == ''){
                                        $scope.alert = { 
                                            type:'info', 
                                            msg: gettextCatalog.getString("Don't forget to mark the verification box.")
                                        };
                                    } else {
                                        $scope.alert = {
                                            type:'warning', 
                                            msg: gettextCatalog.getString('Please, fill out the form correctly.')
                                        };
                                    }
                                }
                            }
                        }
                    }
                }
            });
        });
    }
});
