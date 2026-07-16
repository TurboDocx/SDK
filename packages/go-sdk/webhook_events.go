package turbodocx

// ============================================
// Webhook Events
// ============================================

// WebhookEvent is the wire string for a TurboSign webhook event.
//
// The Events fields on CreateWebhookRequest and UpdateWebhookRequest remain
// []string, so code that already passes raw strings keeps compiling and the
// backend can add events without an SDK release. Convert a typed event with
// string(event), or build the whole slice with WebhookEventStrings.
type WebhookEvent string

const (
	// WebhookEventSent fires when the document is dispatched to recipients.
	WebhookEventSent WebhookEvent = "signature.document.sent"

	// WebhookEventViewed fires when a recipient opens the document for the
	// first time.
	WebhookEventViewed WebhookEvent = "signature.document.viewed"

	// WebhookEventRecipientSigned fires when any individual signer completes
	// their signature — once PER SIGNER, including the last one. The payload
	// carries the signer's identity plus is_final_signer (true only on the last
	// signature) and remaining_signers.
	//
	// This is the per-person event, and it always fires before the
	// document-level outcome (signed, completed, or finalization_failed).
	WebhookEventRecipientSigned WebhookEvent = "signature.document.recipient_signed"

	// WebhookEventSigned fires when a signer signs but the document is NOT yet
	// complete — document-level partial progress.
	//
	// Two consequences worth internalizing:
	//   - It NEVER fires on the final signature. To detect "the whole document
	//     is done", use WebhookEventCompleted (or WebhookEventRecipientSigned
	//     with is_final_signer: true) — NOT this event.
	//   - A single-signer document never emits it at all. That document emits
	//     recipient_signed (is_final_signer: true) then completed.
	WebhookEventSigned WebhookEvent = "signature.document.signed"

	// WebhookEventCompleted fires when all recipients have signed and the
	// signed PDF is finalized.
	WebhookEventCompleted WebhookEvent = "signature.document.completed"

	// WebhookEventFinalizationFailed fires when the signed PDF fails to
	// finalize (e.g. a KMS signing error). The document is NOT completed —
	// this fires INSTEAD OF completed on the final signature.
	WebhookEventFinalizationFailed WebhookEvent = "signature.document.finalization_failed"

	// WebhookEventVoided fires when the document is voided or cancelled.
	WebhookEventVoided WebhookEvent = "signature.document.voided"
)

// AllWebhookEvents holds all 7 TurboSign webhook events, in lifecycle order.
//
// Every signature fires recipient_signed first, then exactly one of
// completed / finalization_failed (that was the final signature) or signed
// (signers still remain).
var AllWebhookEvents = []WebhookEvent{
	WebhookEventSent,
	WebhookEventViewed,
	WebhookEventRecipientSigned,
	WebhookEventSigned,
	WebhookEventCompleted,
	WebhookEventFinalizationFailed,
	WebhookEventVoided,
}

// String returns the event's wire string.
func (e WebhookEvent) String() string {
	return string(e)
}

// WebhookEventStrings converts typed events into the []string form taken by
// CreateWebhookRequest.Events and UpdateWebhookRequest.Events.
//
//	Events: turbodocx.WebhookEventStrings(
//	    turbodocx.WebhookEventRecipientSigned,
//	    turbodocx.WebhookEventCompleted,
//	)
//
//	// ...or subscribe to everything:
//	Events: turbodocx.WebhookEventStrings(turbodocx.AllWebhookEvents...)
func WebhookEventStrings(events ...WebhookEvent) []string {
	out := make([]string, len(events))
	for i, e := range events {
		out[i] = string(e)
	}
	return out
}
