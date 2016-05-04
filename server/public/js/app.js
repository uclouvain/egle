angular.module('app', [
    'ui.router',
    'routes',
    'oc.lazyLoad',
    'angular-jwt',
    'TokenInterceptorService',
    'datetimeFilters',
    'mappingFilters',
    'limitFilters',
    'gettext',
    'AutofocusDirective',
    'pickadate',
    'angularModalService'
]);

var underscore = angular.module('underscore', []);
    underscore.factory('_', function() {
    return window._;
});