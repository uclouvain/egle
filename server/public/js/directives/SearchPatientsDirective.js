angular.module('SearchPatientsDirective', []).directive('searchpatients', function(gettextCatalog, $ocLazyLoad, $injector, $rootScope) {
    return {
        restrict: 'A',
        templateUrl: 'templates/dashboard/cards/directives/search_patients.html',
        link: function($scope, $element, $attrs) {
            var trick = gettextCatalog.getString('Enter the username of the patient');
            $scope.helper = "";
            $scope.searchText = '';
            $scope.patients = [];

            $scope.in = function () {
                if($scope.searchText.length == 0){
                    $scope.helper = trick;
                }
            }

            $scope.out = function () {
                $scope.helper = "";
            }

            // Search for a patient
            $scope.search = function () {
                $ocLazyLoad.load('js/services/ContactService.js').then(function() {
                var Contact = $injector.get('Contact');
                    if($scope.searchText.length >= 1){
                        $scope.helper = "";
                        Contact.searchAccepted({
                            name: $scope.searchText.toLowerCase().replace(/[^a-zA-Z- àèìòùÀÈÌÒÙáéíóúýÁÉÍÓÚÝâêîôûÂÊÎÔÛãñõÃÑÕäëïöüÿÄËÏÖÜŸçÇßØøÅåÆæœ]+/g, "")
                        }).success(function(users){
                            if (users.length > 0) {
                                $scope.patients = users;
                            } else {
                                $scope.helper = "";
                                $scope.helper = gettextCatalog.getString("No results for") + " \"" + $scope.searchText + "\"";
                                $scope.patients = [];
                            }
                        }).error(function(status, data){
                            $rootScope.rootAlerts.push({
                                type:'danger',
                                msg: gettextCatalog.getString('An error occurred, please try again later'),
                                priority: 2
                            });
                        });
                    }
                    else{
                        $scope.helper = "";
                        $scope.patients = [];
                    }
                });
            };
        }
    }
});