package com.turbodocx;

import com.google.gson.JsonObject;
import okhttp3.mockwebserver.MockResponse;
import okhttp3.mockwebserver.MockWebServer;
import okhttp3.mockwebserver.RecordedRequest;
import org.junit.jupiter.api.*;

import java.io.IOException;
import java.util.HashMap;
import java.util.Locale;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Client-context header tests (parity with JS tests/http-client-context.test.ts).
 *
 * The audit trail records device/location from request headers. The SDK must
 * send a descriptive User-Agent starting with "@turbodocx/sdk/", a timezone, a
 * language, an optional client IP (X-Forwarded-For -> geolocation), and a
 * device fingerprint. Uses OkHttp MockWebServer to capture the sent headers.
 */
class ClientContextTest {

    private MockWebServer server;

    @BeforeEach
    void setUp() throws IOException {
        server = new MockWebServer();
        server.start();
    }

    @AfterEach
    void tearDown() throws IOException {
        server.shutdown();
    }

    private HttpClient clientWith(ClientContext ctx) {
        return new HttpClient(server.url("/").toString(), "TDX-test-key", null, "test-org-id",
                "support@example.com", null, 60, 120, 60, ctx);
    }

    private RecordedRequest fireGet(ClientContext ctx) throws Exception {
        server.enqueue(new MockResponse().setHeader("Content-Type", "application/json").setBody("{\"data\":{\"ok\":true}}"));
        clientWith(ctx).get("/api/test", JsonObject.class);
        return server.takeRequest();
    }

    @Test
    void sendsDescriptiveTurboDocxSdkUserAgentByDefault() throws Exception {
        String ua = fireGet(ClientContext.autoDetect()).getHeader("User-Agent");
        assertTrue(ua.startsWith("@turbodocx/sdk/"), "got " + ua);
        assertFalse(ua.contains("okhttp"));
    }

    @Test
    void letsCallerOverrideUserAgent() throws Exception {
        RecordedRequest req = fireGet(ClientContext.builder().userAgent("my-app/9.9 (worker)").build());
        assertEquals("my-app/9.9 (worker)", req.getHeader("User-Agent"));
    }

    @Test
    void sendsAcceptLanguageFromHostLocaleByDefault() throws Exception {
        Locale original = Locale.getDefault();
        try {
            Locale.setDefault(Locale.forLanguageTag("en-US"));
            assertEquals("en-US", fireGet(ClientContext.autoDetect()).getHeader("Accept-Language"));
        } finally {
            Locale.setDefault(original);
        }
    }

    @Test
    void letsCallerOverrideLanguage() throws Exception {
        assertEquals("fr-FR", fireGet(ClientContext.builder().language("fr-FR").build()).getHeader("Accept-Language"));
    }

    @Test
    void letsCallerOverrideTimezone() throws Exception {
        assertEquals("America/New_York",
                fireGet(ClientContext.builder().timezone("America/New_York").build()).getHeader("X-Timezone"));
    }

    @Test
    void doesNotSendForwardedForByDefault() throws Exception {
        assertNull(fireGet(ClientContext.autoDetect()).getHeader("X-Forwarded-For"));
    }

    @Test
    void sendsForwardedForWhenCallerSuppliesIp() throws Exception {
        assertEquals("203.0.113.7",
                fireGet(ClientContext.builder().ipAddress("203.0.113.7").build()).getHeader("X-Forwarded-For"));
    }

    @Test
    void sendsDeviceFingerprintByDefaultAndHonorsOverride() throws Exception {
        assertNotNull(fireGet(ClientContext.autoDetect()).getHeader("X-Device-Fingerprint"));
        assertEquals("fp-abc",
                fireGet(ClientContext.builder().deviceFingerprint("fp-abc").build()).getHeader("X-Device-Fingerprint"));
    }

    @Test
    void preservesAuthAndOrgHeaders() throws Exception {
        RecordedRequest req = fireGet(ClientContext.autoDetect());
        assertEquals("Bearer TDX-test-key", req.getHeader("Authorization"));
        assertEquals("test-org-id", req.getHeader("x-rapiddocx-org-id"));
    }

    @Test
    void appliesContextHeadersOnMultipartUploads() throws Exception {
        server.enqueue(new MockResponse().setHeader("Content-Type", "application/json").setBody("{\"data\":{\"ok\":true}}"));
        Map<String, String> form = new HashMap<>();
        form.put("documentName", "x");
        clientWith(ClientContext.builder().ipAddress("203.0.113.7").build())
                .uploadFile("/turbosign/single/prepare-for-review", "%PDF-1.4 test".getBytes(), "doc.pdf", form, JsonObject.class);

        RecordedRequest req = server.takeRequest();
        assertTrue(req.getHeader("User-Agent").startsWith("@turbodocx/sdk/"));
        assertEquals("203.0.113.7", req.getHeader("X-Forwarded-For"));
        assertTrue(req.getHeader("Content-Type").contains("multipart/form-data"));
    }
}
