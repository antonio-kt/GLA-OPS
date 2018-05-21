/**
 * Copyright (c) Greater London Authority, 2016.
 *
 * This source code is licensed under the Open Government Licence 3.0.
 *
 * http://www.nationalarchives.gov.uk/doc/open-government-licence/version/3/
 */

'use strict';

HomeCtrl.$inject = ['$scope', '$state', '$log', 'ConfigurationService', 'UserService', '$rootScope', '$location'];

function HomeCtrl($scope, $state, $log, ConfigurationService, UserService, $rootScope, $location) {
  if (UserService.currentUser().loggedOn) {
    UserService.logout();
  }
  var ctrl = this;

  $rootScope.showGlobalLoadingMask = false;


  ctrl.resetAutoFill = function () {
    this.isAutoFilled = false;
  };

  ctrl.onAutoFill = function () {
    this.isAutoFilled = true;
  };


  this.showReasonSuccess = $state.params.reasonSuccess;
  this.showReasonError = $state.params.reasonError;

  ctrl.error = false;

  ctrl.submit = function () {
    $rootScope.showGlobalLoadingMask = true;
    UserService.login(ctrl.uname, ctrl.pass).then(function (user) {
        ctrl.error = false;

        if ($rootScope.redirectURL) {
          console.log('redirectURL', $rootScope.redirectURL)
          $location.url($rootScope.redirectURL);
        } else if (user.data.primaryRole === 'Admin') {
          $state.go('projects');
        } else {
          $state.go('user');
        }
        $rootScope.redirectURL = null;
      }, function (err) {
        ctrl.error = true;
        $rootScope.showGlobalLoadingMask = false;
        $log.error(err);
      }
    );
  };

  $scope.data = {
    message: 'Coming soon!'
  };

  this.clearErrors = function () {
    ctrl.error = false;
  };

  ConfigurationService.comingSoonMessage().then(function (response) {
    $scope.data.message = response.data.text;
  });
}

angular.module('GLA')
  .controller('HomeCtrl', HomeCtrl);