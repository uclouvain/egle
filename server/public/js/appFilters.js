angular.module('datetimeFilters', [])
.filter('dMMMM', function(gettextCatalog, $window) {
    var months = new Array(gettextCatalog.getString("January"),
                          gettextCatalog.getString("February"),
                          gettextCatalog.getString("March"), 
                          gettextCatalog.getString("April"), 
                          gettextCatalog.getString("May"), 
                          gettextCatalog.getString("June"), 
                          gettextCatalog.getString("July"), 
                          gettextCatalog.getString("August"), 
                          gettextCatalog.getString("September"), 
                          gettextCatalog.getString("October"), 
                          gettextCatalog.getString("November"), 
                          gettextCatalog.getString("December"));
    return function (str) {
        var toReturn = '';
        if($window.localStorage.language == 'FR'){
            toReturn =  stringToDate(str).getDate() + ' ' + months[stringToDate(str).getMonth()];
        } else {
            toReturn =  months[stringToDate(str).getMonth()] + ' ' + stringToDate(str).getDate();
        }
        return toReturn;
    }
})
.filter('ddMMyyyy', function() {
    return function (str) {
        return addZero(stringToDate(str).getDate()) + '/' + addZero(stringToDate(str).getMonth()+1) + '/' + addZero(stringToDate(str).getFullYear());
    }
})
.filter('HHmm', function() {
    return function (received) {
        return HHmm(received);
    }
})
.filter('smartDatetime', function(gettextCatalog,$window){
    return function (datetime) {
        var now = new Date;
        datetime = stringToDate(datetime);

        if((datetime.getDate() == now.getDate()) && (datetime.getMonth() == now.getMonth()) && (datetime.getFullYear() == now.getFullYear())) {
            return HHmm(datetime);
        } else if((datetime.getDate()+1 == now.getDate()) && (datetime.getMonth() == now.getMonth()) && (datetime.getFullYear() == now.getFullYear())) {
            return gettextCatalog.getString("Yesterday");
        } else if((now.getDate()-7 < datetime.getDate()) && (datetime.getMonth() == now.getMonth()) && (datetime.getFullYear() == now.getFullYear())) {
            var weekDays = new Array(gettextCatalog.getString("Sunday"), 
                            gettextCatalog.getString("Monday"), 
                            gettextCatalog.getString("Tuesday"), 
                            gettextCatalog.getString("Wednesday"), 
                            gettextCatalog.getString("Thursday"), 
                            gettextCatalog.getString("Friday"), 
                            gettextCatalog.getString("Saturday"));
            return weekDays[datetime.getDay()];
        } else {
            var months = new Array(gettextCatalog.getString("January"),
                          gettextCatalog.getString("February"),
                          gettextCatalog.getString("March"), 
                          gettextCatalog.getString("April"), 
                          gettextCatalog.getString("May"), 
                          gettextCatalog.getString("June"), 
                          gettextCatalog.getString("July"), 
                          gettextCatalog.getString("August"), 
                          gettextCatalog.getString("September"), 
                          gettextCatalog.getString("October"), 
                          gettextCatalog.getString("November"), 
                          gettextCatalog.getString("December"));
            
            var toReturn = '';
            if($window.localStorage.language == 'FR'){
                toReturn = datetime.getDate() + ' ' + months[datetime.getMonth()];
            } else {
                toReturn = months[datetime.getMonth()] + ' ' + datetime.getDate();
            }
            return toReturn;
        }
    }
});


angular.module('limitFilters', [])
.filter('limitMessage', function() {
    return function (str) {
        if(str.length > 27){
            str = str.substr(0, 24) + "...";
        }
        return str;
    }
})
.filter('limitSender', function() {
    return function (str) {
        var counter = "";
        if(str.length > 19){
            counter = str.substring(str.indexOf("("), str.indexOf(")")+1);
            str = str.substr(0, 16) + "...";
        }
        str = str + counter;
        return str;
    }
})
.filter('limiNotification', function() {
    return function (str) {
        if(str.length > 63){
            str = str.substr(0, 60) + "...";
        }
        return str;
    }
})


angular.module('mappingFilters', [])
.filter('gender', function(gettextCatalog) {
    return function (gender) {
        var toReturn = gettextCatalog.getString("unknown");
        switch(gender){
            case '1':
                toReturn = gettextCatalog.getString("Male");
            break;
            case '2':
                toReturn = gettextCatalog.getString("Female");
            break;
        }
        return toReturn;
    }
})
.filter('role', function(gettextCatalog) {
    return function (role) {
        var toReturn = gettextCatalog.getString("unknown");
        switch(role){
            case '2':
                toReturn = gettextCatalog.getString("Caregiver");
            break;
            case '3':
                toReturn = gettextCatalog.getString("Patient");
            break;
        }
        return toReturn;
    }
})
.filter('condition', function(gettextCatalog) {
    return function (condition) {
        var toReturn = gettextCatalog.getString("unknown");
        switch(condition){
            case 'a':
                toReturn = gettextCatalog.getString("Alzheimer's Disease");
            break;
            case 'd1':
                toReturn = gettextCatalog.getString("Diabetes Type 1");
            break;
            case 'd2':
                toReturn = gettextCatalog.getString("Diabetes Type 2");
            break;
        }
        return toReturn;
    }
})
.filter('unknown', function(gettextCatalog) {
    return function (str) {
        var toReturn = str;
        if(toReturn === undefined || toReturn == " " || toReturn == ""){
            toReturn = gettextCatalog.getString("unknown");
        }
        return toReturn;
    }
})
.filter('phone', function(gettextCatalog) {
    return function (phone) {
        var toReturn = "";
        if(phone !== undefined && phone.length == 9){
            toReturn = phone.substr(0,3) + " " + phone.substr(3,2) + " " + phone.substr(5,2) + " " + phone.substr(7,2);
        } else if(phone !== undefined && phone.length == 10){
            toReturn = phone.substr(0,4) + " " + phone.substr(4,2) + " " + phone.substr(6,2) + " " + phone.substr(8,2);
        } else if(phone === undefined){
            toReturn = gettextCatalog.getString("unknown");
        } else {
            toReturn = phone;
        }
        return toReturn;
    }
})
.filter('html', function ($sce) { 
    return function (text) {
        return $sce.trustAsHtml(text);
    };
});


function HHmm(received){
    if(typeof received == 'string'){
        received = stringToDate(received);
    }
    //UTC
    received = new Date(received.getTime() - received.getTimezoneOffset() * 60000);
    var h = addZero(received.getHours());
    var m = addZero(received.getMinutes());
    return h + ":" + m;
}

function stringToDate(str){
    var a = str.split(/[^0-9]/);
    return new Date (a[0],a[1]-1,a[2],a[3],a[4],a[5] );
}

function addZero(str){
    str = str.toString();
    if(str.length == 1){
        str = "0" + str;
    }
    return str;
}