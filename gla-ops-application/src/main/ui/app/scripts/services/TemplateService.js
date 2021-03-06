/**
 * Copyright (c) Greater London Authority, 2016.
 *
 * This source code is licensed under the Open Government Licence 3.0.
 *
 * http://www.nationalarchives.gov.uk/doc/open-government-licence/version/3/
 */

TemplateService.$inject = ['$resource', '$http', 'config', 'CacheFactory', '$rootScope'];
const TEMPLATE_CACHE_NAME = 'templateCache';
function TemplateService($resource, $http, config, CacheFactory, $rootScope) {

  return {

    getCache(){
      let cache = CacheFactory.get(TEMPLATE_CACHE_NAME);
      if (!cache && $rootScope.envVars['http-cache-max-age'] != null) {
        cache = CacheFactory(TEMPLATE_CACHE_NAME, {
          maxAge: $rootScope.envVars['http-cache-max-age'] * 1000,
          deleteOnExpire: 'aggressive'
        })
      }
      return cache;
    },

    /**
     * Retrieve all available templates
     */
    getAllProjectTemplates: function (includeProgrammes) {
      return $http({
        url: config.basePath + '/templates',
        method: 'GET',
        params: {
          includeProgrammes: includeProgrammes
        }
      });
    },

    /**
     * Retrieve all available templates summaries
     */
    getAllProjectTemplateSummaries(page, programmeText, templateText, selectedTemplateStatuses) {
      let cfg = {
        params: {
          programmeText: programmeText,
          templateText: templateText,
          selectedTemplateStatuses: selectedTemplateStatuses,
          page: page,
          size: 50,
          sort: 'id,asc'
        }
      };

      return $http.get(`${config.basePath}/templates/summary`, cfg)
    },


    /**
     * Retrieve list of all templates by programme
     * @returns {Object} promise
     */
    getTemplateByProgramme: function (programmeId) {
      return $resource(`${config.basePath}/templates`)
        .query({
          programmeId: programmeId
        })
        .$promise;
    },

    /**
     * Retrieve template by id
     * @param {Number} id - template id
     * @return {Object} promise
     */
    getTemplate(id, sanitise, cache) {
      if(!cache && this.getCache()){
        this.getCache().removeAll();
      }
      return $http.get(`${config.basePath}/templates/${id}`, {
        cache: this.getCache(),
        params: {
          sanitise: sanitise
        }
      });
    },
    /**
     * Retrieve draft template by id
     * @param {Number} id - template id
     * @return {Object} promise
     */
    getDraftTemplate: function (id) {
      return $http({
        url: config.basePath + '/templates/' + id,
        method: 'GET',
        params: {
          sanitise: false,
          jsonclob: true
        }
      });
    },
    /**
     * create draft template
     */
    createTemplate: function (jsonString) {
      return $http({
        url: config.basePath + '/templates/draft',
        method: 'POST',
        data: jsonString
      });
    },
    /**
     * update draft template
     */
    updateTemplate: function (id, jsonString) {
      return $http({
        url: config.basePath + '/templates/draft/' + id,
        method: 'PUT',
        data: jsonString
      });
    },
    /**
     * Retrieve available deliverable types
     * @param {Number} id - template id
     * @return {Object} promise
     */
    getAvailableDeliverableTypes: function (id) {
      return $http({
        url: config.basePath + '/templates/' + id + '/deliverableTypes',
        method: 'GET'
      });
    },
    getBlockConfig(template, block){
      return _.find(template.blocksEnabled, {block: block.blockType});
    }
  }
}

angular.module('GLA')
  .service('TemplateService', TemplateService);
