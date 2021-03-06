SELECT v_project_details.project_id prj_id, v_project_details.* , v_grant_source.*, v_milestones_1000.*,
v_questions_1000.*, v_design_standards.*, v_add_questions_1000.*, v_indicative_1000.*,
v_eligible_grant_1000.*, project.status

FROM (v_project_details LEFT JOIN v_grant_source
ON v_project_details.project_id = v_grant_source.project_id)
LEFT JOIN v_milestones_1000 ON(v_project_details.project_id = v_milestones_1000.project_id)
LEFT JOIN v_design_standards ON(v_project_details.project_id = v_design_standards.project_id)
LEFT JOIN v_questions_1000 ON(v_project_details.project_id = v_questions_1000.project_id)
LEFT JOIN v_add_questions_1000 ON(v_project_details.project_id = v_add_questions_1000.project_id)
LEFT JOIN v_indicative_1000 ON(v_project_details.project_id = v_indicative_1000.project_id)
LEFT JOIN v_eligible_grant_1000 ON(v_eligible_grant_1000.project_id = v_project_details.project_id)
LEFT JOIN project ON(project.id = v_project_details.project_id)
