/**
 * Copyright (c) Greater London Authority, 2016.
 *
 * This source code is licensed under the Open Government Licence 3.0.
 *
 * http://www.nationalarchives.gov.uk/doc/open-government-licence/version/3/
 */
package uk.gov.london.ops.project.implementation.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import uk.gov.london.ops.domain.PreSetLabel;
import uk.gov.london.ops.organisation.model.Organisation;

import java.util.List;

/**
 * Spring JPA Data Repository for Pre-set Labels information.
 *
 * @author Carmina Matias
 */
public interface PreSetLabelRepository extends JpaRepository<PreSetLabel, Integer> {

    PreSetLabel findByLabelNameAndManagingOrganisation(String labelName, Organisation managingOrganisation);

    List<PreSetLabel> findAllByManagingOrganisation(Organisation organisation);
}