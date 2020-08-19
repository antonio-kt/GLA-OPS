select distinct
pj.org_id org_id, 
coalesce(org.name,'') org_name, 
coalesce(t.name,'') as "project_type",
coalesce(pjdb.title,'') project_title,
pj.id project_id,
pjdb.pcs_project_code pcs_project_code,
coalesce(pjdb.description,'') project_description,
coalesce(pjdb.address, '')project_site_address,
coalesce(pjdb.borough, '')project_borough,
coalesce(pjdb.postcode,'') project_site_postcode,
coalesce(pjdb.project_manager,'') project_manager,
coalesce(text(pjdb.planning_permission_reference),'') project_planning_permission_ref,
coalesce(text(pjdb.coord_x),'') legacy_coord_x,
coalesce(text(pjdb.coord_y),'') legacy_coord_y,
coalesce(pjdb.site_owner,'') legacy_site_owner,
coalesce(pjdb.site_status,'') legacy_site_status,
coalesce(an.answer,'') as "progress_update"

from project pj
left join project_block pjb on pj.id = pjb.project_id
inner join project_details_block pjdb on pjb.id = pjdb.id
left join project_block_question pjbq on pjb.id = pjbq.project_block_id
left join organisation org on pj.org_id = org.id
left join programme pg on pj.programme_id = pg.id
left join ward w on pjdb.ward_id = w.id
left join template t on pj.template_id = t.id


left join (
select *  from
( select distinct
pj.id,
max(an.answer) answer,
max(q.id) qid
from project pj
left join project_block pb on pj.id = pb.project_id
left join answer an on pb.id = an.questions_block
left join question q on an.question_id = q.id
where pb.reporting_version ='true'
group by pj.id
) a where a.qid = '532'
) an on an.id = pj.id

where pj.programme_id in ( '1001','1004','1005')
and pjb.reporting_version = 'true'
order by  pj.org_id,pj.id