package turbodocx

import (
	"crypto/hmac"
	"crypto/sha256"
	"encoding/hex"
	"strconv"
	"testing"

	"github.com/stretchr/testify/assert"
)

const (
	testSecret     = "whsec_test_secret_xyz"
	testBody       = `{"event":"signature.document.completed","documentId":"doc-1"}`
	testNowSeconds = int64(1747000000)
)

var testTimestamp = strconv.FormatInt(testNowSeconds, 10)

func sign(body, timestamp, secret string) string {
	mac := hmac.New(sha256.New, []byte(secret))
	mac.Write([]byte(timestamp + "."))
	mac.Write([]byte(body))
	return "sha256=" + hex.EncodeToString(mac.Sum(nil))
}

func nowFn(n int64) func() int64 { return func() int64 { return n } }

func TestVerifyWebhookSignature(t *testing.T) {
	t.Run("accepts valid signature within window", func(t *testing.T) {
		sig := sign(testBody, testTimestamp, testSecret)
		assert.True(t, VerifyWebhookSignature(
			[]byte(testBody), sig, testTimestamp, testSecret,
			&VerifyWebhookSignatureOptions{Now: nowFn(testNowSeconds)},
		))
	})

	t.Run("rejects tampered body", func(t *testing.T) {
		sig := sign(testBody, testTimestamp, testSecret)
		assert.False(t, VerifyWebhookSignature(
			[]byte(testBody+"tampered"), sig, testTimestamp, testSecret,
			&VerifyWebhookSignatureOptions{Now: nowFn(testNowSeconds)},
		))
	})

	t.Run("rejects stale timestamp (older than tolerance)", func(t *testing.T) {
		sig := sign(testBody, testTimestamp, testSecret)
		assert.False(t, VerifyWebhookSignature(
			[]byte(testBody), sig, testTimestamp, testSecret,
			&VerifyWebhookSignatureOptions{Now: nowFn(testNowSeconds + 301)},
		))
	})

	t.Run("rejects future timestamp (further than tolerance)", func(t *testing.T) {
		sig := sign(testBody, testTimestamp, testSecret)
		assert.False(t, VerifyWebhookSignature(
			[]byte(testBody), sig, testTimestamp, testSecret,
			&VerifyWebhookSignatureOptions{Now: nowFn(testNowSeconds - 301)},
		))
	})

	t.Run("negative tolerance disables the timestamp check", func(t *testing.T) {
		sig := sign(testBody, testTimestamp, testSecret)
		assert.True(t, VerifyWebhookSignature(
			[]byte(testBody), sig, testTimestamp, testSecret,
			&VerifyWebhookSignatureOptions{
				ToleranceSeconds: -1,
				Now:              nowFn(testNowSeconds + 99999),
			},
		))
	})

	t.Run("rejects missing signature", func(t *testing.T) {
		assert.False(t, VerifyWebhookSignature(
			[]byte(testBody), "", testTimestamp, testSecret, nil,
		))
	})

	t.Run("rejects missing timestamp", func(t *testing.T) {
		sig := sign(testBody, testTimestamp, testSecret)
		assert.False(t, VerifyWebhookSignature(
			[]byte(testBody), sig, "", testSecret, nil,
		))
	})

	t.Run("rejects missing secret", func(t *testing.T) {
		sig := sign(testBody, testTimestamp, testSecret)
		assert.False(t, VerifyWebhookSignature(
			[]byte(testBody), sig, testTimestamp, "", nil,
		))
	})

	t.Run("rejects non-numeric timestamp", func(t *testing.T) {
		sig := sign(testBody, testTimestamp, testSecret)
		assert.False(t, VerifyWebhookSignature(
			[]byte(testBody), sig, "not-a-number", testSecret,
			&VerifyWebhookSignatureOptions{Now: nowFn(testNowSeconds)},
		))
	})

	t.Run("rejects length-mismatched signature without crashing", func(t *testing.T) {
		assert.False(t, VerifyWebhookSignature(
			[]byte(testBody), "sha256=short", testTimestamp, testSecret,
			&VerifyWebhookSignatureOptions{Now: nowFn(testNowSeconds)},
		))
	})
}
