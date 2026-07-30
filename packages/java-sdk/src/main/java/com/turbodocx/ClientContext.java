package com.turbodocx;

import java.net.InetAddress;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.LinkedHashMap;
import java.util.Locale;
import java.util.Map;
import java.util.TimeZone;

/**
 * Client-context detection for audit-trail device/location reporting.
 *
 * <p>The TurboDocx backend derives the signature audit trail's device + location
 * from the request's {@code User-Agent}, {@code X-Timezone}, {@code Accept-Language},
 * {@code X-Forwarded-For} and {@code X-Device-Fingerprint} headers. When the SDK
 * runs in a container/VM these should describe that environment instead of
 * defaulting to the HTTP library's generic User-Agent (recorded as device
 * "Unknown") and a loopback/proxy IP (location "Unknown").
 *
 * <p>The backend only classifies a request as an SDK call when the User-Agent
 * starts with the canonical {@code @turbodocx/sdk/<version>} token, so the
 * auto-generated User-Agent always uses that prefix.
 *
 * <p>Everything here is best-effort: detection failures degrade to a bare SDK
 * User-Agent rather than throwing.
 */
public final class ClientContext {
    private final String userAgent;
    private final String ipAddress;
    private final String timezone;
    private final String language;
    private final String deviceFingerprint;

    private ClientContext(Builder b) {
        this.userAgent = b.userAgent;
        this.ipAddress = b.ipAddress;
        this.timezone = b.timezone;
        this.language = b.language;
        this.deviceFingerprint = b.deviceFingerprint;
    }

    public static Builder builder() {
        return new Builder();
    }

    /** A context with no overrides — every field is auto-detected from the host. */
    public static ClientContext autoDetect() {
        return new Builder().build();
    }

    /** Fluent builder for caller overrides. */
    public static final class Builder {
        private String userAgent;
        private String ipAddress;
        private String timezone;
        private String language;
        private String deviceFingerprint;

        /** Override the auto-generated descriptive User-Agent. */
        public Builder userAgent(String v) { this.userAgent = v; return this; }

        /**
         * Client IP reported as X-Forwarded-For to drive geolocation. Opt-in:
         * omitted by default so a container's private IP never overrides the
         * production load balancer's real public IP (X-Forwarded-For is leftmost-wins).
         */
        public Builder ipAddress(String v) { this.ipAddress = v; return this; }

        /** Override the auto-detected timezone (sent as X-Timezone). */
        public Builder timezone(String v) { this.timezone = v; return this; }

        /** Override the auto-detected BCP-47 language tag (sent as Accept-Language). */
        public Builder language(String v) { this.language = v; return this; }

        /** Override the auto-generated device fingerprint (X-Device-Fingerprint). */
        public Builder deviceFingerprint(String v) { this.deviceFingerprint = v; return this; }

        public ClientContext build() { return new ClientContext(this); }
    }

    /**
     * Resolve the effective client-context request headers, applying caller
     * overrides over auto-detected host values.
     */
    public static Map<String, String> resolveHeaders(ClientContext ctx) {
        Map<String, String> headers = new LinkedHashMap<>();

        headers.put("User-Agent",
                (ctx != null && notBlank(ctx.userAgent)) ? ctx.userAgent : buildDefaultUserAgent());

        String tz = (ctx != null && notBlank(ctx.timezone)) ? ctx.timezone : detectTimezone();
        if (notBlank(tz)) {
            headers.put("X-Timezone", tz);
        }

        String lang = (ctx != null && notBlank(ctx.language)) ? ctx.language : detectLocale();
        if (notBlank(lang)) {
            headers.put("Accept-Language", lang);
        }

        String fp = (ctx != null && notBlank(ctx.deviceFingerprint))
                ? ctx.deviceFingerprint : buildDeviceFingerprint();
        if (notBlank(fp)) {
            headers.put("X-Device-Fingerprint", fp);
        }

        // Opt-in only (see Builder.ipAddress).
        if (ctx != null && notBlank(ctx.ipAddress)) {
            headers.put("X-Forwarded-For", ctx.ipAddress);
        }

        return headers;
    }

    private static boolean notBlank(String s) {
        return s != null && !s.isEmpty();
    }

    // Lockstep SDK version, kept in sync with pom.xml <version> and the other SDKs
    // (see .claude/rules/versioning.md). Used as the source of truth for the
    // User-Agent because the JAR manifest's Implementation-Version is only present
    // in a packaged jar built with the manifest entry — it is null when running
    // from classes/ (tests) or a jar built without it, which silently reported 0.0.0.
    static final String VERSION = "0.6.1";

    private static String getSdkVersion() {
        try {
            String v = ClientContext.class.getPackage().getImplementationVersion();
            if (notBlank(v)) {
                return v;
            }
        } catch (Exception ignored) {
            // fall through
        }
        return VERSION;
    }

    static String buildDefaultUserAgent() {
        String base = "@turbodocx/sdk/" + getSdkVersion();
        try {
            String runtime = "Java/" + System.getProperty("java.version", "");
            String osName = (System.getProperty("os.name", "") + " " + System.getProperty("os.version", "")).trim();
            String arch = System.getProperty("os.arch", "");
            String host = detectHostname();
            if (!notBlank(host)) {
                return base;
            }
            return base + " (" + runtime + "; " + osName + "; " + arch + "; host=" + host + ")";
        } catch (Exception e) {
            return base;
        }
    }

    static String detectTimezone() {
        try {
            return TimeZone.getDefault().getID();
        } catch (Exception e) {
            return "";
        }
    }

    static String detectLocale() {
        try {
            String tag = Locale.getDefault().toLanguageTag();
            if (!notBlank(tag) || "und".equals(tag)) {
                return "";
            }
            return tag;
        } catch (Exception e) {
            return "";
        }
    }

    private static String detectHostname() {
        try {
            String h = InetAddress.getLocalHost().getHostName();
            if (notBlank(h)) {
                return h;
            }
        } catch (Exception ignored) {
            // fall through to environment
        }
        String env = System.getenv("HOSTNAME");
        if (!notBlank(env)) {
            env = System.getenv("COMPUTERNAME");
        }
        return env != null ? env : "";
    }

    static String buildDeviceFingerprint() {
        try {
            String host = detectHostname();
            if (!notBlank(host)) {
                return "";
            }
            String seed = String.join("|", host,
                    System.getProperty("os.name", ""), System.getProperty("os.arch", ""));
            MessageDigest md = MessageDigest.getInstance("SHA-256");
            byte[] digest = md.digest(seed.getBytes(StandardCharsets.UTF_8));
            StringBuilder sb = new StringBuilder(digest.length * 2);
            for (byte b : digest) {
                sb.append(String.format("%02x", b));
            }
            return sb.toString();
        } catch (Exception e) {
            return "";
        }
    }
}
