/**
 * Copyright (c) Greater London Authority, 2016.
 *
 * This source code is licensed under the Open Government Licence 3.0.
 *
 * http://www.nationalarchives.gov.uk/doc/open-government-licence/version/3/
 */

package uk.gov.london.ops.audit;

import io.swagger.annotations.Api;
import io.swagger.annotations.ApiOperation;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.security.access.annotation.Secured;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

import static uk.gov.london.common.user.BaseRole.OPS_ADMIN;
import static uk.gov.london.common.user.BaseRole.TECH_ADMIN;

/**
 * REST API for accessing audit activity information.
 *
 * @author Rob Bettison
 */
@RestController
@RequestMapping("api/v1")
@Api(description = "provides access to audit activity information")
public class AuditAPI {

    @Autowired
    AuditService auditService;

    @Secured({TECH_ADMIN, OPS_ADMIN})
    @RequestMapping(value = "audit", method = RequestMethod.GET)
    @ApiOperation(value = "returns values in audit_activity table")
    public List getAuditActivity() {
        return auditService.findMostRecent();
    }

    @Secured({TECH_ADMIN, OPS_ADMIN})
    @RequestMapping(value = "/allAudit", method = RequestMethod.GET)
    @ApiOperation(value = "returns all rows in audit_activity in page format")
    public @ResponseBody
    Page<AuditableActivity> getAllAuditActivity(@RequestParam(name = "username", required = false) String usernameSearchText,
                                                @RequestParam(required = false) @DateTimeFormat(pattern="yyyy-MM-dd") LocalDate fromDate,
                                                @RequestParam(required = false) @DateTimeFormat(pattern="yyyy-MM-dd") LocalDate toDate,
                                                Pageable pageable) {
        return auditService.findAll(usernameSearchText, fromDate, toDate, pageable);
    }
}
