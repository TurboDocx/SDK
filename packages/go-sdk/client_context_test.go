package turbodocx

import (
	"context"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/stretchr/testify/require"
)

// captureHeaders points an HTTPClient (built with the given client context) at a
// test server and returns the headers the server received for a GET request.
// This is the Go analog of the JS test inspecting the headers passed to fetch.
func captureHeaders(t *testing.T, ctx ClientContext) http.Header {
	t.Helper()
	var got http.Header
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		got = r.Header.Clone()
		w.Header().Set("Content-Type", "application/json")
		_, _ = w.Write([]byte(`{"data":{"ok":true}}`))
	}))
	defer server.Close()

	client := NewHTTPClient(ClientConfig{
		APIKey:        "TDX-test-key",
		OrgID:         "test-org-id",
		BaseURL:       server.URL,
		ClientContext: ctx,
	})
	var out map[string]interface{}
	require.NoError(t, client.Get(context.Background(), "/api/test", &out))
	return got
}

func TestSendsDescriptiveTurboDocxSDKUserAgentByDefault(t *testing.T) {
	ua := captureHeaders(t, ClientContext{}).Get("User-Agent")
	require.True(t, strings.HasPrefix(ua, "@turbodocx/sdk/"), "got %q", ua)
	require.NotContains(t, ua, "Go-http-client")
}

func TestLetsCallerOverrideUserAgent(t *testing.T) {
	ua := captureHeaders(t, ClientContext{UserAgent: "my-app/9.9 (worker)"}).Get("User-Agent")
	require.Equal(t, "my-app/9.9 (worker)", ua)
}

func TestSendsAcceptLanguageFromHostLocaleByDefault(t *testing.T) {
	t.Setenv("LC_ALL", "")
	t.Setenv("LC_MESSAGES", "")
	t.Setenv("LANG", "en_US.UTF-8")
	require.Equal(t, "en-US", resolveClientContextHeaders(ClientContext{})["Accept-Language"])
}

func TestLetsCallerOverrideLanguage(t *testing.T) {
	require.Equal(t, "fr-FR", captureHeaders(t, ClientContext{Language: "fr-FR"}).Get("Accept-Language"))
}

func TestLetsCallerOverrideTimezone(t *testing.T) {
	require.Equal(t, "America/New_York", captureHeaders(t, ClientContext{Timezone: "America/New_York"}).Get("X-Timezone"))
}

func TestDoesNotSendForwardedForByDefault(t *testing.T) {
	require.Empty(t, captureHeaders(t, ClientContext{}).Get("X-Forwarded-For"))
}

func TestSendsForwardedForWhenCallerSuppliesIP(t *testing.T) {
	require.Equal(t, "203.0.113.7", captureHeaders(t, ClientContext{IPAddress: "203.0.113.7"}).Get("X-Forwarded-For"))
}

func TestSendsDeviceFingerprintByDefaultAndHonorsOverride(t *testing.T) {
	require.NotEmpty(t, captureHeaders(t, ClientContext{}).Get("X-Device-Fingerprint"))
	require.Equal(t, "fp-abc", captureHeaders(t, ClientContext{DeviceFingerprint: "fp-abc"}).Get("X-Device-Fingerprint"))
}

func TestPreservesAuthOrgAndContentType(t *testing.T) {
	h := captureHeaders(t, ClientContext{})
	require.Equal(t, "Bearer TDX-test-key", h.Get("Authorization"))
	require.Equal(t, "test-org-id", h.Get("x-rapiddocx-org-id"))
	require.Equal(t, "application/json", h.Get("Content-Type"))
}

func TestAppliesContextHeadersOnMultipartUploads(t *testing.T) {
	var got http.Header
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		got = r.Header.Clone()
		w.Header().Set("Content-Type", "application/json")
		_, _ = w.Write([]byte(`{"data":{"ok":true}}`))
	}))
	defer server.Close()

	client := NewHTTPClient(ClientConfig{
		APIKey:        "TDX-test-key",
		OrgID:         "test-org-id",
		BaseURL:       server.URL,
		ClientContext: ClientContext{IPAddress: "203.0.113.7"},
	})
	var out map[string]interface{}
	require.NoError(t, client.UploadFile(context.Background(), "/turbosign/single/prepare-for-review",
		[]byte("%PDF-1.4 test"), "doc.pdf", map[string]string{"documentName": "x"}, &out))

	require.True(t, strings.HasPrefix(got.Get("User-Agent"), "@turbodocx/sdk/"))
	require.Equal(t, "203.0.113.7", got.Get("X-Forwarded-For"))
	// Multipart Content-Type must carry the multipart boundary, not application/json.
	require.Contains(t, got.Get("Content-Type"), "multipart/form-data")
}
