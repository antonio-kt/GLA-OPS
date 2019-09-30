/**
 * Copyright (c) Greater London Authority, 2016.
 *
 * This source code is licensed under the Open Government Licence 3.0.
 *
 * http://www.nationalarchives.gov.uk/doc/open-government-licence/version/3/
 */

import ProjectBlockCtrl from '../ProjectBlockCtrl';
import './profiled-unit-table/profiledUnitTable';

class UnitsCtrl extends ProjectBlockCtrl {
  constructor($state, $log, ProjectService, ProjectBlockService, moment, project, $injector, unitsMetadata, UnitsService){
    super($injector);

    this.$state = $state;
    this.$log = $log;
    this.ProjectService = ProjectService;
    this.ProjectBlockService = ProjectBlockService;
    this.UnitsService = UnitsService;

    this.unitsMetadata = unitsMetadata;
    this.moment = moment;
  }

  $onInit() {
    super.$onInit();
    this.init();
  }

  updateValidationMessages() {
    const messages = this.blockData.validationFailures;
  }

  init(data){
    let summaryTiles = [];

    this.blockData = this.projectBlock;

    _.forEach(this.blockData.tenureProfiles.breakdown, (tenure) => {

      summaryTiles.push({
        name: tenure.tenureName,
        items: [{
          itemName: 'Profiled Units',
          itemValue: tenure.profiledUnits,
          displayWarn: (tenure.profiledUnits != tenure.totalUnits)
        },{
          itemName: 'Total Units',
          itemValue: tenure.totalUnits,
        }]
      });
    });

    this.summaryTiles = summaryTiles;

    this.tenureIdToName = this.unitsMetadata.tenureDetails.reduce((idToName, item)=>{
      idToName[item.externalId] = item;
      return idToName;
    }, {});

    this.tableEntries = (this.projectBlock.tableEntries || []).map(item => {
      this.UnitsService.enrichTableEntry(item, this.tenureIdToName);
      return item;
    });

    this.filteredRentUnits = _.filter(this.tableEntries, {type: 'Rent'});
    this.filteredSalesUnits = _.filter(this.tableEntries, {type: 'Sales'});

    this.hasLegacyRent = this.UnitsService.hasMarketType(this.unitsMetadata, this.UnitsService.LEGACY_RENT_MARKET_TYPE_ID);
    this.hiddenSalesColumns = this.UnitsService.hiddenSalesColumns(this.unitsMetadata);

    const allMarketTypes = this.UnitsService.uniqueMarketTypes(this.unitsMetadata) || [];
    let availableForRentalCount = _.filter(allMarketTypes, mt => mt.availableForRental).length;
    let availableForSalesCount = _.filter(allMarketTypes, mt => mt.availableForSales).length;
    this.showRentMarketTypes = availableForRentalCount > 1;
    this.showSalesMarketTypes = availableForSalesCount > 1;

    this.showRentUnits = availableForRentalCount > 0;
    this.showSalesUnits = availableForSalesCount > 0;
  }

  addUnit(unit) {
    this.$rootScope.showGlobalLoadingMask = true;
    let p = this.UnitsService.addUnit(this.project.id, this.blockId, unit)
      .then((block) => {
        return this.ProjectService.getProjectBlock(this.project.id, this.blockId, true).then((rsp) => {
          this.projectBlock = rsp.data;
          this.init();
        });
      })
      .finally(()=>{
        this.$rootScope.showGlobalLoadingMask = false;
      });

    this.addToRequestsQueue(p);
  }


  editUnit(event){
    let p = this.UnitsService.editUnit(this.project.id, this.blockId, event.data.id, event.data)
      .then((block) => {
        return this.ProjectService.getProjectBlock(this.project.id, this.blockId, true).then((rsp) => {
          this.projectBlock = rsp.data;
          this.init();
        });
      });
    this.addToRequestsQueue(p);
  }


  deleteUnit(event) {
    let modal = this.ConfirmationDialog.delete('Are you sure you want to delete the row?');
    let unit = event.data;
    modal.result.then(() => {
      this.$rootScope.showGlobalLoadingMask = true;
      let p = this.UnitsService.deleteUnit(this.project.id, this.blockId, event.data.id)
        .then((block) => {
          return this.ProjectService.getProjectBlock(this.project.id, this.blockId, true).then((rsp) => {
            this.projectBlock = rsp.data;
            this.init();
          });
        })
        .finally(() => {
          this.$rootScope.showGlobalLoadingMask = false;
        });
      this.addToRequestsQueue(p);
    });
  }

  sumUnitsByNumberOfPeople() {
    return ((this.blockData.type1Units || 0) * 1)
      + ((this.blockData.type2Units || 0) * 1)
      + ((this.blockData.type3Units || 0) * 1)
      + ((this.blockData.type4Units || 0) * 1)
      + ((this.blockData.type5Units || 0) * 1)
      + ((this.blockData.type6Units || 0) * 1)
      + ((this.blockData.type7Units || 0) * 1)
      + ((this.blockData.type8Units || 0) * 1);
  }

  onSaveData(releaseLock) {
    let data = {
      type: this.blockData.type,
      newBuildUnits: this.blockData.newBuildUnits,
      refurbishedUnits: this.blockData.refurbishedUnits,
      type1Units: this.blockData.type1Units,
      type2Units: this.blockData.type2Units,
      type3Units: this.blockData.type3Units,
      type4Units: this.blockData.type4Units,
      type5Units: this.blockData.type5Units,
      type6Units: this.blockData.type6Units,
      type7Units: this.blockData.type7Units,
      type8Units: this.blockData.type8Units,
      nbWheelchairUnits: this.blockData.nbWheelchairUnits,
      grossInternalArea: this.blockData.grossInternalArea
    };

    return this.ProjectBlockService.updateBlock(this.project.id, this.blockData.id, data, releaseLock);
  }

  back() {
     this.returnToOverview();
  }

  submit() {
    return this.$q.all(this.requestsQueue).then(() => {
      return this.onSaveData(true);
    });
  }

  autoSave() {
    this.onSaveData(false).then((resp)=>{
      this.blockData = resp.data;
    });
  }
}

UnitsCtrl.$inject = ['$state', '$log', 'ProjectService', 'ProjectBlockService', 'moment', 'project', '$injector', 'unitsMetadata', 'UnitsService'];

angular.module('GLA')
  .controller('UnitsCtrl', UnitsCtrl);
