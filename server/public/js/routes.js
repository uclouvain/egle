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

angular.module('routes', []).config(['$stateProvider', '$urlRouterProvider', '$httpProvider', '$locationProvider', function ($stateProvider, $urlRouterProvider, $httpProvider, $locationProvider) {
    $.material.init();
    
    $urlRouterProvider.otherwise('/error/404');
	$stateProvider
    
        // Define Sign page
        .state('sign', {
            url: '/sign',
            views: {
                'content': {
                    templateUrl: 'templates/sign.html'
                }
            },
            access: { requiredAuthentication: false }
		})
    
        // Define SignIn page
        .state('signin', {
            url: '/signin',
            params: { isNew: null, isResetted: null, isLost: null, email: null},
            views: {
                'content': {
                    templateUrl: 'templates/signin.html',
                    controller: 'SigninController'
                }
            },
            access: { requiredAuthentication: false },
            resolve: {
                loadMyCtrl: ['$ocLazyLoad', function ($ocLazyLoad) {
                    return $ocLazyLoad.load('js/controllers/SigninCtrl.js');
                }]
            }
		})
    
        // Define activation page
        .state('activation', {
            url: '/signin/activation/:token',
            views: {
                'content': {
                    templateUrl: 'templates/signin.html',
                    controller: 'SigninController'
                }
            },
            access: { requiredAuthentication: false},
            resolve: {
                loadMyCtrl: ['$ocLazyLoad', function ($ocLazyLoad) {
                    return $ocLazyLoad.load('js/controllers/SigninCtrl.js');
                }]
            }
		})
    
        // Define SignUp page
        .state('signup', {
            url: '/signup',
            views: {
                'content': {
                    templateUrl: 'templates/signup.html',
                    controller: 'SignupController'
                }
            },
            access: { requiredAuthentication: false},
            resolve: {
                loadMyCtrl: ['$ocLazyLoad', function ($ocLazyLoad) {
                    return $ocLazyLoad.load('js/controllers/SignupCtrl.js');
                }]
            }
		})
    
        // Define password recovery page (ABSTRACT)
        .state('recovery', {
            abstract: true,
            url: '/recovery',
            views: {
                'content': {
                    templateUrl: 'templates/recovery/recovery.html'
                }
            },
            access: { requiredAuthentication: false}
		})
    
        // Define lost password page
        .state('recovery.lost', {
            url: '/lost',
            templateUrl: 'templates/recovery/lost.html',
            controller: 'LostController',
            access: { requiredAuthentication: false},
            resolve: {
                loadMyCtrl: ['$ocLazyLoad', function ($ocLazyLoad) {
                    return $ocLazyLoad.load('js/controllers/recovery/LostCtrl.js');
                }]
            }
		})
    
        // Define reset password page
        .state('recovery.reset', {
            url: '/reset/:token',
            templateUrl: 'templates/recovery/reset.html',
            controller: 'ResetController',
            access: { requiredAuthentication: false},
            resolve: {
                loadMyCtrl: ['$ocLazyLoad', function ($ocLazyLoad) {
                    return $ocLazyLoad.load('js/controllers/recovery/ResetCtrl.js');
                }]
            }
		})
    
        // Define home page (ABSTRACT)
        .state('home', {
            abstract: true,
            url: '/',
            views: {
                'header': {
                    templateUrl: 'templates/header.html',
                    controller: 'HeaderController'
                },
                'content': {
                    templateUrl: 'templates/home.html'
                }
            },
            access: { requiredAuthentication: true},
            resolve: {
                loadMyCtrl: ['$ocLazyLoad', function ($ocLazyLoad) {
                    return $ocLazyLoad.load('js/controllers/HeaderCtrl.js');
                }]
            }
		})
    
        // Define dashboard page (ABSTRACT)
        .state('home.dashboard', {
            abstract: true,
            url: '',
            templateUrl: 'templates/dashboard/dashboard.html',
            access: { requiredAuthentication: true}
		})
    
        // Define dashboard page
        .state('home.dashboard.main', {
            url: '',
            templateUrl: 'templates/dashboard/main.html',
            controller: 'DashboardController',
            access: { requiredAuthentication: true},
            resolve: {
                loadMyCtrl: ['$ocLazyLoad', function ($ocLazyLoad) {
                    return $ocLazyLoad.load('js/controllers/dashboard/DashboardCtrl.js');
                }]
            }
		})
    
        // Define define objective page
        .state('home.dashboard.objective', {
            url: 'cards/:card/objective',
            templateUrl: 'templates/dashboard/objective.html',
            controller: 'ObjectiveController',
            access: { requiredAuthentication: true},
            resolve: {
                loadMyCtrl: ['$ocLazyLoad', function ($ocLazyLoad) {
                    return $ocLazyLoad.load('js/controllers/dashboard/ObjectiveCtrl.js');
                }]
            }
		})
    
        // Define add entry page
        .state('home.dashboard.add', {
            url: 'cards/:card/add',
            params: { timeslot: null},
            templateUrl: 'templates/dashboard/add.html',
            controller: 'AddController',
            access: { requiredAuthentication: true},
            resolve: {
                loadMyCtrl: ['$ocLazyLoad', function ($ocLazyLoad) {
                    return $ocLazyLoad.load('js/controllers/dashboard/AddCtrl.js');
                }]
            }
		})
    
        // Define agenda page (ABSTRACT)    
        .state('home.agenda', {
            abstract: true,
            url: 'agenda',
            templateUrl: 'templates/agenda/agenda.html',
            access: { requiredAuthentication: true},
		})
    
        // Define agenda page
        .state('home.agenda.main', {
            url: '',
            params: { goto: null},
            templateUrl: 'templates/agenda/main.html',
            controller: 'AgendaController',
            access: { requiredAuthentication: true},
            resolve: {
                loadMyCtrl: ['$ocLazyLoad', function ($ocLazyLoad) {
                    return $ocLazyLoad.load('js/controllers/agenda/AgendaCtrl.js');
                }]
            }
		})
    
        // Define edit event page
        .state('home.agenda.edit', {
            url: '/event/:id',
            templateUrl: 'templates/agenda/event.html',
            controller: 'EventController',
            access: { requiredAuthentication: true},
            resolve: {
                loadMyCtrl: ['$ocLazyLoad', function ($ocLazyLoad) {
                    return $ocLazyLoad.load('js/controllers/agenda/EventCtrl.js');
                }]
            }
		})
    
        // Define add event page
        .state('home.agenda.add', {
            url: '/event',
            params: { from: null},
            templateUrl: 'templates/agenda/event.html',
            controller: 'EventController',
            access: { requiredAuthentication: true},
            resolve: {
                loadMyCtrl: ['$ocLazyLoad', function ($ocLazyLoad) {
                    return $ocLazyLoad.load('js/controllers/agenda/EventCtrl.js');
                }]
            }
		})
    
        // Define tips page (ABSTRACT)
        .state('home.tips', {
            abstract: true,
            url: 'tips',
            templateUrl: 'templates/tips/tips.html',
            access: { requiredAuthentication: true}
		})
    
        // Define tips page
        .state('home.tips.main', {
            url: '',
            templateUrl: 'templates/tips/main.html',
            controller: 'TipsController',
            access: { requiredAuthentication: true},
            resolve: {
                loadMyCtrl: ['$ocLazyLoad', function ($ocLazyLoad) {
                    return $ocLazyLoad.load('js/controllers/TipsCtrl.js');
                }]
            }
		})
    
        // Define one tip page
        .state('home.tips.one', {
            url: '/:id',
            templateUrl: 'templates/tips/one.html',
            controller: 'TipsController',
            access: { requiredAuthentication: true},
            resolve: {
                loadMyCtrl: ['$ocLazyLoad', function ($ocLazyLoad) {
                    return $ocLazyLoad.load('js/controllers/TipsCtrl.js');
                }]
            }
		})
    
        // Define chats page (ABSTRACT)
        .state('home.chats', {
            abstract: true,
            url: 'chats',
            templateUrl: 'templates/chats/chats.html',
            access: { requiredAuthentication: true}
		})
    
        // Define chats page
        .state('home.chats.main', {
            url: '',
            templateUrl: 'templates/chats/main.html',
            controller: 'ChatsController',
            access: { requiredAuthentication: true},
            resolve: {
                loadMyCtrl: ['$ocLazyLoad', function ($ocLazyLoad) {
                    return $ocLazyLoad.load('js/controllers/chats/ChatsCtrl.js');
                }]
            }
		})
    
        // Define new chat page
        .state('home.chats.new', {
            url: '/new',
            templateUrl: 'templates/chats/new.html',
            controller: 'ChatsController',
            access: { requiredAuthentication: true},
            resolve: {
                loadMyCtrl: ['$ocLazyLoad', function ($ocLazyLoad) {
                    return $ocLazyLoad.load('js/controllers/chats/ChatsCtrl.js');
                }]
            }
		})
    
        // Define one chat page
        .state('home.chats.one', {
            url: '/:username',
            templateUrl: 'templates/chats/one.html',
            controller: 'ChatController',
            access: { requiredAuthentication: true},
            resolve: {
                loadMyCtrl: ['$ocLazyLoad', function ($ocLazyLoad) {
                    return $ocLazyLoad.load('js/controllers/chats/ChatCtrl.js');
                }]
            }
		})
    
        // Define contacts page (ABSTRACT)
        .state('home.contacts', {
            abstract: true,
            url: 'contacts',
            templateUrl: 'templates/contacts/contacts.html',
            access: { requiredAuthentication: true}
		})
    
        // Define contacts page
        .state('home.contacts.main', {
            url: '',
            templateUrl: 'templates/contacts/main.html',
            controller: 'ContactsController',
            access: { requiredAuthentication: true},
            resolve: {
                loadMyCtrl: ['$ocLazyLoad', function ($ocLazyLoad) {
                    return $ocLazyLoad.load('js/controllers/contacts/ContactsCtrl.js');
                }]
            }
		})
    
        // Define add contact page
        .state('home.contacts.add', {
            url: '/add',
            templateUrl: 'templates/contacts/add.html',
            controller: 'ContactsController',
            access: { requiredAuthentication: true},
            resolve: {
                loadMyCtrl: ['$ocLazyLoad', function ($ocLazyLoad) {
                    return $ocLazyLoad.load('js/controllers/contacts/ContactsCtrl.js');
                }]
            }
		})
    
        // Define one contact page
        .state('home.contacts.one', {
            url: '/:username',
            templateUrl: 'templates/contacts/one.html',
            controller: 'ContactController',
            access: { requiredAuthentication: true},
            resolve: {
                loadMyCtrl: ['$ocLazyLoad', function ($ocLazyLoad) {
                    return $ocLazyLoad.load('js/controllers/contacts/ContactCtrl.js');
                }]
            }
		})
    
        // Define one patient page
        .state('home.patients', {
            url: 'patients/:username',
            templateUrl: 'templates/patient/patient.html',
            controller: 'PatientController',
            access: { requiredAuthentication: true},
            resolve: {
                loadMyCtrl: ['$ocLazyLoad', function ($ocLazyLoad) {
                    return $ocLazyLoad.load('js/controllers/PatientCtrl.js');
                }]
            }
		})
    
        // Define notifications page
        .state('home.notifications', {
            url: 'notifications',
            templateUrl: 'templates/notifications.html',
            controller: 'NotificationsController',
            access: { requiredAuthentication: true},
            resolve: {
                loadMyCtrl: ['$ocLazyLoad', function ($ocLazyLoad) {
                    return $ocLazyLoad.load('js/controllers/NotificationsCtrl.js');
                }]
            }
		})
    
        // Define profile page (ABSTRACT)
        .state('home.profile', {
            abstract: true,
            url: 'profile',
            templateUrl: 'templates/profile/profile.html',
            controller: 'ProfileController',
            access: { requiredAuthentication: true},
            resolve: {
                loadMyCtrl: ['$ocLazyLoad', function ($ocLazyLoad) {
                    return $ocLazyLoad.load('js/controllers/ProfileCtrl.js');
                }]
            }
		})
    
        // Define profile page
        .state('home.profile.main', {
            url: '',
            templateUrl: 'templates/profile/main.html',
            controller: 'ProfileController',
            access: { requiredAuthentication: true}
		})
    
        // Define profile>avatar page
        .state('home.profile.avatar', {
            url: '/avatar',
            templateUrl: 'templates/profile/avatar.html',
            controller: 'ProfileController',
            access: { requiredAuthentication: true}
		})
    
        // Define profile>basic informations page
        .state('home.profile.basic', {
            url: '/basic',
            templateUrl: 'templates/profile/basic.html',
            controller: 'ProfileController',
            access: { requiredAuthentication: true}
		})
    
        // Define profile>contact informations page
        .state('home.profile.contact', {
            url: '/contact',
            templateUrl: 'templates/profile/contact.html',
            controller: 'ProfileController',
            access: { requiredAuthentication: true}
		})
    
        // Define settings page (ABSTRACT)
        .state('home.settings', {
            abstract: true,
            url: 'settings',
            templateUrl: 'templates/settings/settings.html',
            controller: 'SettingsController',
            access: { requiredAuthentication: true},
            resolve: {
                loadMyCtrl: ['$ocLazyLoad', function ($ocLazyLoad) {
                    return $ocLazyLoad.load('js/controllers/SettingsCtrl.js');
                }]
            }
		})
    
        // Define settings page
        .state('home.settings.main', {
            url: '',
            templateUrl: 'templates/settings/main.html',
            access: { requiredAuthentication: true}
		})
    
        // Define password page
        .state('home.settings.password', {
            url: '/password',
            templateUrl: 'templates/settings/password.html',
            access: { requiredAuthentication: true}
		})
    
        // Define error page
        .state('home.error', {
            url: 'error/:status',
            templateUrl: 'templates/error.html',
            controller: 'ErrorController',
            access: { requiredAuthentication: true},
            resolve: {
                loadMyCtrl: ['$ocLazyLoad', function ($ocLazyLoad) {
                    return $ocLazyLoad.load('js/controllers/ErrorCtrl.js');
                }]
            }
		});
    
    $locationProvider.html5Mode(true);
    $httpProvider.interceptors.push('TokenInterceptor');
}]).run(function ($rootScope, $location, $state, $window, gettextCatalog, $ocLazyLoad, $injector) {
    $rootScope.$on("$stateChangeStart", function (event, nextState, currentRoute) {
        $rootScope.rootAlerts = [];
        
        // Get user account
        if($window.localStorage.token){
            $ocLazyLoad.load('js/services/UserService.js').then(function() {
                var User = $injector.get('User');
                User.read().success(function(profile) {
                    $window.localStorage.language = profile.language;
                    $rootScope.user = {
                        username: profile.username,
                        email: profile.email
                    };
                    if (profile.preferences !== undefined && profile.preferences.avatar !== undefined) {
                        $rootScope.user.avatar = profile.preferences.avatar;
                    }
                });
            });
        }
        
        // Define app language
        gettextCatalog.currentLanguage = ($window.localStorage.language !== undefined) ? $window.localStorage.language.toLowerCase() + '_BE' : (navigator.language.substr(0, 2) || navigator.userLanguage.substr(0, 2)) + '_BE';

        if (nextState !== null && nextState.access !== null && nextState.access.requiredAuthentication && !$window.localStorage.token) {
            $location.path("/sign");
        }
    });
});