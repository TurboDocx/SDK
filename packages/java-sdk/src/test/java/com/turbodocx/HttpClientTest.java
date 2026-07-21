package com.turbodocx;

import okhttp3.mockwebserver.MockResponse;
import okhttp3.mockwebserver.MockWebServer;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.io.IOException;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * Tests for HttpClient's status-code-to-exception mapping.
 *
 * Each test enqueues a mock response with a specific HTTP status code and
 * verifies that the matching typed exception from {@link TurboDocxException}
 * is thrown.
 */
class HttpClientTest {

    private MockWebServer server;
    private HttpClient client;

    @BeforeEach
    void setUp() throws IOException {
        server = new MockWebServer();
        server.start();
        client = new HttpClient(
                server.url("/").toString(),
                "TDX-test-key",
                null,
                "test-org-id",
                null,
                null);
    }

    @AfterEach
    void tearDown() throws IOException {
        server.shutdown();
    }

    @Test
    void mapsStatus400ToValidationException() {
        server.enqueue(new MockResponse()
                .setResponseCode(400)
                .setHeader("Content-Type", "application/json")
                .setBody("{\"message\":\"Bad request\",\"code\":\"VALIDATION\"}"));

        TurboDocxException.ValidationException ex = assertThrows(
                TurboDocxException.ValidationException.class,
                () -> client.get("/api/anything", Object.class));
        assertEquals(400, ex.getStatusCode());
    }

    @Test
    void mapsStatus401ToAuthenticationException() {
        server.enqueue(new MockResponse()
                .setResponseCode(401)
                .setHeader("Content-Type", "application/json")
                .setBody("{\"message\":\"Unauthorized\"}"));

        TurboDocxException.AuthenticationException ex = assertThrows(
                TurboDocxException.AuthenticationException.class,
                () -> client.get("/api/anything", Object.class));
        assertEquals(401, ex.getStatusCode());
    }

    @Test
    void mapsStatus403ToAuthorizationException() {
        server.enqueue(new MockResponse()
                .setResponseCode(403)
                .setHeader("Content-Type", "application/json")
                .setBody("{\"message\":\"Forbidden\"}"));

        TurboDocxException.AuthorizationException ex = assertThrows(
                TurboDocxException.AuthorizationException.class,
                () -> client.get("/api/anything", Object.class));
        assertEquals(403, ex.getStatusCode());
    }

    @Test
    void mapsStatus404ToNotFoundException() {
        server.enqueue(new MockResponse()
                .setResponseCode(404)
                .setHeader("Content-Type", "application/json")
                .setBody("{\"message\":\"Not found\"}"));

        TurboDocxException.NotFoundException ex = assertThrows(
                TurboDocxException.NotFoundException.class,
                () -> client.get("/api/anything", Object.class));
        assertEquals(404, ex.getStatusCode());
    }

    @Test
    void mapsStatus409ToConflictException() {
        server.enqueue(new MockResponse()
                .setResponseCode(409)
                .setHeader("Content-Type", "application/json")
                .setBody("{\"message\":\"Webhook with this name already exists\",\"code\":\"CONFLICT\"}"));

        TurboDocxException.ConflictException ex = assertThrows(
                TurboDocxException.ConflictException.class,
                () -> client.get("/api/anything", Object.class));
        assertEquals(409, ex.getStatusCode());
        assertEquals("CONFLICT", ex.getCode());
    }

    @Test
    void mapsStatus429ToRateLimitException() {
        server.enqueue(new MockResponse()
                .setResponseCode(429)
                .setHeader("Content-Type", "application/json")
                .setBody("{\"message\":\"Too many requests\"}"));

        TurboDocxException.RateLimitException ex = assertThrows(
                TurboDocxException.RateLimitException.class,
                () -> client.get("/api/anything", Object.class));
        assertEquals(429, ex.getStatusCode());
    }

    @Test
    void mapsStatus500ToGenericTurboDocxException() {
        server.enqueue(new MockResponse()
                .setResponseCode(500)
                .setHeader("Content-Type", "application/json")
                .setBody("{\"message\":\"Internal server error\"}"));

        TurboDocxException ex = assertThrows(
                TurboDocxException.class,
                () -> client.get("/api/anything", Object.class));
        assertEquals(500, ex.getStatusCode());
    }

    // ------------------------------------------------------------------
    // Error detail + code extraction
    //
    // The API reports failures in several envelopes. Reading only the top-level
    // message/error loses the actionable reason ("senderEmail must be a valid email
    // address") and the specific code (QUOTE_NOT_FOUND) — and for the nested
    // `error: {...}` shape used across TurboQuote, would surface the raw JSON.
    // ------------------------------------------------------------------

    private TurboDocxException failWith(int status, String body) {
        server.enqueue(new MockResponse()
                .setResponseCode(status)
                .setHeader("Content-Type", "application/json")
                .setBody(body));

        return assertThrows(
                TurboDocxException.class,
                () -> client.get("/api/anything", Object.class));
    }

    @Test
    void surfacesPerFieldReasonOverGenericEnvelope() {
        TurboDocxException ex = failWith(400,
                "{\"message\":\"There was an issue validating the body\",\"type\":\"ValidationError\","
                        + "\"data\":{\"errors\":[{\"message\":\"senderEmail must be a valid email address\"}]}}");

        assertTrue(ex.getMessage().contains("senderEmail must be a valid email address"));
    }

    @Test
    void joinsMultipleFieldErrors() {
        TurboDocxException ex = failWith(400,
                "{\"message\":\"There was an issue validating the body\","
                        + "\"data\":{\"errors\":[{\"message\":\"a is bad\"},{\"message\":\"b is required\"}]}}");

        assertTrue(ex.getMessage().contains("a is bad"));
        assertTrue(ex.getMessage().contains("b is required"));
    }

    @Test
    void fallsBackToTopLevelMessageAndReadsErrorAsCode() {
        TurboDocxException ex = failWith(400,
                "{\"message\":\"A sender email is required for API-key requests.\",\"error\":\"SenderEmailRequired\"}");

        assertEquals("A sender email is required for API-key requests.", ex.getMessage());
        // `error` alongside a `message` is the CODE, not the message.
        assertEquals("SenderEmailRequired", ex.getCode());
    }

    @Test
    void emptyErrorsArrayDoesNotBlankTheMessage() {
        TurboDocxException ex = failWith(400,
                "{\"message\":\"There was an issue validating the body\",\"data\":{\"errors\":[]}}");

        assertEquals("There was an issue validating the body", ex.getMessage());
    }

    @Test
    void readsMessageAndCodeFromNestedErrorObject() {
        TurboDocxException ex = failWith(404,
                "{\"error\":{\"message\":\"Quote not found\",\"code\":\"QUOTE_NOT_FOUND\"}}");

        assertEquals("Quote not found", ex.getMessage());
        assertEquals("QUOTE_NOT_FOUND", ex.getCode());
    }

    @Test
    void surfacesTopLevelErrorsArrayForBulk() {
        TurboDocxException ex = failWith(400,
                "{\"message\":\"Bulk validation failed\",\"type\":\"BulkValidationFailed\","
                        + "\"errors\":[{\"message\":\"Row 1 invalid\"},{\"message\":\"Row 3 required\"}]}");

        assertTrue(ex.getMessage().contains("Row 1 invalid"));
        assertTrue(ex.getMessage().contains("Row 3 required"));
    }

    @Test
    void readsCodeFromTopLevelType() {
        TurboDocxException ex = failWith(400,
                "{\"message\":\"Recipient name is required\",\"type\":\"RecipientNameRequired\"}");

        assertEquals("RecipientNameRequired", ex.getCode());
    }

    @Test
    void loneErrorStringIsTheMessageNotTheCode() {
        // SingleStepRoutes sends {error: <message>, code: <type>}.
        TurboDocxException ex = failWith(400,
                "{\"error\":\"Document could not be prepared\",\"code\":\"TemplateProcessingFailed\"}");

        assertEquals("Document could not be prepared", ex.getMessage());
        assertEquals("TemplateProcessingFailed", ex.getCode());
    }

    @Test
    void fallsBackToClassDefaultCodeWhenApiSendsNone() {
        // Not every backend error carries a code, but getCode() must still be branchable —
        // so the class default fills the gap. Matches the other five SDKs.
        TurboDocxException ex = failWith(404, "{\"message\":\"Resource missing\"}");

        assertEquals("NOT_FOUND", ex.getCode());
    }

    @Test
    void apiSuppliedCodeWinsOverClassDefault() {
        // The default must never mask a real code the backend sent.
        TurboDocxException ex = failWith(404,
                "{\"message\":\"Quote missing\",\"code\":\"QUOTE_NOT_FOUND\"}");

        assertEquals("QUOTE_NOT_FOUND", ex.getCode());
    }

    @Test
    void everyExceptionSubclassCarriesADefaultCode() {
        // Parity guard: all six SDKs populate `code` for every typed error.
        assertEquals("AUTHENTICATION_ERROR", new TurboDocxException.AuthenticationException("x").getCode());
        assertEquals("AUTHORIZATION_ERROR", new TurboDocxException.AuthorizationException("x").getCode());
        assertEquals("VALIDATION_ERROR", new TurboDocxException.ValidationException("x").getCode());
        assertEquals("NOT_FOUND", new TurboDocxException.NotFoundException("x").getCode());
        assertEquals("CONFLICT", new TurboDocxException.ConflictException("x").getCode());
        assertEquals("RATE_LIMIT_EXCEEDED", new TurboDocxException.RateLimitException("x").getCode());
        assertEquals("NETWORK_ERROR", new TurboDocxException.NetworkException("x").getCode());
    }
}
