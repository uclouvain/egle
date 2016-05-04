angular.module('EventCtrl', [[
    'bower_components/pickadate/lib/themes/classic.css',
    'bower_components/pickadate/lib/themes/classic.date.css',
    'bower_components/pickadate/lib/themes/classic.time.css'
]]).controller('EventController', function ($scope, gettextCatalog, $ocLazyLoad, $injector, $stateParams, $state, $rootScope) {
    $scope.myEvent = {
        title: '',
        startDate: '',
        endDate: '',
        type: '',
        where: {
            place: '',
            latitude: '',
            longitude: ''
        },
        intensity: ''
    };
    
    $scope.typesList = [
        {name:gettextCatalog.getString('Health-related'), value:'0'},
        {name:gettextCatalog.getString('Professional'), value:'1'},
        {name:gettextCatalog.getString('Personal'), value:'2'},
        {name:gettextCatalog.getString('Sport'), value:'3'},
        {name:gettextCatalog.getString('Vacation'), value:'4'}
    ];

    var validatedByGoogleMaps = false;
    
    // Check if input type 'date' is supported by the current browsers
    $scope.checkDateInput = function () {
        var input = document.createElement('input');
        input.setAttribute('type','date');
        var notADateValue = 'not-a-date';
        input.setAttribute('value', notADateValue); 
        return !(input.value === notADateValue);
    }
    
    function mergeDatetime(myDate, myTime){
        return new Date(myDate.getFullYear(), myDate.getMonth(), myDate.getDate(), myTime.getHours(), myTime.getMinutes(), myTime.getSeconds());
    }
    
    function roundTime(aTime){
        aTime.setMinutes((Math.round(aTime.getMinutes()/15) * 15) % 60);
        return new Date(aTime);
    }
    
    function manageEvent(form) {
         if (form.title !== undefined && form.startDate !== undefined && form.endDate !== undefined && form.type !== undefined ) {
             var start = mergeDatetime($scope.myEvent.startDate, $scope.myEvent.startTime);
             var end = mergeDatetime($scope.myEvent.endDate, $scope.myEvent.endTime);
             
             if(start < end) {
                 var theEvent = {
                     event_id: $scope.myEvent._id,
                     title: $scope.myEvent.title,
                     startDate: start,
                     endDate: end,
                     type: $scope.myEvent.type,
                     where: $scope.myEvent.where
                 };
                 
                 if(form._id) {
                     theEvent.event_id = form._id;
                 }
                 
                 if($scope.myEvent.type == '3') {
                     theEvent.datetimeAcquisition = start;
                     theEvent.value = Math.abs(start - end) / 36e5;
                     theEvent.values = [{type: 'intensity', value: $scope.myEvent.intensity}];
                 }
                 
                 $ocLazyLoad.load('js/services/EventService.js').then(function () {
                     var Event = $injector.get('Event');
                     Event.create(theEvent).success(function(data) {
                         $state.go("home.agenda.main", {goto: end});
                     }).error(function(status, data) {
                        $rootScope.rootAlerts.push({
                            type:'danger',
                            msg: gettextCatalog.getString('An error occurred, please try again later'),
                            priority: 2
                        });
                     });
                 });
             } else {
                 $rootScope.rootAlerts.push({
                     type:'warning',
                     msg: gettextCatalog.getString('You cannot create an event that ends before it starts'),
                     priority: 3
                 });
             } 
         } else {
             $rootScope.rootAlerts.push({
                 type:'warning',
                 msg: gettextCatalog.getString('Please, fill out the form correctly'),
                 priority: 3
             });
         }
    }
    
    $scope.$watch('myEvent.where.place', function(newVal, oldVal) {
        if(!validatedByGoogleMaps && oldVal !== ""){
                $scope.maps = [];
                $scope.markers = [];
                $scope.myEvent.where.latitude = "";
                $scope.myEvent.where.longitude = "";
        } else {
            validatedByGoogleMaps = false;
        }
    });
    
    var counter = 0;
    $scope.$watch('myEvent.startDate', function(newVal, oldVal) {
        if(counter < 2 && $stateParams.id !== undefined){
            counter++;
        } else {
            $scope.myEvent.endDate = $scope.myEvent.startDate;
        }
    });
    
    $scope.placeChanged = function() {
        validatedByGoogleMaps = true;
        var place = this.getPlace();
        var position = {
            lat: place.geometry.location.lat(),
            lng: place.geometry.location.lng()
        };
        $scope.maps = [position];
        $scope.markers = [position];
        $scope.myEvent.where.latitude = position.lat;
        $scope.myEvent.where.longitude = position.lng;
    }

    if($stateParams.id && $stateParams.id !== "") {
        $scope.mode = {
            title: gettextCatalog.getString("Event details"),
            button: gettextCatalog.getString("Save")
        };

        //get event data
        $ocLazyLoad.load('js/services/EventService.js').then(function () {
            var Event = $injector.get('Event');
            Event.list({
                event_id: $stateParams.id
            }).success(function(event) {
                $scope.myEvent._id = event._id;
                $scope.myEvent.title = event.title;
                $scope.myEvent.startDate = new Date(event.start);
                $scope.myEvent.startTime = new Date(event.start);
                $scope.myEvent.endDate = new Date(event.end);
                $scope.myEvent.endTime = new Date(event.end);
                $scope.myEvent.where.place = event.where.place;
                $scope.myEvent.where.latitude = event.where.latitude;
                $scope.myEvent.where.longitude = event.where.longitude;
                if(event.where.latitude !== '' && event.where.longitude !== ''){
                    var position = {
                        lat: $scope.myEvent.where.latitude,
                        lng: $scope.myEvent.where.longitude
                    };
                    $scope.maps = [position];
                    $scope.markers = [position];
                }
                $scope.myEvent.type = event.type;
                if(event.intensity){
                    $scope.myEvent.intensity = event.intensity;
                }
            }).error(function (status, data) {
                $rootScope.rootAlerts.push({
                    type:'danger',
                    msg: gettextCatalog.getString('An error occurred, please try again later'),
                    priority: 2
                });
                $state.go("home.agenda.main");
            });
        });

        //Update an event
        $scope.manageEvent = function update(form) {
            manageEvent(form);
        }

        //Delete an event
        $scope.deleteEvent = function() {
            $ocLazyLoad.load('js/services/EventService.js').then(function () {
                var Event = $injector.get('Event');
                Event.delete({
                    event_id : $stateParams.id
                }).success(function (data) {
                    $state.go("home.agenda.main");
                    $rootScope.rootAlerts.push({
                         type:'success',
                         msg: gettextCatalog.getString('The event has been deleted'),
                         priority: 4
                     });
                }).error(function (status, data) {
                    $rootScope.rootAlerts.push({
                        type:'danger',
                        msg: gettextCatalog.getString('An error occurred, please try again later'),
                        priority: 2
                    });
                });
            });
        }
    } else {
        $scope.mode = {
            title: gettextCatalog.getString("New event"),
            button: gettextCatalog.getString("Create")
        };
        
        if ($stateParams.from && $stateParams.from !== "") {
            $scope.myEvent.startDate = $stateParams.from;
            $scope.myEvent.endDate = $stateParams.from;
        } else {
            $scope.myEvent.startDate = new Date();
            $scope.myEvent.endDate = new Date();
        }
        $scope.myEvent.startTime = roundTime(new Date());
        $scope.myEvent.endTime = roundTime(new Date());
        $scope.myEvent.endTime.setHours($scope.myEvent.endTime.getHours() + 2);

        $scope.myEvent.startTime = new Date(new Date($scope.myEvent.startTime.setSeconds(0)).setMilliseconds(0));
        $scope.myEvent.endTime = new Date(new Date($scope.myEvent.endTime.setSeconds(0)).setMilliseconds(0));
        
        //Add an event
        $scope.manageEvent = function add(form) {
            manageEvent(form);
        }
    }
});