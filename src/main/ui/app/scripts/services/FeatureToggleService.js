/**
 * Copyright (c) Greater London Authority, 2016.
 *
 * This source code is licensed under the Open Government Licence 3.0.
 *
 * http://www.nationalarchives.gov.uk/doc/open-government-licence/version/3/
 */

FeatureToggleService.$inject = ['$http', 'config'];

function FeatureToggleService($http, config) {
  return {

    /**
     * Checks feature toggle.
     * @param {String} feature - name of the feature like 'projects' or 'outputCSV'
     * @returns {Object} promise
     */
    isFeatureEnabled: function (feature) {
      return $http({
        url: `${config.basePath}/features/${feature}`,
        method: 'GET'
      });
    }

  }
}

angular.module('GLA')
  .service('FeatureToggleService', FeatureToggleService);