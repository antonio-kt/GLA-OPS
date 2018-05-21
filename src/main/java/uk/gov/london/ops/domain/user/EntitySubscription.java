/**
 * Copyright (c) Greater London Authority, 2016.
 *
 * This source code is licensed under the Open Government Licence 3.0.
 *
 * http://www.nationalarchives.gov.uk/doc/open-government-licence/version/3/
 */
package uk.gov.london.ops.domain.user;

import uk.gov.london.ops.domain.EntityType;
import uk.gov.london.ops.util.jpajoins.Join;
import uk.gov.london.ops.util.jpajoins.JoinData;

import javax.persistence.*;
import java.io.Serializable;

@Entity(name = "entity_subscription")
public class EntitySubscription implements Serializable {

    @Id
    @GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "entity_subscription_seq_gen")
    @SequenceGenerator(name = "entity_subscription_seq_gen", sequenceName = "entity_subscription_seq", initialValue = 1000, allocationSize = 1)
    private Integer id;

    @Column(name = "username", nullable = false)
    private String username;

    @Enumerated(EnumType.STRING)
    @Column(name = "entity_type", nullable = false)
    private EntityType entityType;

    @Column(name = "entity_id", nullable = false)
    @JoinData(joinType = Join.JoinType.Complex,
            comment = "This can reference a number of different objects depending on the entity type field. ")
    private Integer entityId;

    public EntitySubscription() {}

    public EntitySubscription(String username, EntityType entityType, Integer entityId) {
        this.username = username;
        this.entityType = entityType;
        this.entityId = entityId;
    }

    public Integer getId() {
        return id;
    }

    public String getUsername() {
        return username;
    }

    public void setUsername(String username) {
        this.username = username;
    }

    public EntityType getEntityType() {
        return entityType;
    }

    public void setEntityType(EntityType entityType) {
        this.entityType = entityType;
    }

    public Integer getEntityId() {
        return entityId;
    }

    public void setEntityId(Integer entityId) {
        this.entityId = entityId;
    }

}