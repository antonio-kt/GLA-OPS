/**
 * Copyright (c) Greater London Authority, 2016.
 *
 * This source code is licensed under the Open Government Licence 3.0.
 *
 * http://www.nationalarchives.gov.uk/doc/open-government-licence/version/3/
 */

import './TransitionService';
import './labelModal/labelModal.js';
import './shareModal/shareModal.js';

ProjectOverviewCtrl.$inject = [
  '$stateParams', '$state', '$log', 'ProjectService', '$rootScope', '$location', '$anchorScroll',
  'ToastrUtil', 'MessageModal', 'ConfirmationDialog', 'UserService', 'AbandonModal', 'TransitionService',
  'NotificationsService', 'TransferModal', 'ErrorService', '$q', 'LabelModal', 'config', '$timeout', 'SessionService',
  'ShareModal', 'NgbModal'
];

function ProjectOverviewCtrl($stateParams, $state, $log, ProjectService, $rootScope, $location, $anchorScroll,
                             ToastrUtil, MessageModal, ConfirmationDialog, UserService, AbandonModal, TransitionService,
                             NotificationsService, TransferModal, ErrorService, $q, LabelModal, config, $timeout, SessionService, ShareModal, NgbModal) {

  this.governanceSectionVisible = true;
  this.internalBlocksSectionExpanded = true;

  this.$log = $log;

  this.MessageModal = MessageModal;
  this.ConfirmationDialog = ConfirmationDialog;
  this.AbandonModal = AbandonModal;
  this.TransferModal = TransferModal;
  this.ErrorService = ErrorService;
  this.ProjectService = ProjectService;
  this.UserService = UserService;
  this.NgbModal = NgbModal;
  this.loading = true;
  this.linkMenuItems = [];

  if ($stateParams.backNavigation) {
    SessionService.setProjectOverview({backNavigation: $stateParams.backNavigation});
  }


  this.$onInit = () => {
    /**
     * Missing fields in overview project:
     *
     * programme.enabled
     * allowedTransitions
     * approvalWillCreatePendingPayment
     * approvalWillCreatePendingReclaim
     * pendingContractSignature
     * approvalWillCreatePendingGrantPayment
     * sapVendorId
     * leadOrganisationId
     * allowedActions
     * internalBlocksSorted
     * projectBlocksSorted[i].hasUpdates in overview api is 'false' vs 'true'for example Auto Approval with Questions : PROGRESS UPDATE block
     */

    this.isLandProject = !this.template.stateModel.approvalRequired;
    this.projectBlocks = this.project.projectBlocksSorted;
    this.internalBlocksSorted = this.project.internalBlocksSorted || [];
    this.showInternalBlocks = this.internalBlocksSorted.length && this.UserService.hasPermission('proj.view.internal.blocks');
    this.submitted = (this.project.statusType.toLowerCase() === 'submitted');
    this.assess = (this.project.statusType.toLowerCase() === 'assess');
    this.returned = (this.project.statusType.toLowerCase() === 'returned');
    this.active = (this.project.statusType.toLowerCase() === 'active');
    this.draft = (this.project.statusType.toLowerCase() === 'draft');
    this.closed = (this.project.statusType.toLowerCase() === 'closed');

    const orgId = this.project.organisation.id;
    this.canReject = this.UserService.hasPermission('proj.approve', orgId);
    this.canRecommend = this.UserService.hasPermission('proj.recommend', orgId);
    this.canReinstate = this.UserService.hasPermission('proj.reinstate', orgId);
    this.canCreateConditionalMilestone = this.UserService.hasPermission(`proj.milestone.conditional.create`);
    this.subStatusText = this.ProjectService.subStatusText(this.project);

    this.loading = false;
    this.menuConfigItems = {
      'ViewSummaryReport': {
        type: 'report',
        uiSref: `summary-report({projectId: ${this.project.id}, showUnapproved: true})`,
        stateName: 'summary-report',
        stateParams: {projectId: this.project.id, showUnapproved: true},
        displayText: 'Project Summary Report'
      },
      'ViewChangeReport': {
        type: 'report',
        uiSref: `change-report({projectId: ${this.project.id}})`,
        stateName: 'change-report',
        stateParams: {projectId: this.project.id},
        displayText: 'Change Management Report'
      },
      'ViewProgrammeSummary': {
        type: 'link',
        uiSref: `organisation-programme({organisationId: ${this.project.organisation.id}, programmeId: ${this.project.programmeId}})`,
        stateName: 'organisation-programme',
        stateParams: {organisationId: this.project.organisation.id, programmeId: this.project.programmeId},
        displayText: 'Programme Summary'
      }
    };

    // MSGLA-778. Set a title for older projects created without title
    if (!this.project.title) {
      this.project.title = 'Project title Unspecified';
    }

    this.autoApproval = !this.template.stateModel.approvalRequired && this.draft;
    this.programmeClosed = !this.project.programme.enabled;

    this.disableDrafSubmit = !this.project.complete || this.programmeClosed || this.assess || this.autoApproval;
    this.disableReturnedSubmit = !this.project.complete || this.assess || this.autoApproval;

    /**
     * Pre-populate with project history
     */
    this.ProjectService.getProjectHistory(this.project.id)
    .then(data => {
      this.historyItems = data;
      this.hasReturnTransitionInHistory = _.find(this.historyItems, {transition: 'Returned'});
      // if the project is in draft status ...
      if (!this.submitted && this.historyItems) {
        // ... and the last project history entry is in unconfirmed ...
        if (this.historyItems.length && (this.historyItems[0].transition || '').toLowerCase() === 'unconfirmed') {
          // ... then display the last saved unconfirmed comment
          this.comments = this.historyItems[0].comments;
          this.originalComments = this.comments;
        }
      }
      this.$log.debug(this.submitted, this.historyItems);
    })
    .catch(this.$log.error);

    this.processTransitionState();

    // $timeout(()=>{
    this.blocksLoading = this.hasMissingBlockFields();

    // Call the full project API if the project overview is missing information
    if(this.isProjectOverviewMissingInformation(this.project)) {
      this.ProjectService.getProject(this.project.id).then(rsp => {

        this.fullProject = rsp.data;
        //$timout to allow render changes before applying css;
        $timeout(()=>{
          this.loading = false;
          this.blocksLoading = false;
        }, 0);

        this.projectBlocks.forEach(block => {
          let fullBlock = _.find(this.fullProject.projectBlocksSorted, {id: block.id});
          block.hasUpdates = fullBlock.hasUpdates;
          block.complete = fullBlock.complete;
        });

        this.project.approvalWillCreatePendingPayment = this.fullProject.approvalWillCreatePendingPayment;
        this.project.approvalWillCreatePendingReclaim = this.fullProject.approvalWillCreatePendingReclaim;

        this.project.allowedTransitions = this.fullProject.allowedTransitions;
        this.project.allowedActions = this.fullProject.allowedActions;

        // Bellow is missing information from overview api that was used outside this call
        this.project.approvalWillCreatePendingGrantPayment  = this.fullProject.approvalWillCreatePendingGrantPayment;
        this.project.pendingContractSignature               = this.fullProject.pendingContractSignature;
        this.project.sapVendorId                            = this.fullProject.sapVendorId;
        this.project.leadOrganisationId                     = this.fullProject.leadOrganisationId;

        this.processTransitionState();
      });
    }
    // },5000)
  };

  this.isProjectOverviewMissingInformation = (project) => {
    if(!project.ableToCalculateTransitions) {
      return true;
    }

    if(project.approvalWillCreatePendingPayment == true || project.approvalWillCreatePendingReclaim == true || project.approvalWillCreatePendingGrantPayment == true) {
      if(project.pendingContractSignature == null || project.sapVendorId == null || project.leadOrganisationId == null) {
        return true;
      }
    }

    return this.hasMissingBlockFields();
  };

  this.hasMissingBlockFields = () => {
    return _.some(this.projectBlocks, (block) => block.hasUpdates == null || block.blockMarkedComplete == null);
  };


  this.onActionClicked = (item) => {
    $timeout(()=>{
      if (item.action === 'abandon-project') {
        this.abandonProject();
      }
      if (item.action === 'reject-project') {
        this.rejectProject();
      }
      if (item.action === 'watch') {
        this.watchProject();
      }
      if (item.action === 'unwatch') {
        this.unwatchProject();
      }

      if (item.action === 'transfer-project') {
        this.transferProject();
      }

      if (item.action === 'reinstate-project') {
        this.reinstateProject();
      }

      if (item.action === 'complete-project') {
        this.completeProject();
      }

      if (item.action === 'mark-project-corporate') {
        this.markProjectForCorporate(true);
      }

      if (item.action === 'unmark-project-corporate') {
        this.markProjectForCorporate(false);
      }

      if (item.action === 'add-label-to-project') {
        this.addLabel();
      }

      if (item.action === 'download-all-project-files') {
        this.downloadFiles();
      }

      if (item.action === 'share-project') {
        this.shareProject();
      }
    });
  };

  this.abandonProject = () => {
    //TODO needs statusType and allowedTransitions
    const modal = this.AbandonModal.show(this.project);
    modal.result.then((data) => {
      if (data.requestAbandon) {
        return $state.reload().then(() => ToastrUtil.success('Abandon Requested'));
      } else {
        $state.go('projects');
        return ToastrUtil.success('Abandoned');
      }
    });
  };
  this.rejectProject = () => {
    // if base project has the transitions take from there
    var transitions  =  this.project.allowedTransitions;
    const modal = this.AbandonModal.show(
      this.project,
      TransitionService.findTransition(transitions, 'Closed', 'Rejected'),
      null,
      true
    );

    modal.result.then((data) => {
      $state.go('projects');
      return ToastrUtil.success('Rejected');
    });
  };

  this.transferProject = () => {
    const modal = this.TransferModal.show(this.project);
    modal.result.then(data => $state.reload());
  };

  this.watchProject = () => {
    const modal = this.ConfirmationDialog.show({
      title: 'Watch Project',
      message: 'By selecting to watch a project you will receive all relevant notifications for this project.',
      approveText: 'WATCH PROJECT',
      dismissText: 'CANCEL'
    });

    modal.result
      .then(() => {
        NotificationsService.watchProject(UserService.currentUser().username, this.project.id).then(() => {
          this.project.currentUserWatching = true;
          $state.reload();
        });
      });
  };

  this.unwatchProject = () => {
    const modal = this.ConfirmationDialog.show({
      title: 'Stop watching this project',
      message: 'By selecting to stop watching this project you will cease to receive all relevant notifications for this project.',
      approveText: 'STOP WATCHING PROJECT',
      dismissText: 'CANCEL'
    });

    modal.result
      .then(() => {
        NotificationsService.unwatchProject(UserService.currentUser().username, this.project.id).then(() => {
          this.project.currentUserWatching = false;
          $state.reload();
        });
      });
  };

  this.reinstateProject = () => {
    if(this.canReinstate){
      this.numberOfProjectAllowedPerOrg = this.template.numberOfProjectAllowedPerOrg;
      ProjectService.canProjectBeAssignedToTemplate(this.project.templateId, this.project.organisation.id).then(rsp => {
        if (rsp.data) {
          const modal = this.AbandonModal.show(this.project);
          modal.result.then(() => {
            return $state.reload().then(() => {
              return ToastrUtil.success('Reinstated')
            });
          });
        } else {
          const modal = this.ConfirmationDialog.show({

            message: `Only ${this.numberOfProjectAllowedPerOrg} ${this.numberOfProjectAllowedPerOrg > 1 ? 'projects' : 'project'} ${this.numberOfProjectAllowedPerOrg > 1 ? 'are' : 'is'} permitted for this project type`,
            dismissText: 'CLOSE',
            showApprove: false,
          });
        }
      });

    } else {
      const modal = this.ConfirmationDialog.show({
        message: 'Contact a GLA OPS administrator to reinstate this project.',
        dismissText: 'CLOSE',
        showApprove: false,
      });
    }
  };

  this.completeProject = () => {
    let errorMsg = null;
    if(this.project.statusType === 'Active' && ['UnapprovedChanges', 'PaymentAuthorisationPending', 'ApprovalRequested'].indexOf(this.project.subStatusType) !== -1){
      errorMsg = 'Cannot complete a project with unapproved or incomplete blocks';
    }
    //AbandonModal needs project.statusType & project.allowedTransitions
    const modal = this.AbandonModal.show(this.project, {status: 'Closed', subStatus: 'Completed'}, errorMsg);
    modal.result.then(()=>{
      return $state.reload().then(() => {return ToastrUtil.success('Completed')});
    });
  };

  this.markProjectForCorporate = (markForCorporate) => {

    let modalTitle = markForCorporate ? 'Mark Project' : 'Unmark Project';

    let modalMessage = markForCorporate
      ? 'By selecting to mark a project for corporate reporting, you will be required to update additional fields.'
      :'By selecting to unmark a project for corporate reporting, some fields will no longer appear on your project';


    const modal = this.ConfirmationDialog.show({
      title: modalTitle,
      message: modalMessage,
      approveText: modalTitle.toUpperCase(),
      dismissText: 'CANCEL'
    });

    modal.result
      .then(() => {
        ProjectService.updateProjectMarkedForCorporate(this.project.id, markForCorporate).then(rsp => {
          $state.reload();
        });
      });
  };

  this.addLabel = () => {

    let modalMessage = 'By selecting to unmark a project for corporate reporting, some fields will no longer appear on your project';

    const modal = LabelModal.show(this.labelMessage, this.project.labels, this.preSetLabels);
    modal.result.then((label) => {
      return ProjectService.addLabel(this.project.id, label).then(rsp => {
        $state.reload().then(()=>{
          return ToastrUtil.success('Label applied ');
        });
      });
    }).catch(ErrorService.apiValidationHandler());
  };

  this.downloadFiles = () => {
    var modal = this.ConfirmationDialog.show({
      message: 'Click \'Yes\' to download files added to this project. Note this excludes files added to the Milestones, Funding or Budget blocks, if applicable to projects under this programme.',
      approveText: 'YES',
      dismissText: 'CANCEL'
    });

    modal.result
      .then(() => {
        window.open(config.basePath + '/file/' + this.project.id + '/downloadAllAnswers', '_blank');
      });
  };

  this.shareProject = () => {
    const modal = ShareModal.show(this.project.id);
    modal.result.then(orgId => {
      if (orgId) {
        this.ProjectService.shareProject(this.project.id, orgId).then(() => {
          ToastrUtil.success('Sharing Successful');
        });
      }
    });
  };

  /**
   * Goto block page
   */
  this.goToSection = (block) => {
    let blockType = block.blockType.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();

    ToastrUtil.clear();

    $state.go(`project-block.${blockType}`, {
      'projectId': this.project.id,
      'blockPosition': this.projectBlocks.indexOf(block) + 1,
      'blockId': block.id,
      'displayOrder': block.displayOrder,
    }, {reload: true});
  };

  /**
   * Back
   */
  this.onBack = () => {
    let previousState = (SessionService.getProjectOverview() || {}).backNavigation;
    if(previousState && previousState.name){
      $state.go(previousState.name, previousState.params);
    }else{
      $state.go('projects');
    }
    SessionService.setProjectOverview(null);
  };


  /**
   * Returns the recommendation text for the project
   * @returns {string}
   */
  this.getRecommendation = () => {
    return ProjectService.recommendationText(this.project);
  };

  /**
   * Returns if the project contains a `Milestones` block
   * @returns {boolean}
   */
  this.getMilestonesBlock = () => {
    return _.find(this.project.projectBlocksSorted, block => {
      return block.blockType.toLowerCase() === 'milestones';
    });
  };

  /**
   * Open Milestones block
   */
  this.onOpenMilestones = () => {
    const block = this.getMilestonesBlock();
    if (block) this.goToSection(block);
  };

  this.hasComment = () => {
    return this.comments;
  };

  this.hasNewComment = () => {
    return this.comments != this.originalComments;
  };

  /**
   * Form submit handler
   */
  this.onSubmitProject = (transition) => {
    return ProjectService.transitionTo(this.project.id, transition, this.comments)
      .then(resp => {
        this.originalComments = this.comments;
        return $state.go('projects');
      })
      .catch(ErrorService.apiValidationHandler());
  };

  /**
   * Form submit handler
   */
  this.onSaveProjectToActive = () => {
    return ProjectService.saveProjectToActive(this.project.id, this.comments)
      .then(resp => {
        this.originalComments = this.comments;
        return $state.go('projects');
        // ToastrUtil.success('Project saved as Active');
      })
      .catch(this.$log.error);
  };


  /**
   * Form submit returned project handler
   */
  this.onSubmitReturnedProject = () => {
    return ProjectService.onSubmitReturnedProject(this.project.id, this.comments)
      .then(resp => {
        this.originalComments = this.comments;
        $state.go('projects');
      })
      .catch(rsp => {
        let error = rsp.data || {};
        let msg = error.description || 'Can\'t submit the project';
        this.MessageModal.show({
          message: msg
        })
      });
  };


  this.onWithdrawProject = () => {
    return ProjectService.withdrawProject(this.project.id, this.comments)
      .then(resp => {
        this.originalComments = this.comments;
        // ToastrUtil.success('You can now edit this project');
        return $state.reload();
      })
      .catch(this.$log.error);
  };

  /**
   * Save comment
   */
  this.saveComment = () => {
    if (this.hasNewComment()) {
      return ProjectService.saveProjectComment(this.project.id, this.comments)
        .then(resp => {
          this.originalComments = this.comments;
          ToastrUtil.success('Comments were saved');
        })
        .catch(this.$log.error);
    }
  };
  /**
   * Mark a project as "recommend for approval", can be triggered by a GLA PM
   * on a project in assess mode
   */
  this.onRecommendForApproval = () => {
    return ProjectService.recommendApproval(this.project.id, this.comments)
      .then(resp => {
        this.originalComments = this.comments;
        return $state.go('projects');
        // ToastrUtil.success('Recommended Approve');
      })
      .catch(this.$log.error);
  };

  /**
   * Mark a project as "recommend for reject", can be triggered by a GLA PM
   * on a project in assess mode
   */
  this.onRecommendForReject = () => {
    return ProjectService.recommendReject(this.project.id, this.comments)
      .then(resp => {
        this.originalComments = this.comments;
        return $state.go('projects');
        // ToastrUtil.success('Recommended Reject');
      })
      .catch(this.$log.error);
  }

  /**
   * Mark a project as "approved", can be triggered by a GLA SPM
   * on a project in assess mode
   */
  this.onApprove = () => {
    var modal = this.ConfirmationDialog.show({
      message: 'Are you sure you want to approve this project?',
      approveText: 'APPROVE',
      dismissText: 'CANCEL'
    });
    return modal.result.then(() => {
      return ProjectService.approve(this.project.id, this.comments).then(resp => {
        this.originalComments = this.comments;
        return $state.go('projects');
        // ToastrUtil.success('Approved');
      }).catch(err => {
        this.ConfirmationDialog.warn(err.data ? err.data.description : null);
      });
    });
  }
  /**
   * Mark a project as "reject", can be triggered by a GLA SPM
   * on a project in assess or return
   */
  this.onReject = () => {
    var modal = this.ConfirmationDialog.show({
      message: 'Are you sure you want to reject this project?',
      approveText: 'REJECT',
      dismissText: 'CANCEL'
    });
    return modal.result.then(() => {
      return ProjectService.reject(this.project.id, this.comments).then(resp => {
        this.originalComments = this.comments;
        return $state.go('projects');
        // ToastrUtil.success('Rejected');
      }).catch(rsp => {
        let error = rsp.data || {};
        let msg = error.description || 'Can\'t reject the project';
        this.MessageModal.show({
          message: msg
        })
      });
    });
  };

  /**
   * Mark a project as "Active: ", can be triggered by RP users
   * on a project in "Active: unapproved changes"
   */
  this.onRequestApproval = () => {
    this.$log.log('request approval');
    return ProjectService.changeStatus(this.project.id, 'Active', 'ApprovalRequested', this.comments).then(resp => {
      this.originalComments = this.comments;
      return $state.go('projects');
      // ToastrUtil.success('Approval Requested');
    }).catch(err => {
      this.ConfirmationDialog.warn(err.data ? err.data.description : null);
    });
  };


  this.onReturnProject = () => {
    return ProjectService.returnProject(this.project.id, this.comments)
      .then(resp => {
        this.originalComments = this.comments;
        return $state.go('projects');
        // ToastrUtil.success('Returned');
      }).catch(this.$log.error);
  };

  this.onReturnFromApprovalRequested = () => {
    return ProjectService.onReturnFromApprovalRequested(this.project.id, this.comments)
      .then(resp => {
        this.originalComments = this.comments;
        return $state.go('projects');
        // ToastrUtil.success('Returned');
      });
  }

  this.onApproveFromApprovalRequested = () => {
    let msg = 'Are you sure you want to approve the project changes?';
    var pendingPayment = this.project.approvalWillCreatePendingPayment;
    var pendingReclaim = this.project.approvalWillCreateReclaimPayment;

    if (pendingPayment) {
      msg += '<br/><br/><span class="gla-alert">Approving these changes will create a pending payment!</span>';
    }
    if (pendingReclaim) {
      msg += '<br/><br/><span class="gla-alert">Approving these changes will create a pending reclaim!</span>';
    }
    var modal = this.ConfirmationDialog.show({
      message: msg,
      approveText: 'APPROVE',
      dismissText: 'CANCEL'
    });
    return modal.result.then(() => {
      return ProjectService.onApproveFromApprovalRequested(this.project.id, this.comments)
        .then(resp => {
          this.originalComments = this.comments;
          return $state.go('projects');
          // ToastrUtil.success('Project changes approved');
        }).catch(err => {
          this.ConfirmationDialog.warn(err.data ? err.data.description : null);
        });
    });
  };

  /**
   * Approves the request to abandon a project
   */
  this.onApproveAbandon = () => {
    var modal = this.ConfirmationDialog.show({
      message: 'Are you sure you want to approve the request to abandon and close the project?',
      approveText: 'APPROVE',
      dismissText: 'CANCEL'
    });
    return modal.result.then(() => {
      return ProjectService.approveAbandon(this.project.id, this.comments).then(resp => {
        this.originalComments = this.comments;
        return $state.go('projects');
        // ToastrUtil.success('Project Closed');
      }).catch(err => {
        this.ConfirmationDialog.warn(err.data ? err.data.description : null);
      });
    });
  };

  /**
   * Rejects the request to abandon a project
   */
  this.onRejectAbandon = () => {
    var modal = this.ConfirmationDialog.show({
      message: 'Are you sure you want to reject the request to abandon to keep the project active?',
      approveText: 'REJECT',
      dismissText: 'CANCEL'
    });
    return modal.result.then(() => {
      return ProjectService.rejectAbandon(this.project.id, this.comments).then(resp => {
        this.originalComments = this.comments;
        return $state.go('projects');
        // ToastrUtil.success('Project Active');
      });
    });
  };

  this.onRequestPaymentAuthorisation = () => {
    let programmeId = this.project.programmeId;
    let validationMessage = this.validatePaymentRequest();
    if (validationMessage) {
      this.ConfirmationDialog.warn(validationMessage);
    } else {
      let msg = 'Are you sure you want to approve the project changes?';
      // msg += '<br/><br/><span class="gla-alert">Approving these changes will create a pending payment!</span>';

      if (this.project.approvalWillCreatePendingPayment) {
        msg += '<br/><br/><span class="gla-alert">Approving these changes will create a pending payment!</span>';
      }
      if (this.project.approvalWillCreatePendingReclaim) {
        msg += '<br/><br/><span class="gla-alert">Approving these changes will create a pending reclaim!</span>';
      }

      var modal = this.ConfirmationDialog.show({
        message: msg,
        approveText: 'APPROVE',
        dismissText: 'CANCEL'
      });

      return modal.result.then(() => {
        return ProjectService.onRequestPaymentAuthorisation(this.project.id, this.comments)
          .then(resp => {
            this.originalComments = this.comments;
            return $state.go('projects');
            // ToastrUtil.success('Project changes approved');
          })
          .catch(err => {
            let description =  err.data ? err.data.description : null;
            if(_.includes(err.data.description, 'WBS') || _.includes(err.data.description, 'cost element code')){
              let split = description.split('programme');
              if(split.length > 1){
                description = split.join(`<a href="#/programme/${programmeId}">programme</a>`);
              }
            }

            description = _.replace(description,'. ', '.<br>');
            this.ConfirmationDialog.warn(description);
          });
      });
    }
  };
  /**
   * Returns null if valid and validation message if invalid
   */
  this.validatePaymentRequest = () => {

    let showContractNotSignedMsg = this.project.pendingContractSignature;
    let showMissingSapVendorIdMsg = this.project.approvalWillCreatePendingGrantPayment && !this.project.sapVendorId;

    let orgDetailsId = this.project.organisationGroupId ? this.project.leadOrganisationId : this.project.organisation.id;
    let orgDetailsLink = `<a href="#/organisation/${orgDetailsId}">manage organisation</a>`;

    if (showMissingSapVendorIdMsg && showContractNotSignedMsg) {
      return `Pending payments cannot be submitted for authorisation as the contract for this project type has not been signed and a SAP vendor ID has not been provided. The SAP vendor ID must be added to the ${orgDetailsLink} section by a OPS Admin.`;
    }

    if (showMissingSapVendorIdMsg) {
      return `SAP vendor ID has not been provided. The SAP vendor ID must be added to the ${orgDetailsLink} section by a OPS Admin.`;
    }

    if (showContractNotSignedMsg) {
      return `Pending payments cannot be submitted for authorisation as the contract for this project type has not been signed. The contract must be selected as signed in the ${orgDetailsLink} section.`;
    }
    return null;
  };

  this.onCommentKeyPress = (comment) => {
    if (this.comments && this.comments.length && this.comments != this.originalComments) {
      this.missingComment = false;
    }
  };

  // observe and execute only once
  const watcher = $rootScope.$on('$stateChangeStart', (event, toState, toParams, fromState, fromParams) => {
    if (fromState.name === 'project-overview') {
      if (fromParams.projectId.toString() === this.project.id.toString()) {
        this.saveComment();
      }
      this.NgbModal.dismissAll();
      watcher();
    }
  });

  /**
   * Function used to determine which buttons are shown.
   * It bases itself on th allowed transitions returned in th project details.
   * Transitions describe where the project is allowed to go to from it's current
   * status, permissions are factored in in the back end.
   * @return {[type]} [description]
   */
  this.processTransitionState = () => {
    let linkMenuItems = [];

    //TODO should we mix report menu and state actions together? Doesn't look like the same thing
    _.forEach(this.project.allowedActions, allowedAction => {
      let config = this.menuConfigItems[allowedAction];
      if (config) {
        if (config.type === 'report') {
          linkMenuItems.push(config);
        } else {
          $log.error('Unknow menu item type');
        }
      } else {
        $log.warn('Unknown allowed menu item action: ', allowedAction);
      }
    });

    if(linkMenuItems.length){
      linkMenuItems.push({hr:true});
    }
    linkMenuItems.push(this.menuConfigItems['ViewProgrammeSummary']);
    linkMenuItems.push({hr:true});
    let buttons = TransitionService.getTransitionButtons(this.project, !this.isSubmitToApproveEnabled);
    let featureToggles = {
      isMarkedForCorporateEnabled: this.isMarkedForCorporateEnabled,
      isLabelsFeatureEnabled: this.isLabelsFeatureEnabled,
      isAllowAllFileDownloadEnabled: this.isAllowAllFileDownloadEnabled,
      isProjectSharingEnabled: this.isProjectSharingEnabled
    };
    this.actionMenuItems = TransitionService.getMenuItems(this.project, featureToggles);


    this.linkMenuItems = linkMenuItems;


    // apply buttons configs to template
    this.transitionButtons = _.sortBy(buttons, 'order');
    // if there is at least 1 button, show the comment box
    this.commentBoxVisibility = this.transitionButtons.length > 0;
    //If at least one button is enabled then enable comment box as well
    this.commentBoxEditability = this.transitionButtons.some(btn => !this[btn.disableState]);
  };

  this.transitionButtonsCallback = (buttonCfg) => {
    if (buttonCfg.commentsRequired) {
      if (!this.hasComment()) {
        this.$log.info('Transition requires a comment');
        this.missingComment = true;
        return;
      }
    }
    this.missingComment = false;
    let p = this[buttonCfg.callback]((buttonCfg || {}).transition);
    if(p && p.then){
      p.then((data => {
        if (data) {
          this.showTransitionToast((buttonCfg || {}).transition)
        }
      }));
    }
  };

  this.jumpTo = (id) => {
    $location.hash(id);
    $anchorScroll();
  };

  this.toggleGovernanceSection = () => {
    this.internalBlocksSectionExpanded = !this.internalBlocksSectionExpanded;
  };

  this.goToInternalBlock = (block) => {
    switch (block.type) {
      case 'Risk':
        return $state.go('project.internal-risk', {projectId: this.project.id, blockId: block.id});
      case 'Assessment':
        return $state.go('project.internal-assessment', {projectId: this.project.id, blockId: block.id});
      case 'Questions':
        return $state.go('project.internal-questions', {projectId: this.project.id, blockId: block.id});
      default:
        console.error('Internal block not recognised:', block);
    }
  };

  this.showTransitionToast = (transition) => {
    let subStatus = ProjectService.getSubStatusText(transition.subStatus);
    let fullStatus = `${transition.status} ${subStatus || ''}`.trim();
    // TODO : this is shown even when there is an error
    ToastrUtil.success(`Project updated: "${fullStatus}"`);
    // ToastrUtil.success('Project status updated');
  };

  //Returns promise
  this.preStateTransitionActions = (transition) => {
    let modal = this.getConfirmationModal(transition);
    return modal ? modal.result : $q.resolve();
  };

  this.postStateTransitionActions = (transition, rsp) => {
    this.originalComments = this.comments;
    return $state.go('projects');
    // Moved to combine with old approach
    // this.showTransitionToast(transition);
  };


  this.onTransition = (transition) => {
    let p = this.preStateTransitionActions(transition);
    return p.then(() => {
      return ProjectService.changeStatus(this.project.id, transition.status, transition.subStatus, this.comments)
        .then(rsp => {
          return this.postStateTransitionActions(transition, rsp);
        })
        .catch(ErrorService.apiValidationHandler());
    });
  };


  this.getConfirmationModal = (transition) => {
    if (transition.statusType === 'Closed' && transition.subStatusType === 'Rejected') {
      return this.ConfirmationDialog.show({
        message: 'Are you sure you want to reject this project?',
        approveText: 'REJECT',
        dismissText: 'CANCEL'
      });
    }
  };
}

angular.module('GLA')
  .component('projectOverview', {
    templateUrl: 'scripts/pages/project/overview/projectOverview.html',
    bindings: {
      isSubmitToApproveEnabled: '<',
      isMarkedForCorporateEnabled: '<',
      isLabelsFeatureEnabled: '<',
      isAllowAllFileDownloadEnabled: '<',
      isProjectSharingEnabled: '<',
      labelMessage: '<',
      project: '<',
      template: '<',
      preSetLabels: '<'
    },
    controller: ProjectOverviewCtrl
  });
