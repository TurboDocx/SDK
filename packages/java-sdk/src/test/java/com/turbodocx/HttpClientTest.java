package com.turbodocx;

import okhttp3.mockwebserver.MockResponse;
import okhttp3.mockwebserver.MockWebServer;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.io.IOException;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

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
}
