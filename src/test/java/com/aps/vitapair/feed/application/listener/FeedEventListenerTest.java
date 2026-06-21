package com.aps.vitapair.feed.application.listener;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;

import com.aps.vitapair.feed.domain.model.FeedItem;
import com.aps.vitapair.feed.domain.model.FeedItemType;
import com.aps.vitapair.feed.domain.port.out.FeedItemRepositoryPort;
import com.aps.vitapair.shared.event.ActivityLoggedEvent;
import com.aps.vitapair.shared.event.MealLoggedEvent;
import com.aps.vitapair.user.domain.model.User;
import com.aps.vitapair.user.domain.port.out.UserRepositoryPort;
import java.time.LocalDate;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

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
        when(userRepository.findById(USER)).thenReturn(Optional.of(
                User.builder().id(USER).tenantId(TENANT).email("ana@a.com").name("Ana").build()));

        listener.onMealLogged(new MealLoggedEvent(USER, TENANT, TODAY, "Arroz", "LUNCH"));

        FeedItem saved = capture();
        assertThat(saved.getType()).isEqualTo(FeedItemType.MEAL_LOGGED);
        assertThat(saved.getActorName()).isEqualTo("Ana");
        assertThat(saved.getTitle()).isEqualTo("Arroz (Almoço)");
    }

    @Test
    void criaItemDeAtividadeComTituloFormatado() {
        when(userRepository.findById(USER)).thenReturn(Optional.of(
                User.builder().id(USER).tenantId(TENANT).email("ana@a.com").name("Ana").build()));

        listener.onActivityLogged(new ActivityLoggedEvent(USER, TENANT, TODAY, "RUN", 320));

        FeedItem saved = capture();
        assertThat(saved.getType()).isEqualTo(FeedItemType.ACTIVITY_LOGGED);
        assertThat(saved.getTitle()).isEqualTo("Corrida — 320 kcal");
    }

    private FeedItem capture() {
        ArgumentCaptor<FeedItem> captor = ArgumentCaptor.forClass(FeedItem.class);
        org.mockito.Mockito.verify(feedItemRepository).save(captor.capture());
        return captor.getValue();
    }
}
