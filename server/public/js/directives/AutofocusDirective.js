angular.module('AutofocusDirective', []).directive('autofocus', function() {
    return {
        restrict: 'A',
        link: function($scope, $element, attrs) {
            // Give focus to the element
            $element[0].focus();
        }
    }
});