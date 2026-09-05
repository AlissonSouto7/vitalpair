package com.aps.vitalpair.feed.application.listener;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;

import java.time.LocalDate;
import java.util.Optional;
import java.util.UUID;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.aps.vitalpair.feed.domain.model.FeedItem;
import com.aps.vitalpair.feed.domain.model.FeedItemType;
import com.aps.vitalpair.feed.domain.port.out.FeedItemRepositoryPort;
import com.aps.vitalpair.shared.event.ActivityLoggedEvent;
import com.aps.vitalpair.shared.event.MealLoggedEvent;
import com.aps.vitalpair.user.domain.model.User;
import com.aps.vitalpair.user.domain.port.out.UserRepositoryPort;

@ExtendWith(MockitoExtension.class)
class FeedEventListenerTest {

    private static final UUID USER = UUID.randomUUID();
    private static final UUID TENANT = UUID.randomUUID();
    private static final LocalDate TODAY = LocalDate.of(2026, 6, 21);

    @Mock
    private FeedItemRepositoryPort feedItemRepository;

    @Mock
    private UserRepositoryPort userRepository;

    @InjectMocks
    private FeedEventListener listener;

    @Test
    void criaItemDeRefeicaoComTituloFormatado() {
        when(userRepository.findById(USER))
                .thenReturn(Optional.of(User.builder()
                        .id(USER)
                        .tenantId(TENANT)
                        .email("ana@a.com")
                        .name("Ana")
                        .build()));

        listener.onMealLogged(new MealLoggedEvent(USER, TENANT, TODAY, "Arroz", "LUNCH", false, 585, 48, 62, 14));

        FeedItem saved = capture();
        assertThat(saved.getType()).isEqualTo(FeedItemType.MEAL_LOGGED);
        assertThat(saved.getActorName()).isEqualTo("Ana");
        assertThat(saved.getTitle()).isEqualTo("Arroz (Almoço)");
        assertThat(saved.getSubtitle()).isEqualTo("585 kcal · P 48g · C 62g · G 14g");
        assertThat(saved.getPoints()).isEqualTo(10);
    }

    @Test
    void criaItemDeAtividadeComTituloFormatado() {
        when(userRepository.findById(USER))
                .thenReturn(Optional.of(User.builder()
                        .id(USER)
                        .tenantId(TENANT)
                        .email("ana@a.com")
                        .name("Ana")
                        .build()));

        listener.onActivityLogged(new ActivityLoggedEvent(USER, TENANT, TODAY, "RUN", 320, 35));

        FeedItem saved = capture();
        assertThat(saved.getType()).isEqualTo(FeedItemType.ACTIVITY_LOGGED);
        assertThat(saved.getTitle()).isEqualTo("Corrida — 320 kcal");
        assertThat(saved.getSubtitle()).isEqualTo("35 min · 320 kcal");
        assertThat(saved.getPoints()).isEqualTo(15);
    }

    private FeedItem capture() {
        ArgumentCaptor<FeedItem> captor = ArgumentCaptor.forClass(FeedItem.class);
        org.mockito.Mockito.verify(feedItemRepository).save(captor.capture());
        return captor.getValue();
    }
}
