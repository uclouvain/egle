angular.module('ObjectiveCtrl', [[
    'css/templates/dashboard.css'
]])
.controller('ObjectiveController', function($scope, gettextCatalog, $ocLazyLoad, $injector, $stateParams, $state, $rootScope) {
    $ocLazyLoad.load('js/services/ObjectiveService.js').then(function() {
        var Objective = $injector.get('Objective');
        switch($stateParams.card){
            case 'glycaemia':
                $scope.config = {
                    name: 'glycaemia',
                    objective: gettextCatalog.getString("Objective"),
                    title: gettextCatalog.getString("Glycaemia"),
                    unit: 'mg/dl',
                    placeholder: gettextCatalog.getString("Value"),
                    values: [
                        {name: gettextCatalog.getString("Min"), type: 'min'},
                        {name: gettextCatalog.getString("Max"), type: 'max'}
                    ]
                };
            break;
            case 'insulin':
                $scope.config = {
                    name: 'insulin',
                    objective: gettextCatalog.getString("Schema"),
                    title: gettextCatalog.getString("Insulin"),
                    types: [
                        {name: gettextCatalog.getString('Short') + " (2-5h)", value: 'short'},
                        {name: gettextCatalog.getString('Rapid') + " (5-7h)", value: 'rapid'},
                        {name: gettextCatalog.getString('Mixed') + " (10-12h)", value: 'mixed'},
                        {name: gettextCatalog.getString('Intermediate') + " (10-12h)", value: 'intermediate'},
                        {name: gettextCatalog.getString('Long') + " (24h)", value: 'long'}
                    ],
                    values: [
                        {name: gettextCatalog.getString('Morning'), when:'morning'},
                        {name: gettextCatalog.getString('Midday'), when: 'midday'},
                        {name: gettextCatalog.getString('Evening'), when:'evening'},
                        {name: gettextCatalog.getString('Bedtime'), when:'bedtime'}
                    ]
                };
            break;
            case 'sport':
                $scope.config = {
                    name: 'sport',
                    objective: gettextCatalog.getString("Objective"),
                    title: gettextCatalog.getString("Sport"),
                    unit: gettextCatalog.getString("h/week"),
                    value : {name: gettextCatalog.getString("Duration"), value: ''},
                    placeholder: gettextCatalog.getString("Value"),
                };
            break;
            case 'weight':
                $scope.config = {
                    name: 'weight',
                    objective: gettextCatalog.getString("Objective"),
                    title: gettextCatalog.getString("Weight"),
                    unit: 'kg',
                    value : {name: gettextCatalog.getString("Weight"), value: ''},
                    placeholder: gettextCatalog.getString("Value")
                };
            break;
            case 'meal':
                $scope.config = {
                    name: 'meal',
                    objective: gettextCatalog.getString("Monitoring"),
                    title: gettextCatalog.getString("Meal"),
                    help: gettextCatalog.getString("The feature Diet Monitoring helps you to eat well")
                };
            break;
        }
        

        Objective.read({type:$scope.config.name}).success(function(data){
            if (data) {
                $scope.config.id = data._id;
                switch($stateParams.card){
                    case 'insulin':
                        for(i=0;i<data.values.length;i++){
                            for(j=0;j<$scope.config.values.length;j++){
                                if(data.values[i].subType === $scope.config.values[j].when){
                                    $scope.config.values[j].type = data.values[i].type;
                                    $scope.config.values[j].value = data.values[i].value;
                                }
                            }
                        }
                    break;
                    case 'glycaemia':
                        for(i=0;i<data.values.length;i++){
                            for(j=0;j<$scope.config.values.length;j++){
                                if(data.values[i].type === $scope.config.values[j].type){
                                    $scope.config.values[j].value = data.values[j].value;
                                }
                            }
                        }
                    break;
                    case 'meal':
                        $scope.position = true;
                    break;
                    default:
                        $scope.config.value.value = data.values[0].value;
                    break;
                }
            }
        }).error(function(status, data) {
            $rootScope.rootAlerts.push({
                type:'danger',
                msg: gettextCatalog.getString('An error occurred, please try again later'),
                priority: 2
            });
        });
        
        $scope.verify = function(){
            var ok = true;
            var count = 0;
            
            switch($stateParams.card){
                case 'insulin':
                    for(i=0;i<$scope.config.values.length;i++){
                        if(!$scope.config.values[i].value){
                            count++;
                        }
                        if($scope.config.values[i].value && !$scope.config.values[i].type){
                            ok = false;
                        }
                        if(!$scope.config.values[i].value && $scope.config.values[i].type){
                            ok = false;
                        }
                        if(count == $scope.config.values.length){
                            ok = false;
                        }
                    }
                break;
                case 'glycaemia':
                    if(!$scope.config.values[0].value || !$scope.config.values[1].value){
                        ok = false;
                    }
                break;
                case 'meal':
                break;
                default:
                    if(!$scope.config.value.value){
                        ok = false;
                    }
                break;
            }
            return ok;
        }
        
        $scope.deleteObjective = function(){
            Objective.delete({id: $scope.config.id}).success(function(data){
                $state.go("home.dashboard.main");
            }).error(function(status, data) {
                $rootScope.rootAlerts.push({
                    type:'danger',
                    msg: gettextCatalog.getString('An error occurred, please try again later'),
                    priority: 2
                });
            });
        }
        
        
        $scope.setObjective = function(){
            var toSend = {
                objective: {
                    type : $scope.config.name,
                    values : []
                }
            };
            
            var values = [];
            if($stateParams.card === 'glycaemia' && $scope.config.values[0].value > $scope.config.values[1].value){
                $rootScope.rootAlerts.push({
                    type:'warning',
                    msg: gettextCatalog.getString("The minimum cannot be larger than the maximum"),
                    priority: 3
                });
            } else {
                switch($stateParams.card){
                    case 'insulin':
                        for(i=0;i<$scope.config.values.length;i++){
                            if($scope.config.values[i].value){
                                values.push({value: $scope.config.values[i].value, type: $scope.config.values[i].type, subType: $scope.config.values[i].when});
                            }
                        }
                    break;
                    case 'glycaemia':
                        for(i=0;i<$scope.config.values.length;i++){
                            if($scope.config.values[i].value){
                                values.push({value: $scope.config.values[i].value, type: $scope.config.values[i].type});
                            }
                        }
                    break;
                    case 'meal':
                        if($scope.position){
                            values.push({value: 1});
                        } else {
                            if($scope.config.id){
                                Objective.delete({id: $scope.config.id}).success(function(data){
                                    $state.go("home.dashboard.main");
                                }).error(function(status, data) {
                                    $rootScope.rootAlerts.push({
                                        type:'danger',
                                        msg: gettextCatalog.getString('An error occurred, please try again later'),
                                        priority: 2
                                    });
                                });
                            }
                        }
                    break;
                    default:
                        values.push({value: $scope.config.value.value});
                    break;
                }
                
                toSend.objective.values = values;
                if($scope.config.id){
                    toSend.objective._id = $scope.config.id;
                }
                if(toSend.objective.values.length > 0){
                    Objective.createOrUpdate(toSend).success(function(data){
                        $state.go("home.dashboard.main");
                    }).error(function(status, data) {
                        $rootScope.rootAlerts.push({
                            type:'danger',
                            msg: gettextCatalog.getString('An error occurred, please try again later'),
                            priority: 2
                        });
                    });
                } else {
                    $state.go("home.dashboard.main");
                }
            }
        }
    });
});