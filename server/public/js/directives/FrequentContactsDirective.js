angular.module('FrequentContactsDirective', []).directive('frequentcontacts', function(gettextCatalog, $ocLazyLoad, $injector, $rootScope) {
    return {
        restrict: 'A',
        templateUrl: 'templates/dashboard/cards/directives/frequent_contacts.html',
        link: function($scope, $element, $attrs) {
            $ocLazyLoad.load('js/services/ContactService.js').then(function() {
                var Contact = $injector.get('Contact');
                
                $scope.contacts = [], $scope.helper = [], $scope.selected = null;
                var helper = {
                    title: gettextCatalog.getString("No frequent contacts yet?"),
                    text: gettextCatalog.getString("Use Messages, to begin a conversation.")
                };

                // Select a contact
                $scope.select = function(contact){
                    if($scope.selected === contact){
                        $scope.selected = null;
                    } else {
                        $scope.selected = contact;
                    }
                };
                
                // Retrieve frequent contacts list
                Contact.frequent().success(function(data){
                    if(data.length == 0 && $scope.helper.length == 0) {
                        $scope.helper = helper;
                    }
                    // Add it to the scope
                    $scope.contacts = data;
                }).error(function(status, data) {
                    $rootScope.rootAlerts.push({
                        type:'danger',
                        msg: gettextCatalog.getString('An error occurred, please try again later'),
                        priority: 2
                    });
                });
            });
        }
    }
});