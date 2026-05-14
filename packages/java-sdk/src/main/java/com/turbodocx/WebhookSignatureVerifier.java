package com.turbodocx;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.InvalidKeyException;
import java.time.Instant;
import java.util.function.LongSupplier;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;

/**
 * Webhook signature verification helper.
 *
 * <p>Verifies the {@code X-TurboDocx-Signature} header on an incoming webhook
 * delivery. Format matches the backend's {@code webhookService.generateSignature}:</p>
 * <ul>
 *   <li>Header:        {@code X-TurboDocx-Signature: sha256=<hex>}</li>
 *   <li>Timestamp:     {@code X-TurboDocx-Timestamp: <unix-seconds>}</li>
 *   <li>String signed: {@code timestamp + "." + rawBody}</li>
 *   <li>Algorithm:     HMAC-SHA256</li>
 * </ul>
 *
 * <p>Enforces a configurable timestamp tolerance (default 300s) to prevent
 * replay attacks. Uses {@link MessageDigest#isEqual} for constant-time
 * byte comparison.</p>
 */
public final class WebhookSignatureVerifier {

    /** Default timestamp tolerance in seconds (5 minutes). */
    public static final int DEFAULT_TOLERANCE_SECONDS = 300;

    private WebhookSignatureVerifier() {
        // utility class
    }

    /**
     * Verify a TurboDocx webhook delivery using the default 300s tolerance.
     *
     * @param rawBody         the raw request body bytes AS RECEIVED
     * @param signatureHeader value of the {@code X-TurboDocx-Signature} header
     *                        (format: {@code sha256=<hex>})
     * @param timestampHeader value of the {@code X-TurboDocx-Timestamp} header
     *                        (Unix epoch seconds, as string)
     * @param secret          webhook secret returned by createWebhook or
     *                        regenerateWebhookSecret
     * @return true iff the signature is valid AND the timestamp is within
     *         tolerance
     */
    public static boolean verify(byte[] rawBody, String signatureHeader,
                                 String timestampHeader, String secret) {
        return verify(rawBody, signatureHeader, timestampHeader, secret,
                DEFAULT_TOLERANCE_SECONDS, null);
    }

    /**
     * Verify using a String body (convenience overload).
     */
    public static boolean verify(String rawBody, String signatureHeader,
                                 String timestampHeader, String secret) {
        if (rawBody == null) return false;
        return verify(rawBody.getBytes(StandardCharsets.UTF_8),
                signatureHeader, timestampHeader, secret);
    }

    /**
     * Verify with full options.
     *
     * @param rawBody          the raw request body bytes AS RECEIVED. Do NOT
     *                         parse JSON first; do NOT re-serialize. Whitespace
     *                         must match exactly.
     * @param signatureHeader  value of the {@code X-TurboDocx-Signature}
     *                         header (format: {@code sha256=<hex>})
     * @param timestampHeader  value of the {@code X-TurboDocx-Timestamp}
     *                         header (Unix epoch seconds, as string)
     * @param secret           webhook secret
     * @param toleranceSeconds maximum acceptable age of the timestamp.
     *                         Set to 0 to disable the check (NOT recommended).
     * @param now              optional override of "current time" for testing.
     *                         Returns Unix epoch seconds. If null, uses
     *                         {@link Instant#now()}.
     * @return true iff the signature is valid AND timestamp within tolerance
     */
    public static boolean verify(byte[] rawBody, String signatureHeader,
                                 String timestampHeader, String secret,
                                 int toleranceSeconds, LongSupplier now) {
        if (rawBody == null || signatureHeader == null || signatureHeader.isEmpty()
                || timestampHeader == null || timestampHeader.isEmpty()
                || secret == null || secret.isEmpty()) {
            return false;
        }

        if (toleranceSeconds > 0) {
            final long ts;
            try {
                ts = Long.parseLong(timestampHeader);
            } catch (NumberFormatException e) {
                return false;
            }
            long currentTime = (now != null) ? now.getAsLong() : Instant.now().getEpochSecond();
            if (Math.abs(currentTime - ts) > toleranceSeconds) {
                return false;
            }
        }

        byte[] expected;
        try {
            Mac mac = Mac.getInstance("HmacSHA256");
            mac.init(new SecretKeySpec(secret.getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
            byte[] tsBytes = (timestampHeader + ".").getBytes(StandardCharsets.UTF_8);
            mac.update(tsBytes);
            byte[] digest = mac.doFinal(rawBody);
            String expectedString = "sha256=" + bytesToHex(digest);
            expected = expectedString.getBytes(StandardCharsets.UTF_8);
        } catch (NoSuchAlgorithmException | InvalidKeyException e) {
            return false;
        }

        byte[] actual = signatureHeader.getBytes(StandardCharsets.UTF_8);
        return MessageDigest.isEqual(expected, actual);
    }

    private static String bytesToHex(byte[] bytes) {
        StringBuilder sb = new StringBuilder(bytes.length * 2);
        for (byte b : bytes) {
            sb.append(Character.forDigit((b >> 4) & 0xF, 16));
            sb.append(Character.forDigit(b & 0xF, 16));
        }
        return sb.toString();
    }
}
