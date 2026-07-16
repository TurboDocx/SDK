<?php

declare(strict_types=1);

namespace TurboDocx\Types\Enums;

/**
 * The 7 TurboSign webhook events.
 *
 * `TurboWebhooks::createWebhook()` takes `array<int, string>`, so pass the
 * backing value: `events: [WebhookEvent::COMPLETED->value]`. Raw strings are
 * still accepted, which keeps existing code working and lets the backend add
 * events without an SDK release.
 *
 * On every signature, `recipient_signed` fires first, then exactly one of
 * `completed` / `finalization_failed` (that was the final signature) or
 * `signed` (signers still remain).
 */
enum WebhookEvent: string
{
    /** The document is dispatched to recipients. */
    case SENT = 'signature.document.sent';

    /** A recipient opens the document for the first time. */
    case VIEWED = 'signature.document.viewed';

    /**
     * Any individual signer completes their signature — fires ONCE PER SIGNER,
     * including the last one. The payload carries the signer's identity plus
     * `is_final_signer` (true only on the last signature) and `remaining_signers`.
     *
     * This is the per-person event, and it always fires before the
     * document-level outcome (SIGNED, COMPLETED, or FINALIZATION_FAILED).
     */
    case RECIPIENT_SIGNED = 'signature.document.recipient_signed';

    /**
     * A signer signs but the document is NOT yet complete — document-level
     * partial progress.
     *
     * Two consequences worth internalizing:
     *  - It NEVER fires on the final signature. To detect "the whole document is
     *    done", use COMPLETED (or RECIPIENT_SIGNED with `is_final_signer: true`)
     *    — NOT this event.
     *  - A single-signer document never emits it at all. That document emits
     *    RECIPIENT_SIGNED (`is_final_signer: true`) then COMPLETED.
     */
    case SIGNED = 'signature.document.signed';

    /** All recipients have signed and the signed PDF is finalized. */
    case COMPLETED = 'signature.document.completed';

    /**
     * The signed PDF fails to finalize (e.g. a KMS signing error). The document
     * is NOT completed — this fires INSTEAD OF COMPLETED on the final signature.
     */
    case FINALIZATION_FAILED = 'signature.document.finalization_failed';

    /** The document is voided or cancelled. */
    case VOIDED = 'signature.document.voided';

    /**
     * All 7 event wire strings, in lifecycle order. Pass straight to
     * `createWebhook(events: WebhookEvent::all())` to subscribe to everything.
     *
     * @return array<int, string>
     */
    public static function all(): array
    {
        return array_map(fn(self $event) => $event->value, self::cases());
    }

    /**
     * Alias of all(), mirroring PartnerScope::values().
     *
     * @return array<int, string>
     */
    public static function values(): array
    {
        return self::all();
    }
}
