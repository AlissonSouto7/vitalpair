package com.aps.vitalpair.mission.application.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.Clock;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.UUID;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;

import com.aps.vitalpair.gamification.domain.port.in.AwardPointsUseCase;
import com.aps.vitalpair.mission.domain.model.MissionReward;
import com.aps.vitalpair.mission.domain.port.out.MissionRewardRepositoryPort;
import com.aps.vitalpair.season.domain.model.PointSource;
import com.aps.vitalpair.season.domain.port.in.RecordPointUseCase;

/**
 * A recompensa de missão, paga uma vez.
 *
 * <p>O catálogo declara quanto cada missão vale desde que existe, a tela mostra "+50 pts" em
 * verde, e nada concedia esses pontos. Medido em 28/09/2026 contra o servidor: topar a missão
 * de 50 deixava o placar em 25, e a linha "Missões" do resumo nunca aparecia, porque linhas
 * zeradas dos dois lados são suprimidas. A pessoa cumpria e ganhava nada.
 */
@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class MissionRewardServiceTest {

    private static final UUID TENANT = UUID.randomUUID();
    private static final UUID USER = UUID.randomUUID();
    private static final LocalDate HOJE = LocalDate.of(2026, 9, 28);
    private static final LocalDate SEGUNDA = LocalDate.of(2026, 9, 28);

    @Mock
    private MissionRewardRepositoryPort rewards;

    @Mock
    private AwardPointsUseCase scoreboard;

    @Mock
    private RecordPointUseCase pointLedger;

    private MissionRewardService service;

    @BeforeEach
    void setUp() {
        Clock relogio = Clock.fixed(
                HOJE.atTime(15, 0).atZone(ZoneId.of("America/Sao_Paulo")).toInstant(), ZoneId.of("America/Sao_Paulo"));
        service = new MissionRewardService(rewards, scoreboard, pointLedger, relogio);
    }

    @Test
    void umaMissaoCumpridaPagaOplacarEoLedger() {
        when(rewards.awardOnce(any())).thenReturn(true);

        boolean pagou = service.awardIfNew(TENANT, USER, "WORKOUTS_3", SEGUNDA, 35);

        /*
         * Os dois, no mesmo ponto, como o listener de refeição e atividade faz. O placar é o
         * número da semana e o ledger é a história de onde ele veio; o resumo da temporada é
         * somado do ledger. Escrever só num dos dois é como a tela e o resumo discordam.
         */
        assertThat(pagou).isTrue();
        verify(scoreboard).awardPoints(TENANT, USER, 35, HOJE);
        verify(pointLedger).record(TENANT, USER, PointSource.MISSION, 35, HOJE);
    }

    @Test
    void aSegundaVezNaoPagaDeNovo() {
        // O banco recusou pela chave única: já estava pago.
        when(rewards.awardOnce(any())).thenReturn(false);

        boolean pagou = service.awardIfNew(TENANT, USER, "WORKOUTS_3", SEGUNDA, 35);

        /*
         * O progresso das missões semanais é recalculado a cada leitura da tela, então sem
         * esta trava abrir a tela dez vezes pagaria dez vezes.
         */
        assertThat(pagou).isFalse();
        verify(scoreboard, never()).awardPoints(any(), any(), anyInt(), any());
        verify(pointLedger, never()).record(any(), any(), any(), anyInt(), any());
    }

    @Test
    void oPagamentoGuardaAmissaoEoPeriodo() {
        when(rewards.awardOnce(any())).thenReturn(true);

        service.awardIfNew(TENANT, USER, "WORKOUTS_3", SEGUNDA, 35);

        // Sem a missão e o período, não há como perguntar "já paguei esta?" antes de pagar de
        // novo, que é a única coisa que separa "cumpri na semana seguinte" de "abri a tela".
        ArgumentCaptor<MissionReward> captor = ArgumentCaptor.forClass(MissionReward.class);
        verify(rewards).awardOnce(captor.capture());
        assertThat(captor.getValue().getMissionCode()).isEqualTo("WORKOUTS_3");
        assertThat(captor.getValue().getPeriodStart()).isEqualTo(SEGUNDA);
        assertThat(captor.getValue().getUserId()).isEqualTo(USER);
        assertThat(captor.getValue().getPoints()).isEqualTo(35);
    }

    @Test
    void osPontosEntramNoDiaEmQueAmissaoFoiCumprida() {
        when(rewards.awardOnce(any())).thenReturn(true);
        LocalDate semanaPassada = LocalDate.of(2026, 9, 21);

        service.awardIfNew(TENANT, USER, "WORKOUTS_3", semanaPassada, 35);

        // A data do lançamento é hoje, e não o início do período: os pontos entram no dia em
        // que ela fez por merecer, que é o dia que o gráfico da temporada mostra.
        verify(pointLedger).record(eq(TENANT), eq(USER), eq(PointSource.MISSION), eq(35), eq(HOJE));
    }

    @Test
    void recompensaDeZeroNaoEscreveNada() {
        // Uma missão sem recompensa não é uma recompensa de zero pontos: é nada a pagar, e
        // gravar a linha faria o histórico dizer que houve pagamento.
        boolean pagou = service.awardIfNew(TENANT, USER, "SEM_PREMIO", SEGUNDA, 0);

        assertThat(pagou).isFalse();
        verify(rewards, never()).awardOnce(any());
        verify(scoreboard, never()).awardPoints(any(), any(), anyInt(), any());
    }
}
