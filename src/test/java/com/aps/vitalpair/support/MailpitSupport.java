package com.aps.vitalpair.support;

import java.time.Duration;
import java.util.List;
import java.util.Optional;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.web.client.RestClient;
import org.testcontainers.containers.GenericContainer;
import org.testcontainers.containers.wait.strategy.Wait;
import org.testcontainers.utility.DockerImageName;

import com.fasterxml.jackson.databind.JsonNode;

/**
 * A real SMTP server for the tests, with an API to read what was delivered.
 *
 * <p>The alternative, a fake {@code MailSenderPort}, would skip the {@code JavaMailSender}
 * wiring, the MIME assembly and the SMTP round trip, which is most of what can break in
 * e-mail delivery. Mailpit receives the message the way a provider would, and the test
 * then reads the verification or reset link out of the HTML exactly as a person would
 * click it.
 *
 * <p>Static and started once: the container outlives any single application context, so
 * every cached context can point at the same port.
 */
public final class MailpitSupport {

    /** Pinned: the same tag compose.yaml uses, so dev and test see the same server. */
    public static final String IMAGE = "axllent/mailpit:v1.31.1";

    private static final int SMTP_PORT = 1025;
    private static final int HTTP_PORT = 8025;
    private static final Duration DELIVERY_TIMEOUT = Duration.ofSeconds(5);
    private static final Pattern TOKEN_LINK = Pattern.compile("href=\"([^\"]*[?&]token=([^\"&]+))\"");

    private static final GenericContainer<?> CONTAINER = new GenericContainer<>(DockerImageName.parse(IMAGE))
            .withExposedPorts(SMTP_PORT, HTTP_PORT)
            .waitingFor(Wait.forHttp("/readyz").forPort(HTTP_PORT));

    static {
        CONTAINER.start();
    }

    private MailpitSupport() {}

    /** Delivers the application's mail here. Called from a @DynamicPropertySource. */
    public static void register(DynamicPropertyRegistry registry) {
        registry.add("spring.mail.host", CONTAINER::getHost);
        registry.add("spring.mail.port", () -> CONTAINER.getMappedPort(SMTP_PORT));
        registry.add("spring.mail.properties.mail.smtp.auth", () -> false);
        registry.add("spring.mail.properties.mail.smtp.starttls.enable", () -> false);
    }

    private static RestClient api() {
        return RestClient.create("http://" + CONTAINER.getHost() + ":" + CONTAINER.getMappedPort(HTTP_PORT));
    }

    /** Everything in the mailbox, newest first, as Mailpit lists it. */
    public static List<Envelope> messages() {
        JsonNode body = api().get().uri("/api/v1/messages?limit=200").retrieve().body(JsonNode.class);
        return body.path("messages")
                .valueStream()
                .map(m -> new Envelope(
                        m.path("ID").asText(),
                        m.path("To").path(0).path("Address").asText(),
                        m.path("Subject").asText()))
                .toList();
    }

    /**
     * The newest message sent to an address, waiting briefly for delivery.
     *
     * <p>Sending is synchronous in the application, so the message is normally there by
     * the time the HTTP response arrives; the wait covers Mailpit indexing it.
     */
    public static Optional<Mail> latestTo(String email) {
        long deadline = System.nanoTime() + DELIVERY_TIMEOUT.toNanos();
        while (true) {
            Optional<Envelope> found = messages().stream()
                    .filter(m -> m.to().equalsIgnoreCase(email))
                    .findFirst();
            if (found.isPresent()) {
                return found.map(MailpitSupport::open);
            }
            if (System.nanoTime() > deadline) {
                return Optional.empty();
            }
            sleep(100);
        }
    }

    /** Empties the mailbox, so a test cannot read a message another test received. */
    public static void deleteAll() {
        api().delete().uri("/api/v1/messages").retrieve().toBodilessEntity();
    }

    private static Mail open(Envelope envelope) {
        JsonNode body = api().get()
                .uri("/api/v1/message/{id}", envelope.id())
                .retrieve()
                .body(JsonNode.class);
        String html = body.path("HTML").asText();
        Matcher matcher = TOKEN_LINK.matcher(html);
        String link = matcher.find() ? matcher.group(1) : null;
        String token = link != null ? matcher.group(2) : null;
        return new Mail(envelope.to(), envelope.subject(), html, link, token);
    }

    private static void sleep(long millis) {
        try {
            Thread.sleep(millis);
        } catch (InterruptedException ex) {
            Thread.currentThread().interrupt();
            throw new IllegalStateException("Interrupted while waiting for mail", ex);
        }
    }

    public record Envelope(String id, String to, String subject) {}

    /**
     * A delivered message.
     *
     * @param link the first link carrying a {@code token} query parameter, or null
     * @param token the value of that parameter, still URL-encoded as it appears in the link
     */
    public record Mail(String to, String subject, String html, String link, String token) {}
}
