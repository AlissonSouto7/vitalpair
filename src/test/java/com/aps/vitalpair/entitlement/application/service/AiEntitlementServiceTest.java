package com.aps.vitalpair.entitlement.application.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.when;

import java.time.Clock;
import java.time.Instant;
import java.time.ZoneOffset;
import java.util.Optional;
import java.util.UUID;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.aps.vitalpair.entitlement.domain.exception.AiAccessRequiredException;
import com.aps.vitalpair.pair.domain.model.Pair;
import com.aps.vitalpair.pair.domain.model.PairStatus;
import com.aps.vitalpair.pair.domain.port.out.PairRepositoryPort;
import com.aps.vitalpair.user.domain.model.Plan;
import com.aps.vitalpair.user.domain.model.User;
import com.aps.vitalpair.user.domain.port.out.UserRepositoryPort;

/**
 * The rule, case by case: own plan, own expiry, the partner's plan, and what the pair's
 * state does to the borrowed one. The clock is fixed so "expired" is a fact, not a race.
 */
@ExtendWith(MockitoExtension.class)
class AiEntitlementServiceTest {

    private static final Instant NOW = Instant.parse("2026-09-11T12:00:00Z");

    @Mock
    private UserRepositoryPort users;

    @Mock
    private PairRepositoryPort pairs;

    private AiEntitlementService service;

    private final UUID pairId = UUID.randomUUID();
    private final UUID meId = UUID.randomUUID();
    private final UUID partnerId = UUID.randomUUID();

    @BeforeEach
    void setUp() {
        service = new AiEntitlementService(users, pairs, Clock.fixed(NOW, ZoneOffset.UTC));
    }

    @Test
    void aFreeUserAloneHasNoAccess() {
        givenUser(meId, Plan.FREE, null);
        givenNoPair();

        assertThat(service.entitlementOf(meId).aiAccess()).isFalse();
        assertThat(service.entitlementOf(meId).plan()).isEqualTo(Plan.FREE);
    }

    @Test
    void aPremiumUserWithNoExpiryHasAccess() {
        givenUser(meId, Plan.PREMIUM, null);

        assertThat(service.entitlementOf(meId).aiAccess()).isTrue();
    }

    @Test
    void aPremiumUserWhosePlanHasNotExpiredHasAccess() {
        givenUser(meId, Plan.PREMIUM, NOW.plusSeconds(1));

        assertThat(service.entitlementOf(meId).aiAccess()).isTrue();
    }

    @Test
    void aPremiumUserWhosePlanExpiredHasNoAccess() {
        givenUser(meId, Plan.PREMIUM, NOW.minusSeconds(1));
        givenNoPair();

        assertThat(service.entitlementOf(meId).aiAccess()).isFalse();
        // The plan they had is still reported as theirs; what is gone is the access.
        assertThat(service.entitlementOf(meId).plan()).isEqualTo(Plan.PREMIUM);
    }

    @Test
    void anExpiryExactlyNowCountsAsExpired() {
        givenUser(meId, Plan.PREMIUM, NOW);
        givenNoPair();

        assertThat(service.entitlementOf(meId).aiAccess()).isFalse();
    }

    @Test
    void aFreeUserBorrowsAnActivePartnersPlan() {
        givenUser(meId, Plan.FREE, null);
        givenUser(partnerId, Plan.PREMIUM, null);
        givenPair(PairStatus.ACTIVE);

        assertThat(service.entitlementOf(meId).aiAccess()).isTrue();
        assertThat(service.entitlementOf(meId).plan())
                .as("the plan reported is their own")
                .isEqualTo(Plan.FREE);
    }

    @Test
    void aFreeUserDoesNotBorrowFromAnEndedPair() {
        givenUser(meId, Plan.FREE, null);
        givenPair(PairStatus.ENDED);

        assertThat(service.entitlementOf(meId).aiAccess()).isFalse();
    }

    @Test
    void aFreeUserDoesNotBorrowFromAPendingPair() {
        // Pending means nobody joined yet: user2 is null, there is no partner to borrow from.
        givenUser(meId, Plan.FREE, null);
        when(pairs.findById(pairId))
                .thenReturn(Optional.of(Pair.builder()
                        .id(pairId)
                        .user1Id(meId)
                        .pairName("Me")
                        .inviteCode("ABCD2345")
                        .status(PairStatus.PENDING)
                        .createdAt(NOW)
                        .build()));

        assertThat(service.entitlementOf(meId).aiAccess()).isFalse();
    }

    @Test
    void aPartnerWhosePlanExpiredLendsNothing() {
        givenUser(meId, Plan.FREE, null);
        givenUser(partnerId, Plan.PREMIUM, NOW.minusSeconds(1));
        givenPair(PairStatus.ACTIVE);

        assertThat(service.entitlementOf(meId).aiAccess()).isFalse();
    }

    @Test
    void requireRefusesWithTheExceptionTheWebLayerMapsTo402() {
        givenUser(meId, Plan.FREE, null);
        givenNoPair();

        assertThatThrownBy(() -> service.requireAiAccess(meId)).isInstanceOf(AiAccessRequiredException.class);
    }

    @Test
    void requireLetsAPremiumUserThrough() {
        givenUser(meId, Plan.PREMIUM, null);

        service.requireAiAccess(meId);
    }

    private void givenUser(UUID id, Plan plan, Instant expiresAt) {
        User user = User.builder()
                .id(id)
                .tenantId(pairId)
                .email(id + "@example.com")
                .name("Someone")
                .plan(plan)
                .planExpiresAt(expiresAt)
                .build();
        when(users.findById(id)).thenReturn(Optional.of(user));
    }

    private void givenPair(PairStatus status) {
        when(pairs.findById(pairId))
                .thenReturn(Optional.of(Pair.builder()
                        .id(pairId)
                        .user1Id(meId)
                        .user2Id(partnerId)
                        .pairName("Us")
                        .inviteCode("ABCD2345")
                        .status(status)
                        .createdAt(NOW)
                        .build()));
    }

    private void givenNoPair() {
        when(pairs.findById(pairId)).thenReturn(Optional.empty());
    }
}
