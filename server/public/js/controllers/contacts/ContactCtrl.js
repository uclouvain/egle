angular.module('ContactCtrl', []).controller('ContactController', function($scope, gettextCatalog, $stateParams, $state, $ocLazyLoad, $injector, $rootScope) {
    if($stateParams.username != ""){
        $ocLazyLoad.load('js/services/ContactService.js').then(function() {
            var Contact = $injector.get('Contact');
            Contact.read({
                username : $stateParams.username
            }).success(function(data){
                $scope.contact = data;
            }).error(function(status, data) {
                $rootScope.rootAlerts.push({
                    type:'danger',
                    msg: gettextCatalog.getString('An error occurred, please try again later'),
                    priority: 2
                });
            });
        });
    } else {
        $state.go("home.contacts.main");
    }
});
