angular.module('ErrorCtrl', []).controller('ErrorController', function($scope, $state, $stateParams, gettextCatalog) {
    if($stateParams.status != ""){
        switch($stateParams.status){
            case '403':
                $scope.title = gettextCatalog.getString("Sorry, this content isn't available right now");
                $scope.content = gettextCatalog.getString("The link you followed may have expired, or the page may only be visible to an audience you're not in.");
            break;
            default:
                $scope.title = gettextCatalog.getString("Sorry, this page isn't available");
                $scope.content = gettextCatalog.getString("The link you followed may be broken, or the page may have been removed.");
            break;
        }
    }
    else{
        $state.go("error", {status: '404'});
    }
});