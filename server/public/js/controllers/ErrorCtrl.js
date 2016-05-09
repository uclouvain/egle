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

angular.module('ErrorCtrl', []).controller('ErrorController', function($scope, $state, $stateParams, gettextCatalog) {
    if($stateParams.status != ""){
        switch($stateParams.status){
            case '403':
                $scope.title = gettextCatalog.getString("Sorry, this content isn't available right now");
                $scope.content = gettextCatalog.getString("The link you followed may have expired, or the page may only be visible to an audience you're not in.");
            break;
            default:
                $scope.title = gettextCatalog.getString("Sorry, this page isn't available");
                $scope.content = gettextCatalog.getString("The link you followed may be broken, or the page may have been removed.");
            break;
        }
    }
    else{
        $state.go("error", {status: '404'});
    }
});