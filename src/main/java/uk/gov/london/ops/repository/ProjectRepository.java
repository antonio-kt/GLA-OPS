/**
 * Copyright (c) Greater London Authority, 2016.
 *
 * This source code is licensed under the Open Government Licence 3.0.
 *
 * http://www.nationalarchives.gov.uk/doc/open-government-licence/version/3/
 */
package uk.gov.london.ops.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import uk.gov.london.ops.domain.organisation.Organisation;
import uk.gov.london.ops.domain.project.Project;
import uk.gov.london.ops.domain.template.Programme;
import uk.gov.london.ops.domain.template.Template;
import uk.gov.london.ops.web.model.project.ProjectBlockHistoryItem;

import java.util.List;
import java.util.Set;

/**
 * Spring JPA data repository for Project data.
 */
public interface ProjectRepository extends JpaRepository<Project, Integer> {

    @Query(value = "select  * from Project p inner join v_project_block_active active on active.project_id = p.id and active.block_type = 'DETAILS' "  +
            "INNER JOIN project_details_block pdb on active.id = pdb.id " +
            "where pdb.pcs_project_code = ?1 limit 1", nativeQuery = true)
    Project findFirstByLegacyProjectCode(Integer legacyProjectCode);

    @Query(value = "select  * from Project p inner join v_project_block_active active on active.project_id = p.id and active.project_block_type = ?1 " +
            "INNER JOIN wbs_code wbs on active.id = wbs.block_id " +
            "where wbs.code = ?2 ", nativeQuery = true)
    Set<Project> findAllByPaymentsWBSCode(String blockType, String wbsCode);

    @Query(value = "select p.id from Project p inner join v_project_block_active active on active.project_id = p.id and active.project_block_type in ('ProjectBudgets', 'Receipts') " +
            "INNER JOIN wbs_code wbs on active.id = wbs.block_id " +
            "where wbs.code = ?1 ", nativeQuery = true)
    Set<Integer> findAllProjectIdsByWBSCode(String wbsCode);

    List<Project> findAllByOrderByLastModifiedDesc();

    @Query(value = "select * from Project p inner join v_project_block_active active on active.project_id = p.id and active.block_type = 'DETAILS' "  +
            "INNER JOIN project_details_block pdb on active.id = pdb.id " +
            "where pdb.title = ?1 ", nativeQuery = true)
    List<Project> findAllByTitle(String title);

    List<Project> findAllByOrganisation(Organisation organisation);

    List<Project> findAllByOrganisationAndStatusName(Organisation organisation, String statusName);

    List<Project> findAllByOrganisationId(Integer organisationId);

    List<Project> findAllByOrganisationGroupId(Integer organisationGroupId);

    /**
     * @param organisationGroupId
     * @param organisationId
     * @return a list of organisations which have created or are developers of projects within the given organisation group.
     */
    @Query(value = "SELECT * FROM Project p inner join v_project_block_active active on active.project_id = p.id and active.block_type = 'DETAILS' "  +
            "INNER JOIN project_details_block pdb on active.id = pdb.id " +
            "where p.organisation_group_id = ?1 and (p.org_id = ?2 or pdb.developing_organisation_id = ?2)", nativeQuery = true)
    List<Project> findAllByGroupAndOrganisation(Integer organisationGroupId, Integer organisationId);

    List<Project> findAllByProgramme(Programme programme);
    Long countByProgramme(Programme programme);
    List<Project> findAllByProgrammeAndTemplate(Programme programme, Template template);
    List<Project> findAllByProgrammeAndTemplateAndOrganisation(Programme programme, Template template, Organisation organisation);
    List<Project> findAllByTemplate(Template template);

    Integer countByProgrammeAndStatusName(Programme programme, String statusName);

    @Query(value = "SELECT * FROM project p " +
            "inner join project_block pb on p.id  = pb.project_id and pb.project_block_type = ?1 " +
            "inner join learning_grant_block lgb on lgb.id  = pb.id and lgb.grant_type = 'AEB_GRANT' " +
            "inner join learning_grant_entry lge on lge.block_id = pb.id " +
            "where  p.status= 'Active' and TO_CHAR(lge.payment_date, 'DD/MM/YYYY') = ?2 ", nativeQuery = true)
    List<Project> findAllProjectsWithScheduledPaymentDue(String blockType, String date);

    @Query(value = "SELECT count(*) FROM Project p inner join v_project_block_active active on active.project_id = p.id and active.block_type = 'GRANT_SOURCE' "  +
            "INNER JOIN grant_source_block gsb on active.id = gsb.id " +
            "where p.programme_id = ?1 and gsb.associated_project = true", nativeQuery = true)
    Integer countAssociatedProjects(Integer programmeId);

    @Modifying
    @Query("UPDATE Project p SET p.managingOrganisation.id = :manOrgId WHERE p.programme.id = :programmeId")
    int updateProjectManagingOrgByProgramme(@Param("manOrgId") int managingOrgId, @Param("programmeId") int programmeId);

    @Query(value = "select * from project p " +
            "inner join project_block pb on pb.project_id = p.id " +
            "inner join milestones_block mb on mb.id = pb.id " +
            "inner join milestone m on m.milestones_block = mb.id " +
            "where m.external_id = 3003 and m.claim_status = 'Approved'", nativeQuery = true)
    List<Project> getApprovedStartOnSiteProjects();

    @Query(value = "select * from project p inner join project_block pb on p.id=pb.project_id " +
            "inner join PROJECT_BLOCK_QUESTION pbq on pb.id = pbq.project_block_id " +
            "inner join template_question tq on tq.id = pbq.question_id where tq.question_id = ?1", nativeQuery = true)
    List<Project> findAllForQuestion(Integer questionId);

    @Query(value = "select count(*) from project p inner join project_block pb on p.id=pb.project_id " +
            "inner join PROJECT_BLOCK_QUESTION pbq on pb.id = pbq.project_block_id " +
            "inner join template_question tq on tq.id = pbq.question_id where tq.question_id = ?1", nativeQuery = true)
    Integer countByQuestion(Integer questionId);

    @Query(value = "select case when count(1) > 0 then true else false end as permitted " +
            " from v_project_permissions " +
            " where  username = ?1 and project_id = ?2 ", nativeQuery = true)
    Boolean checkAccessForProject(String username, Integer projectId);

    @Query(value = "select new uk.gov.london.ops.web.model.project.ProjectBlockHistoryItem(p.id, pb.id, pb.blockStatus, pb.versionNumber, pb.lastModified, " +
            "pb.modifiedBy, pb.approverUsername, pb.approvedOnStatus) from Project p join p.projectBlocks pb " +
            "where p.id = ?1 and pb.displayOrder = ?2 order by pb.versionNumber")
    List<ProjectBlockHistoryItem> getProjectHistoryForProjectAndDisplayOrder(Integer projectId, Integer displayOrder);


    @Query(value = "select case when count(1) > 0 then true else false end as used " +
        " from internal_risk_block where rating_id = ?1 ", nativeQuery = true)
    Boolean isRiskRatingUsedForProject(Integer riskRatingId);

    Integer countByTemplateAndOrganisationAndStatusNameIsNot(Template template, Organisation organisation, String statusName);

}
