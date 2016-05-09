/*
 * The copyright in this software is being made available under MIT License 
 * MIT License, included below. This software may be subject to other third 
 * party and contributor rights, including patent rights, and no such rights
 * are granted under this license.
 *
 * Copyright (c) 2014-2016, Universite catholique de Louvain (UCL), Belgium
 * Copyright (c) 2014-2016, Professor Benoit Macq
 * Copyright (c) 2014-2016, Aissa Ghouti
 * All rights reserved.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

angular.module('ContactsCtrl', [[
    'css/templates/dashboard.css',
]]).controller('ContactsController', function($scope, $state, gettextCatalog, $ocLazyLoad, $injector, ModalService) {
    $ocLazyLoad.load('js/services/ContactService.js').then(function() {
        var Contact = $injector.get('Contact');
        var trick = gettextCatalog.getString('Enter a username');
        var helper = {
            title: gettextCatalog.getString("No contact yet?"),
            text: gettextCatalog.getString("Use the input above to find one")
        };
        $scope.accepted = [], $scope.contacts = [], $scope.helper = [];
        $scope.chosenContact = "";
        $scope.addMode = false;
        $scope.searchHelper = trick;
        $scope.searchText = '';

        $scope.in = function () {
            if($scope.searchText.length == 0){
                $scope.searchHelper = trick;
            }
        }

        $scope.out = function () {
            $scope.searchHelper = "";
        }

        function getMyContacts(){
            $scope.helper = [];
            Contact.accepted().success(function(data1){
                $scope.accepted = data1;
                Contact.sent().success(function(data2){
                    $scope.sent = data2;
                    Contact.received().success(function(data3){
                        if((data1.length == 0 && data2.length == 0 && data3.length == 0) && $scope.helper.length == 0)
                            $scope.helper = helper;
                        $scope.received = data3;
                    }).error(function(status, data3) {
                        $rootScope.rootAlerts.push({
                            type:'danger',
                            msg: gettextCatalog.getString('An error occurred, please try again later'),
                            priority: 2
                        });
                    });
                }).error(function(status, data2) {
                    $rootScope.rootAlerts.push({
                        type:'danger',
                        msg: gettextCatalog.getString('An error occurred, please try again later'),
                        priority: 2
                    });
                });
            }).error(function(status, data1) {
                $rootScope.rootAlerts.push({
                    type:'danger',
                    msg: gettextCatalog.getString('An error occurred, please try again later'),
                    priority: 2
                });
            });
        }
        getMyContacts();

        $scope.findContacts = function(){
            $scope.helper = [];
            $scope.chosenContact = "";
            $scope.contacts = [];
            $scope.searchText = $scope.searchText.toLowerCase().replace(/[^a-zA-Z- àèìòùÀÈÌÒÙáéíóúýÁÉÍÓÚÝâêîôûÂÊÎÔÛãñõÃÑÕäëïöüÿÄËÏÖÜŸçÇßØøÅåÆæœ]+/g, "");
            if($scope.searchText != ''){
                $scope.searchHelper = "";
                Contact.search({
                    name: $scope.searchText
                }).success(function(data){
                    for(var i = 0;i < data.length;i++){
                        for(var j=0; j<$scope.accepted.length; j++){
                            if($scope.accepted[j].username == data[i].username)
                                data[i].duplicates = true;
                        }
                        for(var j=0; j<$scope.received.length; j++){
                            if($scope.received[j].username == data[i].username)
                                data[i].duplicates = true;
                        }
                        for(var j=0; j<$scope.sent.length; j++){
                            if($scope.sent[j].username == data[i].username)
                                data[i].duplicates = true;
                        }
                        if(!data[i].duplicates){
                            $scope.contacts.push(data[i]);
                        }
                    }
                    if ($scope.contacts.length === 0) {
                        $scope.searchHelper = "";
                        $scope.searchHelper = gettextCatalog.getString("No results for") + " \"" + $scope.searchText + "\"";
                        $scope.contacts = [];
                    }
                }).error(function(status, data) {
                    $rootScope.rootAlerts.push({
                        type:'danger',
                        msg: gettextCatalog.getString('An error occurred, please try again later'),
                        priority: 2
                    });
                });
            }
            else{
                if($scope.searchText.length == 0){
                    $scope.searchHelper = trick;
                }
                if($scope.accepted.length === 0 && $scope.received.length === 0 && $scope.sent.length === 0 && $scope.helper.length == 0){
                    $scope.helper = helper;
                }
            }
        };

        $scope.onSelect = function($item, $model, $label){
            $scope.chosenContact = $item.username;   
        }

        function updateContact(username, status){
            Contact.update({
                username : username,
                status: status
            }).success(function(data){
                if(status == "0"){
                    $scope.contact = "";
                    $('#new').modal('hide');
                }
                getMyContacts();
            }).error(function(status, data) {
                $rootScope.rootAlerts.push({
                    type:'danger',
                    msg: gettextCatalog.getString('An error occurred, please try again later'),
                    priority: 2
                });
            });
        }

        function deleteContact(username){
            Contact.delete({
                username : username
            }).success(function(data){
                getMyContacts();
            }).error(function(status, data) {
                $rootScope.rootAlerts.push({
                    type:'danger',
                    msg: gettextCatalog.getString('An error occurred, please try again later'),
                    priority: 2
                });
            });
        }
        
        
        $scope.deleteContact = function(contact){
            ModalService.showModal({
                templateUrl: "templates/modals/deleteContact.html",
                controller: function($scope, close){
                    $scope.contact = contact;
                    $scope.close = function(result) {
                        close(result, 500); // close, but give 500ms for bootstrap to animate
                    };
                }
            }).then(function(modal) {
                modal.element.modal();
                modal.close.then(function(result) {
                    if(result){
                        deleteContact(contact.username);
                    }
                });
            });
        }
        
        $scope.sendRequest = function(username){
            updateContact(username, "0");
            $state.go("home.contacts.main");
        }

        $scope.acceptRequest = function(contact){
            updateContact(contact.username, "1");
        }

        $scope.declineRequest = function(contact){
            updateContact(contact.username, "2");
        }

        $scope.cancelRequest = function(contact){
            deleteContact(contact.username);
        }

        $scope.cancelAdd = function(){
            $scope.contact = "";
        }
    });
});
