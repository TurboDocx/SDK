package turbodocx

import (
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"
)

// TurboSign reminder + expiration schedule tests.
//
// Mirrors the js-sdk, py-sdk and ruby-sdk suites case-for-case, per the cross-SDK test-parity
// rule.
//
// Durations are JSON-encoded on both send paths: multipart/form-data cannot carry a nested value,
// and the API decodes a JSON-string duration on either content type, so one code path serves both.
// Request-body keys stay camelCase — the API is not snake_case-aware.

func boolPtr(b bool) *bool { return &b }
func intPtr(i int) *int    { return &i }

// captureFormData runs applyScheduleOverrides in isolation so the assertions describe the wire
// shape without standing up a full multipart send.
func captureFormData(t *testing.T, schedule SignatureSchedule) map[string]string {
	t.Helper()
	formData := map[string]string{}
	if err := applyScheduleOverrides(formData, schedule); err != nil {
		t.Fatalf("applyScheduleOverrides returned an error: %v", err)
	}
	return formData
}

func TestApplyScheduleOverrides_SendsEveryField(t *testing.T) {
	formData := captureFormData(t, SignatureSchedule{
		RemindersEnabled:          boolPtr(true),
		ReminderDelay:             &Duration{Value: 3, Unit: "days"},
		ReminderInterval:          &Duration{Value: 12, Unit: "hours"},
		MaxReminders:              intPtr(5),
		ExpirationEnabled:         boolPtr(true),
		ExpireAfter:               &Duration{Value: 30, Unit: "days"},
		ExpirationWarning:         &Duration{Value: 3, Unit: "days"},
		ExpirationWarningInterval: &Duration{Value: 1, Unit: "days"},
	})

	if formData["remindersEnabled"] != "true" {
		t.Errorf("remindersEnabled = %q, want \"true\"", formData["remindersEnabled"])
	}
	if formData["maxReminders"] != "5" {
		t.Errorf("maxReminders = %q, want \"5\"", formData["maxReminders"])
	}
	if formData["expirationEnabled"] != "true" {
		t.Errorf("expirationEnabled = %q, want \"true\"", formData["expirationEnabled"])
	}

	var decoded Duration
	if err := json.Unmarshal([]byte(formData["reminderDelay"]), &decoded); err != nil {
		t.Fatalf("reminderDelay is not valid JSON: %v", err)
	}
	if decoded.Value != 3 || decoded.Unit != "days" {
		t.Errorf("reminderDelay = %+v, want {3 days}", decoded)
	}
	for _, key := range []string{"reminderInterval", "expireAfter", "expirationWarning", "expirationWarningInterval"} {
		if formData[key] == "" {
			t.Errorf("%s was not sent", key)
		}
	}
}

func TestApplyScheduleOverrides_OmitsUnsetFields(t *testing.T) {
	formData := captureFormData(t, SignatureSchedule{})

	for _, key := range []string{
		"remindersEnabled", "reminderDelay", "reminderInterval", "maxReminders",
		"expirationEnabled", "expireAfter", "expirationWarning", "expirationWarningInterval",
	} {
		if _, present := formData[key]; present {
			t.Errorf("%s should be omitted so the org default applies, got %q", key, formData[key])
		}
	}
}

// The reason every field is a pointer: a deliberate false must survive, and Go's zero value
// cannot express "unset" on its own.
func TestApplyScheduleOverrides_SendsExplicitFalse(t *testing.T) {
	formData := captureFormData(t, SignatureSchedule{
		RemindersEnabled:  boolPtr(false),
		ExpirationEnabled: boolPtr(false),
	})

	if formData["remindersEnabled"] != "false" {
		t.Errorf("remindersEnabled = %q, want \"false\" (not dropped)", formData["remindersEnabled"])
	}
	if formData["expirationEnabled"] != "false" {
		t.Errorf("expirationEnabled = %q, want \"false\" (not dropped)", formData["expirationEnabled"])
	}
}

func TestApplyScheduleOverrides_SendsZeroAndUnlimitedMaxReminders(t *testing.T) {
	zero := captureFormData(t, SignatureSchedule{MaxReminders: intPtr(0)})
	if zero["maxReminders"] != "0" {
		t.Errorf("maxReminders = %q, want \"0\" (means no reminders)", zero["maxReminders"])
	}

	unlimited := captureFormData(t, SignatureSchedule{MaxReminders: intPtr(-1)})
	if unlimited["maxReminders"] != "-1" {
		t.Errorf("maxReminders = %q, want \"-1\" (means unlimited)", unlimited["maxReminders"])
	}
}

// Zero is legal for the warning offset alone, and means "never warn".
func TestApplyScheduleOverrides_SendsZeroExpirationWarning(t *testing.T) {
	formData := captureFormData(t, SignatureSchedule{
		ExpirationWarning: &Duration{Value: 0, Unit: "hours"},
	})

	var decoded Duration
	if err := json.Unmarshal([]byte(formData["expirationWarning"]), &decoded); err != nil {
		t.Fatalf("expirationWarning is not valid JSON: %v", err)
	}
	if decoded.Value != 0 || decoded.Unit != "hours" {
		t.Errorf("expirationWarning = %+v, want {0 hours}", decoded)
	}
}

func TestSendReminder(t *testing.T) {
	tests := []struct {
		name         string
		recipientIDs []string
		wantBodyKey  bool
	}{
		{"no ids remind every eligible signer", nil, false},
		// An empty slice is a caller mistake the API would 400 on (min 1 when the key is
		// present). Treat it as "no filter" rather than forwarding a request that cannot succeed.
		{"empty slice is treated as unfiltered", []string{}, false},
		{"named ids are passed through", []string{"r-1", "r-2"}, true},
	}

	for _, tc := range tests {
		t.Run(tc.name, func(t *testing.T) {
			var gotPath string
			var gotBody map[string]interface{}

			server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
				gotPath = r.URL.Path
				_ = json.NewDecoder(r.Body).Decode(&gotBody)
				w.Header().Set("Content-Type", "application/json")
				_, _ = w.Write([]byte(`{"data":{"results":[{"recipientId":"r-1","status":"sent","reminderCount":2,"phase":"reminder"}]}}`))
			}))
			defer server.Close()

			client, _ := NewClientWithConfig(ClientConfig{
				APIKey:      "test-api-key",
				OrgID:       "test-org-id",
				SenderEmail: "sender@company.com",
				BaseURL:     server.URL,
			})

			resp, err := client.TurboSign.SendReminder(context.Background(), "doc-123", tc.recipientIDs)
			if err != nil {
				t.Fatalf("SendReminder returned an error: %v", err)
			}

			if gotPath != "/turbosign/documents/doc-123/send-reminder" {
				t.Errorf("path = %q", gotPath)
			}
			_, present := gotBody["recipientIds"]
			if present != tc.wantBodyKey {
				t.Errorf("recipientIds present = %v, want %v (body: %v)", present, tc.wantBodyKey, gotBody)
			}
			if len(resp.Results) != 1 || resp.Results[0].Status != "sent" {
				t.Errorf("results = %+v, want one 'sent' entry", resp.Results)
			}
			if resp.Results[0].ReminderCount != 2 {
				t.Errorf("reminderCount = %d, want 2", resp.Results[0].ReminderCount)
			}
		})
	}
}
