angular.module('SidebarDirective', []).directive('sidebar', function() {
    return {
        restrict: 'E',
        templateUrl: 'templates/sidebar.html',
        link: function($scope, $element, attrs) {
            $scope.$watch('navLeft', function(newVal) {
                if(newVal) {
                    var overlay = angular.element(document.querySelector('.sidebar-overlay'));
                    var sidebar = angular.element(document.querySelector('#sidebar'));
                    var sidebarItems = angular.element(document.querySelectorAll('.sidebar-item'));

                    angular.element(document.querySelector('.navbar-toggle')).bind('click', function() {
                        sidebar.toggleClass('open');
                        if ((sidebar.hasClass('sidebar-fixed-left') || sidebar.hasClass('sidebar-fixed-right')) && sidebar.hasClass('open')) {
                            overlay.addClass('active');
                        } else {
                            overlay.removeClass('active');
                        }
                    });

                    overlay.bind('click', function() {
                        hideSidebar();
                    });

                    sidebarItems.bind('click', function() {
                        hideSidebar();
                    });

                    function hideSidebar(){
                        overlay.removeClass('active');
                        sidebar.removeClass('open');
                    }}
            }, true); 
        }                                                       
    }
});