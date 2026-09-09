package com.aps.vitalpair.user.infrastructure.persistence;

import java.time.DateTimeException;
import java.time.ZoneId;

import org.mapstruct.Mapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.aps.vitalpair.user.domain.model.User;
import com.aps.vitalpair.user.domain.model.UserTimeZones;

/** Converts between the domain model {@link User} and the JPA entity {@link UserJpaEntity}. */
@Mapper
public interface UserPersistenceMapper {

    Logger log = LoggerFactory.getLogger(UserPersistenceMapper.class);

    UserJpaEntity toEntity(User user);

    User toDomain(UserJpaEntity entity);

    default String map(ZoneId zone) {
        return zone == null ? null : zone.getId();
    }

    /**
     * A stored zone the JVM no longer recognises falls back rather than failing the read.
     *
     * <p>Zone identifiers are retired occasionally, and a JDK upgrade is enough to orphan one.
     * Throwing here would make the account unreadable, taking login and every screen with it,
     * over a preference. Falling back leaves one user on the wrong day boundary until they pick
     * again, which is the smaller failure by a wide margin. It is logged because a silent
     * fallback is how a whole region of users ends up on the wrong day and nobody finds out.
     */
    default ZoneId map(String zone) {
        if (zone == null) {
            return null;
        }
        try {
            return ZoneId.of(zone);
        } catch (DateTimeException e) {
            log.warn("Unknown time zone {} stored on a user, falling back to {}", zone, UserTimeZones.FALLBACK, e);
            return UserTimeZones.FALLBACK;
        }
    }
}
