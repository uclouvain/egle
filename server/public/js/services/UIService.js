angular.module('UIService', []).factory('UI', function($http) {
    return {
        nav: function(){
            return $http.get("/api/ui/nav");
        },
        
        cards: function(){
            return $http.get("/api/ui/cards");
        },
        
        asks: function(){
            return $http.get("/api/ui/asks");
        },
        
        settings: function(){
            return $http.get("/api/ui/cards/settings");
        },
        
        toggleCard: function(card){
            return $http.post("/api/ui/cards/toggle", card);
        },
        
        gotit: function(tip){
            return $http.post("/api/ui/apptips", tip);
        },
        
        verifyAppTip: function(tip){
            return $http.get("/api/ui/apptips/" + tip.name);
        },
        
        audit: function(audit){
            return $http.post("/api/ui/audit", audit);
        },
        
        todo: function(){
            return $http.get("/api/ui/todo");
        }
    }
});