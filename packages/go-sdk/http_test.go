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

// The API reports failures in several envelopes. Reading only the top-level message/error
// loses the actionable reason ("senderEmail must be a valid email address") and the specific
// code (QUOTE_NOT_FOUND) — and for the nested `error: {...}` shape used across TurboQuote,
// typing `error` as a string makes the whole unmarshal fail, discarding every field.
func TestHTTPClient_ErrorDetailAndCodeExtraction(t *testing.T) {
	cases := []struct {
		name        string
		status      int
		body        string
		wantMessage string
		wantCode    string
	}{
		{
			name:        "surfaces the per-field reason over the generic envelope",
			status:      400,
			body:        `{"message":"There was an issue validating the body","type":"ValidationError","data":{"errors":[{"message":"senderEmail must be a valid email address"}]}}`,
			wantMessage: "senderEmail must be a valid email address",
			wantCode:    "ValidationError",
		},
		{
			name:        "joins multiple field errors",
			status:      400,
			body:        `{"message":"There was an issue validating the body","data":{"errors":[{"message":"a is bad"},{"message":"b is required"}]}}`,
			wantMessage: "a is bad; b is required",
		},
		{
			name:        "falls back to the top-level message when there are no field errors",
			status:      400,
			body:        `{"message":"A sender email is required for API-key requests.","error":"SenderEmailRequired"}`,
			wantMessage: "A sender email is required for API-key requests.",
			// `error` alongside a `message` is the CODE, not the message.
			wantCode: "SenderEmailRequired",
		},
		{
			name:        "empty errors array does not blank the message",
			status:      400,
			body:        `{"message":"There was an issue validating the body","data":{"errors":[]}}`,
			wantMessage: "There was an issue validating the body",
		},
		{
			name:        "reads message and code from a nested error object",
			status:      404,
			body:        `{"error":{"message":"Quote not found","code":"QUOTE_NOT_FOUND"}}`,
			wantMessage: "Quote not found",
			wantCode:    "QUOTE_NOT_FOUND",
		},
		{
			name:        "surfaces a top-level errors array (bulk validation)",
			status:      400,
			body:        `{"message":"Bulk validation failed","type":"BulkValidationFailed","errors":[{"message":"Row 1 invalid"},{"message":"Row 3 required"}]}`,
			wantMessage: "Row 1 invalid; Row 3 required",
			wantCode:    "BulkValidationFailed",
		},
		{
			name:        "reads the code from a top-level type",
			status:      400,
			body:        `{"message":"Recipient name is required","type":"RecipientNameRequired"}`,
			wantMessage: "Recipient name is required",
			wantCode:    "RecipientNameRequired",
		},
		{
			name:   "a lone error string is the message, not the code",
			status: 400,
			// SingleStepRoutes sends {error: <message>, code: <type>}.
			body:        `{"error":"Document could not be prepared","code":"TemplateProcessingFailed"}`,
			wantMessage: "Document could not be prepared",
			wantCode:    "TemplateProcessingFailed",
		},
		{
			// Not every backend error carries a code, but Code must still be branchable —
			// so the status default fills the gap. Matches the other five SDKs.
			name:        "falls back to the status default code when the API sends none",
			status:      404,
			body:        `{"message":"Resource missing"}`,
			wantMessage: "Resource missing",
			wantCode:    "NOT_FOUND",
		},
		{
			// The default must never mask a real code the backend sent.
			name:        "an API-supplied code wins over the status default",
			status:      404,
			body:        `{"message":"Quote missing","code":"QUOTE_NOT_FOUND"}`,
			wantMessage: "Quote missing",
			wantCode:    "QUOTE_NOT_FOUND",
		},
	}

	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
				w.Header().Set("Content-Type", "application/json")
				w.WriteHeader(tc.status)
				_, _ = w.Write([]byte(tc.body))
			}))
			defer server.Close()

			client := newTestHTTPClient(server.URL)
			err := client.Get(context.Background(), "/anything", nil)
			require.Error(t, err)

			var base *TurboDocxError
			switch typed := err.(type) {
			case *ValidationError:
				base = &typed.TurboDocxError
			case *NotFoundError:
				base = &typed.TurboDocxError
			default:
				t.Fatalf("unexpected error type %T", err)
			}

			require.Equal(t, tc.wantMessage, base.Message)
			if tc.wantCode != "" {
				require.Equal(t, tc.wantCode, base.Code)
			}
		})
	}
}

// Parity guard: all six SDKs populate Code for every typed error.
func TestMapStatusToError_DefaultCodes(t *testing.T) {
	cases := []struct {
		status   int
		wantCode string
	}{
		{400, "VALIDATION_ERROR"},
		{401, "AUTHENTICATION_ERROR"},
		{403, "AUTHORIZATION_ERROR"},
		{404, "NOT_FOUND"},
		{409, "CONFLICT"},
		{429, "RATE_LIMIT_EXCEEDED"},
	}

	for _, tc := range cases {
		err := mapStatusToError(TurboDocxError{Message: "boom", StatusCode: tc.status})

		// errors.As cannot reach the EMBEDDED TurboDocxError: the typed errors embed it by
		// value and define no Unwrap, so *ValidationError is not a *TurboDocxError. Read the
		// embedded field off the concrete type, matching the other tests in this file.
		var base *TurboDocxError
		switch typed := err.(type) {
		case *ValidationError:
			base = &typed.TurboDocxError
		case *AuthenticationError:
			base = &typed.TurboDocxError
		case *AuthorizationError:
			base = &typed.TurboDocxError
		case *NotFoundError:
			base = &typed.TurboDocxError
		case *ConflictError:
			base = &typed.TurboDocxError
		case *RateLimitError:
			base = &typed.TurboDocxError
		default:
			t.Fatalf("status %d produced unexpected error type %T", tc.status, err)
		}

		require.Equal(t, tc.wantCode, base.Code)
	}
}

// Every NetworkError construction site must carry NETWORK_ERROR. These are built as struct
// literals rather than going through mapStatusToError, so a missed site is invisible until a
// caller branches on Code and finds it empty.
func TestNetworkError_CarriesNetworkErrorCode(t *testing.T) {
	// A connection to a closed port exercises the request-failed path.
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {}))
	url := server.URL
	server.Close()

	client := newTestHTTPClient(url)

	t.Run("Get", func(t *testing.T) {
		var out map[string]interface{}
		err := client.Get(context.Background(), "/whatever", &out)
		require.Error(t, err)

		var netErr *NetworkError
		require.ErrorAs(t, err, &netErr)
		require.Equal(t, "NETWORK_ERROR", netErr.Code)
	})

	t.Run("GetRaw", func(t *testing.T) {
		_, err := client.GetRaw(context.Background(), "/whatever")
		require.Error(t, err)

		var netErr *NetworkError
		require.ErrorAs(t, err, &netErr)
		require.Equal(t, "NETWORK_ERROR", netErr.Code)
	})

	t.Run("Post", func(t *testing.T) {
		var out map[string]interface{}
		err := client.Post(context.Background(), "/whatever", map[string]string{"a": "b"}, &out)
		require.Error(t, err)

		var netErr *NetworkError
		require.ErrorAs(t, err, &netErr)
		require.Equal(t, "NETWORK_ERROR", netErr.Code)
	})
}
