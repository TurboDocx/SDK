package turbodocx

import (
	"crypto/hmac"
	"crypto/sha256"
	"encoding/hex"
	"strconv"
	"time"
)

// DefaultWebhookToleranceSeconds is the default tolerance window for the
// X-TurboDocx-Timestamp header. Deliveries with a timestamp older or newer
// than this are rejected by VerifyWebhookSignature to prevent replay attacks.
const DefaultWebhookToleranceSeconds = 300

// VerifyWebhookSignatureOptions configures VerifyWebhookSignature.
type VerifyWebhookSignatureOptions struct {
	// ToleranceSeconds is the maximum acceptable age of the timestamp header,
	// in seconds. 0 means use DefaultWebhookToleranceSeconds. A negative value
	// disables the timestamp check entirely (NOT recommended in production).
	ToleranceSeconds int

	// Now overrides the "current time" function for deterministic testing.
	// Returns Unix epoch seconds. If nil, time.Now().Unix() is used.
	Now func() int64
}

// VerifyWebhookSignature verifies a TurboDocx webhook delivery.
//
// Format matches the backend's webhookService.generateSignature:
//
//	Header:        X-TurboDocx-Signature: sha256=<hex>
//	Timestamp:     X-TurboDocx-Timestamp: <unix-seconds>
//	String signed: timestamp + "." + rawBody
//	Algorithm:     HMAC-SHA256
//
// rawBody must be the raw request bytes AS RECEIVED. Do NOT parse JSON
// first; do NOT re-serialize. Whitespace must match exactly. Constant-time
// comparison via hmac.Equal.
//
// Returns true iff the signature is valid AND the timestamp is within
// tolerance.
func VerifyWebhookSignature(rawBody []byte, signatureHeader, timestampHeader, secret string, opts *VerifyWebhookSignatureOptions) bool {
	if signatureHeader == "" || timestampHeader == "" || secret == "" {
		return false
	}

	tolerance := DefaultWebhookToleranceSeconds
	var nowFunc func() int64
	if opts != nil {
		if opts.ToleranceSeconds != 0 {
			tolerance = opts.ToleranceSeconds
		}
		nowFunc = opts.Now
	}

	if tolerance > 0 {
		ts, err := strconv.ParseInt(timestampHeader, 10, 64)
		if err != nil {
			return false
		}
		var current int64
		if nowFunc != nil {
			current = nowFunc()
		} else {
			current = time.Now().Unix()
		}
		diff := current - ts
		if diff < 0 {
			diff = -diff
		}
		if diff > int64(tolerance) {
			return false
		}
	}

	mac := hmac.New(sha256.New, []byte(secret))
	mac.Write([]byte(timestampHeader + "."))
	mac.Write(rawBody)
	expected := "sha256=" + hex.EncodeToString(mac.Sum(nil))

	return hmac.Equal([]byte(expected), []byte(signatureHeader))
}
