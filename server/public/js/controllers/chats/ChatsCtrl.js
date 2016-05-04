angular.module('ChatsCtrl', []).controller('ChatsController', function($scope, $state, $window, gettextCatalog, $ocLazyLoad, $injector, ModalService) {
    $ocLazyLoad.load('js/services/ChatService.js').then(function() {
        var Chat = $injector.get('Chat');
        
        $ocLazyLoad.load('js/services/ContactService.js').then(function() {
            var Contact = $injector.get('Contact');
            var trick = gettextCatalog.getString('Enter a username');
            $scope.searchText = '';
            $scope.searchHelper = trick;
            $scope.alerts = [];
            $scope.archivedView = false;
            $scope.archivedViewText = gettextCatalog.getString("Archived");
            $scope.titleText = gettextCatalog.getString("All conversations");
            $scope.accountDeleted = gettextCatalog.getString("Deleted account");
            $scope.chatsList = [], $scope.contacts = [], $scope.helperLiving = [], $scope.helperArchived = [];
            $scope.chosenContact = "";
            var refreshInterval;
            var periodChatsList = 2000;
            var helperLiving = {
                title: gettextCatalog.getString("No conversation yet?"),
                text: gettextCatalog.getString("Use the green button to begin one")
            };
            var helperArchived = {
                title: gettextCatalog.getString("Archived conversations appear here")
            };
            
            $scope.in = function () {
                if($scope.searchText.length == 0){
                    $scope.searchHelper = trick;
                }
            }

            $scope.out = function () {
                $scope.searchHelper = "";
            }
            
            function refreshTimer(){
                Chat.getChatsList().then(function(data){
                    if (data.length > 0){
                        // copy the array only where necessary, to avoid angular refresh and a flickering
                        if ( ! angular.equals($scope.chatsList, data)) {
                            if ($scope.chatsList.length != data.length) {
                                // refresh anyway
                                angular.copy(data, $scope.chatsList);
                            } else {
                                // refresh only the modified contents to avoid flickering
                                $scope.chatsList.forEach(function (chat, index) {
                                    angular.copy(data[index], $scope.chatsList[index]);
                                });
                                $('.chatItemOptions.open').dropdown('toggle');
                            }
                        }
                    } else {
                        $scope.chatsList = [];
                    }
                    $ocLazyLoad.load('bower_components/underscore/underscore-min.js').then(function() {
                        var archived = _.where($scope.chatsList, {archived : true});
                        var living = _.where($scope.chatsList, {archived : false});

                        if(archived.length > 0){
                            if($scope.helperArchived.title){
                                $scope.helperArchived = {};
                            }
                        } else {
                            if(!$scope.helperArchived.title){
                                $scope.helperArchived = helperArchived;
                            }
                        }

                        if(living.length > 0){
                            if($scope.helperLiving.title){
                                $scope.helperLiving = {};
                            }
                        } else {
                            if(!$scope.helperLiving.title){
                                $scope.helperLiving = helperLiving;
                            }
                        }
                    });
                });
            }
            
            function refresh() {
                if (typeof (refreshInterval) !== undefined){
                    clearInterval(refreshInterval);
                }
                $scope.chatsList = [];
                refreshTimer();
                refreshInterval = setInterval(function() {
                    refreshTimer();
                }, periodChatsList);
            }
            
            refresh();
            
            
            $scope.toggleView = function(){
                if (!$scope.archivedView) {
                    $scope.titleText = gettextCatalog.getString("All conversations");
                } else {
                    $scope.titleText = gettextCatalog.getString("Archived conversations");
                }
            }
            
            $scope.findUsers = function(){
                $scope.chosenContact = "";
                $scope.contacts = [];
                $scope.searchText = $scope.searchText.toLowerCase().replace(/[^a-zA-Z- àèìòùÀÈÌÒÙáéíóúýÁÉÍÓÚÝâêîôûÂÊÎÔÛãñõÃÑÕäëïöüÿÄËÏÖÜŸçÇßØøÅåÆæœ]+/g, "");
                if($scope.searchText != ''){
                    $scope.searchHelper = "";
                    Contact.searchAccepted({
                        name: $scope.searchText
                    }).success(function(data){
                        for(var i = 0;i < data.length;i++){
                            $scope.contacts.push(data[i]);
                        }
                        if ($scope.contacts.length === 0) {
                            $scope.searchHelper = "";
                            $scope.searchHelper = gettextCatalog.getString("No results for") + " \"" + $scope.searchText + "\"";
                            $scope.contacts = [];
                        }
                    });
                }
                else{
                    if($scope.searchText.length == 0){
                        $scope.searchHelper = trick;
                    }
                }
            };

            $scope.onSelect = function($item, $model, $label){
                $scope.chosenContact = $item.username;
            }

            $scope.toggleArchiveFlag = function(chat){
                var currentFlag = (chat.archived !== undefined) && (chat.archived === true);
                Chat.setArchiveFlag({
                    username : (chat.participantID === undefined) ? chat.username : '_'+chat.participantID,
                    flag : ! currentFlag
                }).success(function(data){
                    if($scope.alerts.length > 0) {
                        $scope.alerts = [];
                    }
                    refresh();
                }).error(function(status, data) {
                    if($scope.alerts.length === 0) {
                        $scope.alerts.push({
                            type: 'danger',
                            msg: gettextCatalog.getString('An error occurred, please try again later'),
                            show: true
                        });
                    }
                });
            }

            $scope.deleteChat = function(chat){
                ModalService.showModal({
                    templateUrl: "templates/modals/deleteChat.html",
                    controller: function($scope, close){
                        $scope.chat = chat;
                        $scope.close = function(result) {
                            close(result, 500); // close, but give 500ms for bootstrap to animate
                        };
                    }
                }).then(function(modal) {
                    modal.element.modal();
                    modal.close.then(function(result) {
                        if(result){
                            Chat.deleteChat({
                                username : (chat.participantID === undefined) ? chat.username : '_' + chat.participantID
                            }).success(function(data){
                                if($scope.alerts.length > 0) {
                                    $scope.alerts = [];
                                }
                                refresh();
                            }).error(function(status, data) {
                                if($scope.alerts.length === 0) {
                                    $scope.alerts.push({
                                        type: 'danger',
                                        msg: gettextCatalog.getString('An error occurred, please try again later'),
                                        show: true
                                    });
                                }
                            });
                        }
                    });
                });
            }

            $scope.$on('$stateChangeStart', function(event) {
                if (typeof (refreshInterval) !== undefined){
                    clearInterval(refreshInterval);
                }
            });
        });
    });
});
