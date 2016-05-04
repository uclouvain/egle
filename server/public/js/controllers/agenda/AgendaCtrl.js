angular.module('AgendaCtrl', [[
    'bower_components/fullcalendar/dist/fullcalendar.min.js',
    'bower_components/fullcalendar/dist/fullcalendar.min.css',
    'css/templates/agenda.css'
]]).controller('AgendaController', function ($scope, $window, gettextCatalog, $ocLazyLoad, $injector, $state, $rootScope, $stateParams) {
    $ocLazyLoad.load('bower_components/angular-ui-calendar/src/calendar.js').then(function() {
        var uiCalendarConfig = $injector.get('uiCalendarConfig');
        var fixHeight = 130;
        var colors = ['#308fe9','#9C27B0','#FFC107', '#4caf50', '#CDDC39'];
        var from, to;
        $scope.view = 'threeDays';
        $scope.eventSources = [];

        // Get all the events in a range date
        var getEventsFromTo = function () {
            $ocLazyLoad.load('js/services/EventService.js').then(function() {
                var Event = $injector.get('Event');
                Event.listByDateRange({
                    from: from,
                    to: to
                })
                .success(function (data) {
                    uiCalendarConfig.calendars['myCalendar'].fullCalendar('removeEvents');
                    angular.forEach(data, function (event) {
                        // change the date to match the entries
                        event.start = new Date(event.start);
                        event.end = new Date(event.end);
                        event.allDay = event.type === '4' ? true : false ;
                        event.color = event.type != '' ? colors[event.type] : '#9E9E9E' ;
                        uiCalendarConfig.calendars['myCalendar'].fullCalendar('renderEvent', event, 'stick');
                    });
                })
                .error(function (status, data) {
                    uiCalendarConfig.calendars['myCalendar'].fullCalendar('removeEvents');
                    $rootScope.rootAlerts.push({
                        type:'danger',
                        msg: gettextCatalog.getString('An error occurred, please try again later'),
                        priority: 2
                    });
                });
            });
        }

        $scope.uiConfig = {
            calendar: {
                lang: $window.localStorage.language,
                height: $window.innerHeight - fixHeight,
                editable: false,
                axisFormat: 'HH',
                timeFormat: 'HH:mm',
                allDaySlot : true,
                allDayText: '',
                timezone: 'local',
                header:{
                  left: 'title',
                  center: '',
                  right: ''
                },
                defaultView: 'threeDays',
                views:{
                    month: {
                        titleFormat: 'MMMM'
                    },
                    day: {
                        columnFormat: 'dddd D',
                        titleFormat: 'MMMM'
                    },
                    week: {
                        columnFormat: 'ddd D',
                        titleFormat: 'MMMM'
                    },
                    threeDays: {
                        columnFormat: 'ddd D',
                        titleFormat: 'MMMM',
                        type: 'agenda',
                        duration: { days: 3 },
                        buttonText: '3 day'
                    }
                },
                eventClick: function(event) {
                    $state.go("home.agenda.edit", {id: event._id});
                },
                dayClick: function(date, jsEvent, view) {
                    $state.go("home.agenda.add", {from: date});
                },
                viewRender: function(view, element) {
                    from = view.start._d;
                    to = view.end._d;
                    getEventsFromTo();
                    if($stateParams.goto && $stateParams.goto !== "" && new Date($stateParams.goto) > new Date(1900,0,1)){
                        uiCalendarConfig.calendars['myCalendar'].fullCalendar('gotoDate', new Date($stateParams.goto));
                        $stateParams.goto = null;
                    }
                } 
            }
        };

        $scope.changeView = function(view) {
            $scope.view = view;
            uiCalendarConfig.calendars['myCalendar'].fullCalendar('changeView', view);
        };

        $scope.add = function() {
            $state.go("home.agenda.add", {from: uiCalendarConfig.calendars['myCalendar'].fullCalendar('getView').start._d});
        };

        $scope.method = function(method) {
            uiCalendarConfig.calendars['myCalendar'].fullCalendar(method);
        };

        $(window).on("resize.doResize", function (){
            $scope.$apply(function(){
               uiCalendarConfig.calendars['myCalendar'].fullCalendar('option', 'height', $window.innerHeight - fixHeight);
            });
        });

        $scope.$on("$destroy", function (){
             $(window).off("resize.doResize");
        });
    });
});