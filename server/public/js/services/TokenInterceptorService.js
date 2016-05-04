angular.module('TokenInterceptorService', []).factory('TokenInterceptor', function($rootScope, $q, $window, $location, jwtHelper) {
    return {
        request: function (config) {
            config.headers = config.headers || {};
            var token = $window.localStorage.token;
            if (token) {
                var decoded = jwtHelper.decodeToken($window.localStorage.token);
                if (typeof decoded.exp !== 'undefined') {
                    var remainingTime = Math.floor(decoded.exp - new Date().getTime()/1000);
                    if (remainingTime < 0) {
                        console.log('warning: tried to use an expired token !   the token expired ' + (-remainingTime) + ' seconds ago.');
                    } else {
                        config.headers.Authorization = 'Bearer ' + $window.localStorage.token;
                    }
                }
            }
            return config;
        },
        
        requestError: function(rejection) {
            return $q.reject(rejection);
        },

        response: function (response) {
            if ($rootScope.ERR_CONNECTION_REFUSED) {
                $rootScope.ERR_CONNECTION_REFUSED = false;
                $rootScope.$broadcast("ERR_CONNECTION_REFUSED");
            }
            
            var receivedToken = response.headers('Authorization');
            if ((typeof receivedToken !== 'string') || (receivedToken.length === 0) || (receivedToken === 'c')) {
                receivedToken = null;
            } else {
                receivedToken = receivedToken.replace('Bearer ', '');
            }
            
            //if the token is a valid JWT token, new or refreshed, save it in the localStorage
            if (receivedToken && !jwtHelper.isTokenExpired(receivedToken)) {
                $window.localStorage.token = receivedToken;
//                console.log('setting new token : ' + receivedToken + " at " + new Date().getTime() + ' ' + new Date());
            } else if (receivedToken) {
                console.log('received expired token !   expiration : ' + JSON.stringify(jwtHelper.decode(receivedToken)));
            }
            
            return response || $q.when(response);
        },

        responseError: function(rejection) {
            switch (rejection.status) {
                case -1:
                case 0:
                    $rootScope.ERR_CONNECTION_REFUSED = true;
                    $rootScope.$broadcast("ERR_CONNECTION_REFUSED");
                    break;
                case 400:
                    $location.path("/error/400");
                    break;
                case 403:
                    $location.path("/error/403");
                    break;
                case 404:
                    $location.path("/error/404");
                    break;
                case 401:  /* Revoke client authentication if 401 is received */
                    delete $window.localStorage.language;
                    delete $window.localStorage.token;
                    $location.path("/signin");
                    break;
            }
            return $q.reject(rejection);
        }
    };
});