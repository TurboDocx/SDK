package turbodocx

import (
	"context"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/stretchr/testify/require"
)

// newTestHTTPClient builds an HTTPClient pointed at the test server.
func newTestHTTPClient(serverURL string) *HTTPClient {
	return NewHTTPClient(ClientConfig{
		APIKey:  "TDX-test-key",
		OrgID:   "test-org-id",
		BaseURL: serverURL,
	})
}

// statusToErrorCase pairs an HTTP status with the typed error the mapper
// must produce.
type statusToErrorCase struct {
	name    string
	status  int
	assertT func(t *testing.T, err error)
}

func runStatusMappingCases(t *testing.T, withJSONBody bool) {
	cases := []statusToErrorCase{
		{
			name:   "400 maps to ValidationError",
			status: 400,
			assertT: func(t *testing.T, err error) {
				_, ok := err.(*ValidationError)
				require.True(t, ok, "expected *ValidationError, got %T", err)
			},
		},
		{
			name:   "401 maps to AuthenticationError",
			status: 401,
			assertT: func(t *testing.T, err error) {
				_, ok := err.(*AuthenticationError)
				require.True(t, ok, "expected *AuthenticationError, got %T", err)
			},
		},
		{
			name:   "403 maps to AuthorizationError",
			status: 403,
			assertT: func(t *testing.T, err error) {
				_, ok := err.(*AuthorizationError)
				require.True(t, ok, "expected *AuthorizationError, got %T", err)
			},
		},
		{
			name:   "404 maps to NotFoundError",
			status: 404,
			assertT: func(t *testing.T, err error) {
				_, ok := err.(*NotFoundError)
				require.True(t, ok, "expected *NotFoundError, got %T", err)
			},
		},
		{
			name:   "409 maps to ConflictError",
			status: 409,
			assertT: func(t *testing.T, err error) {
				ce, ok := err.(*ConflictError)
				require.True(t, ok, "expected *ConflictError, got %T", err)
				require.Equal(t, 409, ce.StatusCode)
			},
		},
		{
			name:   "429 maps to RateLimitError",
			status: 429,
			assertT: func(t *testing.T, err error) {
				_, ok := err.(*RateLimitError)
				require.True(t, ok, "expected *RateLimitError, got %T", err)
			},
		},
		{
			name:   "500 falls back to *TurboDocxError",
			status: 500,
			assertT: func(t *testing.T, err error) {
				_, ok := err.(*TurboDocxError)
				require.True(t, ok, "expected *TurboDocxError, got %T", err)
			},
		},
	}

	for _, tc := range cases {
		tc := tc
		t.Run(tc.name, func(t *testing.T) {
			server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
				if withJSONBody {
					w.Header().Set("Content-Type", "application/json")
				}
				w.WriteHeader(tc.status)
				if withJSONBody {
					_, _ = w.Write([]byte(`{"message":"err"}`))
				}
			}))
			defer server.Close()

			c := newTestHTTPClient(server.URL)
			var out map[string]interface{}
			err := c.Get(context.Background(), "/whatever", &out)
			require.Error(t, err)
			tc.assertT(t, err)
		})
	}
}

func TestHTTPClient_StatusMapping_JSONBody(t *testing.T) {
	runStatusMappingCases(t, true)
}

func TestHTTPClient_StatusMapping_NoBody(t *testing.T) {
	runStatusMappingCases(t, false)
}

func TestHTTPClient_GetRaw_StatusMapping(t *testing.T) {
	cases := []statusToErrorCase{
		{
			name:   "400 maps to ValidationError",
			status: 400,
			assertT: func(t *testing.T, err error) {
				_, ok := err.(*ValidationError)
				require.True(t, ok, "expected *ValidationError, got %T", err)
			},
		},
		{
			name:   "401 maps to AuthenticationError",
			status: 401,
			assertT: func(t *testing.T, err error) {
				_, ok := err.(*AuthenticationError)
				require.True(t, ok, "expected *AuthenticationError, got %T", err)
			},
		},
		{
			name:   "403 maps to AuthorizationError",
			status: 403,
			assertT: func(t *testing.T, err error) {
				_, ok := err.(*AuthorizationError)
				require.True(t, ok, "expected *AuthorizationError, got %T", err)
			},
		},
		{
			name:   "404 maps to NotFoundError",
			status: 404,
			assertT: func(t *testing.T, err error) {
				_, ok := err.(*NotFoundError)
				require.True(t, ok, "expected *NotFoundError, got %T", err)
			},
		},
		{
			name:   "409 maps to ConflictError",
			status: 409,
			assertT: func(t *testing.T, err error) {
				_, ok := err.(*ConflictError)
				require.True(t, ok, "expected *ConflictError, got %T", err)
			},
		},
		{
			name:   "429 maps to RateLimitError",
			status: 429,
			assertT: func(t *testing.T, err error) {
				_, ok := err.(*RateLimitError)
				require.True(t, ok, "expected *RateLimitError, got %T", err)
			},
		},
		{
			name:   "500 falls back to *TurboDocxError",
			status: 500,
			assertT: func(t *testing.T, err error) {
				_, ok := err.(*TurboDocxError)
				require.True(t, ok, "expected *TurboDocxError, got %T", err)
			},
		},
	}

	for _, tc := range cases {
		tc := tc
		t.Run(tc.name, func(t *testing.T) {
			server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
				w.WriteHeader(tc.status)
			}))
			defer server.Close()

			c := newTestHTTPClient(server.URL)
			_, err := c.GetRaw(context.Background(), "/whatever")
			require.Error(t, err)
			tc.assertT(t, err)
		})
	}
}
