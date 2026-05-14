package com.turbodocx;

import org.junit.jupiter.api.Test;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.security.NoSuchAlgorithmException;
import java.security.InvalidKeyException;

import static org.junit.jupiter.api.Assertions.*;

class WebhookSignatureVerifierTest {

    private static final String SECRET = "whsec_test_secret_xyz";
    private static final String BODY = "{\"event\":\"signature.document.completed\",\"documentId\":\"doc-1\"}";
    private static final long NOW_SECONDS = 1747000000L;
    private static final String TIMESTAMP = String.valueOf(NOW_SECONDS);

    private static String sign(String body, String timestamp, String secret)
            throws NoSuchAlgorithmException, InvalidKeyException {
        Mac mac = Mac.getInstance("HmacSHA256");
        mac.init(new SecretKeySpec(secret.getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
        mac.update((timestamp + ".").getBytes(StandardCharsets.UTF_8));
        byte[] digest = mac.doFinal(body.getBytes(StandardCharsets.UTF_8));
        StringBuilder sb = new StringBuilder("sha256=");
        for (byte b : digest) {
            sb.append(Character.forDigit((b >> 4) & 0xF, 16));
            sb.append(Character.forDigit(b & 0xF, 16));
        }
        return sb.toString();
    }

    @Test
    void acceptsValidSignatureWithinWindow() throws Exception {
        String sig = sign(BODY, TIMESTAMP, SECRET);
        assertTrue(WebhookSignatureVerifier.verify(
                BODY.getBytes(StandardCharsets.UTF_8),
                sig, TIMESTAMP, SECRET, 300, () -> NOW_SECONDS));
    }

    @Test
    void rejectsTamperedBody() throws Exception {
        String sig = sign(BODY, TIMESTAMP, SECRET);
        assertFalse(WebhookSignatureVerifier.verify(
                (BODY + "tampered").getBytes(StandardCharsets.UTF_8),
                sig, TIMESTAMP, SECRET, 300, () -> NOW_SECONDS));
    }

    @Test
    void rejectsStaleTimestamp() throws Exception {
        String sig = sign(BODY, TIMESTAMP, SECRET);
        assertFalse(WebhookSignatureVerifier.verify(
                BODY.getBytes(StandardCharsets.UTF_8),
                sig, TIMESTAMP, SECRET, 300, () -> NOW_SECONDS + 301));
    }

    @Test
    void rejectsFutureTimestamp() throws Exception {
        String sig = sign(BODY, TIMESTAMP, SECRET);
        assertFalse(WebhookSignatureVerifier.verify(
                BODY.getBytes(StandardCharsets.UTF_8),
                sig, TIMESTAMP, SECRET, 300, () -> NOW_SECONDS - 301));
    }

    @Test
    void zeroToleranceDisablesTimestampCheck() throws Exception {
        String sig = sign(BODY, TIMESTAMP, SECRET);
        assertTrue(WebhookSignatureVerifier.verify(
                BODY.getBytes(StandardCharsets.UTF_8),
                sig, TIMESTAMP, SECRET, 0, () -> NOW_SECONDS + 99999));
    }

    @Test
    void rejectsMissingSignature() {
        assertFalse(WebhookSignatureVerifier.verify(BODY, "", TIMESTAMP, SECRET));
    }

    @Test
    void rejectsMissingTimestamp() throws Exception {
        String sig = sign(BODY, TIMESTAMP, SECRET);
        assertFalse(WebhookSignatureVerifier.verify(BODY, sig, "", SECRET));
    }

    @Test
    void rejectsMissingSecret() throws Exception {
        String sig = sign(BODY, TIMESTAMP, SECRET);
        assertFalse(WebhookSignatureVerifier.verify(BODY, sig, TIMESTAMP, ""));
    }

    @Test
    void rejectsNonNumericTimestamp() throws Exception {
        String sig = sign(BODY, TIMESTAMP, SECRET);
        assertFalse(WebhookSignatureVerifier.verify(
                BODY.getBytes(StandardCharsets.UTF_8),
                sig, "not-a-number", SECRET, 300, () -> NOW_SECONDS));
    }

    @Test
    void rejectsLengthMismatchedSignature() throws Exception {
        assertFalse(WebhookSignatureVerifier.verify(
                BODY.getBytes(StandardCharsets.UTF_8),
                "sha256=short", TIMESTAMP, SECRET, 300, () -> NOW_SECONDS));
    }

    @Test
    void stringBodyOverloadUsesDefaultTolerance() throws Exception {
        String sig = sign(BODY, String.valueOf(System.currentTimeMillis() / 1000), SECRET);
        // Pass current time so the default 300s window is within tolerance.
        assertTrue(WebhookSignatureVerifier.verify(
                BODY,
                sig,
                String.valueOf(System.currentTimeMillis() / 1000),
                SECRET));
    }
}
