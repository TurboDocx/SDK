package com.turbodocx;

import com.google.gson.annotations.SerializedName;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

/**
 * The 7 TurboSign webhook events.
 *
 * <p>{@link TurboWebhooks#createWebhook(List, List)} takes {@code List<String>},
 * so pass {@link #getValue()}:</p>
 *
 * <pre>{@code
 * webhooks.createWebhook(
 *     List.of("https://your-server.example.com/webhooks/turbodocx"),
 *     List.of(WebhookEvent.RECIPIENT_SIGNED.getValue(), WebhookEvent.COMPLETED.getValue()));
 *
 * // ...or subscribe to everything:
 * webhooks.createWebhook(urls, WebhookEvent.allValues());
 * }</pre>
 *
 * <p>Raw strings are still accepted, which keeps existing code working and lets
 * the backend add events without an SDK release.</p>
 *
 * <p>On every signature, {@code recipient_signed} fires first, then exactly one
 * of {@code completed} / {@code finalization_failed} (that was the final
 * signature) or {@code signed} (signers still remain).</p>
 */
public enum WebhookEvent {

    /** The document is dispatched to recipients. */
    @SerializedName("signature.document.sent")
    SENT("signature.document.sent"),

    /** A recipient opens the document for the first time. */
    @SerializedName("signature.document.viewed")
    VIEWED("signature.document.viewed"),

    /**
     * Any individual signer completes their signature — fires <strong>once per
     * signer</strong>, including the last one. The payload carries the signer's
     * identity plus {@code is_final_signer} (true only on the last signature)
     * and {@code remaining_signers}.
     *
     * <p>This is the per-person event, and it always fires <em>before</em> the
     * document-level outcome ({@link #SIGNED}, {@link #COMPLETED}, or
     * {@link #FINALIZATION_FAILED}).</p>
     */
    @SerializedName("signature.document.recipient_signed")
    RECIPIENT_SIGNED("signature.document.recipient_signed"),

    /**
     * A signer signs but the document is <strong>not yet complete</strong> —
     * document-level partial progress.
     *
     * <p>Two consequences worth internalizing:</p>
     * <ul>
     *   <li><strong>It never fires on the final signature.</strong> To detect
     *       "the whole document is done", use {@link #COMPLETED} (or
     *       {@link #RECIPIENT_SIGNED} with {@code is_final_signer: true}) — NOT
     *       this event.</li>
     *   <li><strong>A single-signer document never emits it at all.</strong> That
     *       document emits {@code recipient_signed}
     *       ({@code is_final_signer: true}) then {@code completed}.</li>
     * </ul>
     */
    @SerializedName("signature.document.signed")
    SIGNED("signature.document.signed"),

    /** All recipients have signed and the signed PDF is finalized. */
    @SerializedName("signature.document.completed")
    COMPLETED("signature.document.completed"),

    /**
     * The signed PDF fails to finalize (e.g. a KMS signing error). The document
     * is <strong>not</strong> completed — this fires <em>instead of</em>
     * {@link #COMPLETED} on the final signature.
     */
    @SerializedName("signature.document.finalization_failed")
    FINALIZATION_FAILED("signature.document.finalization_failed"),

    /** The document is voided or cancelled. */
    @SerializedName("signature.document.voided")
    VOIDED("signature.document.voided");

    private final String value;

    WebhookEvent(String value) {
        this.value = value;
    }

    /** The wire string sent to (and received from) the API. */
    public String getValue() {
        return value;
    }

    @Override
    public String toString() {
        return value;
    }

    /**
     * All 7 event wire strings, in lifecycle order. Pass straight to
     * {@code createWebhook(urls, WebhookEvent.allValues())} to subscribe to
     * everything.
     */
    public static List<String> allValues() {
        List<String> values = new ArrayList<>(values().length);
        for (WebhookEvent event : values()) {
            values.add(event.value);
        }
        return Collections.unmodifiableList(values);
    }
}
