package turbodocx

import (
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"
)

// TurboQuote reminder + expiration schedule serialization tests.
//
// Mirrors the js-sdk, py-sdk and ruby-sdk turboquote-schedule suites, per the cross-SDK
// test-parity rule.
//
// The quote send endpoints are JSON (unlike the multipart signature send), so the eight schedule
// fields — carried by the embedded SignatureSchedule — serialize FLAT at the top level of the
// body (camelCase), NOT nested under a "schedule" key, with plain {value, unit} duration OBJECTS
// rather than JSON-encoded strings. Pointer fields keep a deliberate false / 0 distinct from
// "unset": omitempty drops only nil pointers, so a *bool(false) and *int(0) still reach the wire.

// captureQuoteSendBody stands up a one-shot server, runs the send, and returns the decoded JSON
// request body as a generic map so the assertions describe the exact wire shape.
func captureQuoteSendBody(t *testing.T, path string, send func(*QuoteClient) error) map[string]interface{} {
	t.Helper()
	var body map[string]interface{}
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path == path {
			_ = json.NewDecoder(r.Body).Decode(&body)
		}
		w.Header().Set("Content-Type", "application/json")
		_, _ = w.Write([]byte(`{"data":{"result":{"id":"q-1","status":"sent"},"message":"Quote sent","documentId":"doc-2"}}`))
	}))
	defer server.Close()

	client := newTestQuoteClient(t, server.URL)
	if err := send(client); err != nil {
		t.Fatalf("send returned an error: %v", err)
	}
	if body == nil {
		t.Fatalf("no request body captured for %s", path)
	}
	return body
}

func assertQuoteDuration(t *testing.T, body map[string]interface{}, key string, wantValue float64, wantUnit string) {
	t.Helper()
	raw, ok := body[key]
	if !ok {
		t.Fatalf("%s was not sent", key)
	}
	obj, ok := raw.(map[string]interface{})
	if !ok {
		t.Fatalf("%s should be a {value, unit} object, got %T (%v)", key, raw, raw)
	}
	if obj["value"] != wantValue {
		t.Errorf("%s.value = %v, want %v", key, obj["value"], wantValue)
	}
	if obj["unit"] != wantUnit {
		t.Errorf("%s.unit = %v, want %q", key, obj["unit"], wantUnit)
	}
}

func TestQuoteSchedule_SendQuote_FlatWithObjectDurations(t *testing.T) {
	body := captureQuoteSendBody(t, "/v1/quotes/q-1/send", func(c *QuoteClient) error {
		_, err := c.SendQuote(context.Background(), "q-1", &SendQuoteRequest{
			CCEmails: []string{"admin@example.com"},
			SignatureSchedule: SignatureSchedule{
				RemindersEnabled:          boolPtr(true),
				ReminderDelay:             &Duration{Value: 3, Unit: "days"},
				ReminderInterval:          &Duration{Value: 12, Unit: "hours"},
				MaxReminders:              intPtr(5),
				ExpirationEnabled:         boolPtr(true),
				ExpireAfter:               &Duration{Value: 30, Unit: "days"},
				ExpirationWarning:         &Duration{Value: 3, Unit: "days"},
				ExpirationWarningInterval: &Duration{Value: 1, Unit: "days"},
			},
		})
		return err
	})

	// Flat at the top level, never nested under "schedule".
	if _, nested := body["schedule"]; nested {
		t.Errorf("schedule fields must be FLAT, found a nested \"schedule\" key: %v", body["schedule"])
	}

	// Native bool / number — not stringified.
	if body["remindersEnabled"] != true {
		t.Errorf("remindersEnabled = %v (%T), want bool true", body["remindersEnabled"], body["remindersEnabled"])
	}
	if body["expirationEnabled"] != true {
		t.Errorf("expirationEnabled = %v, want bool true", body["expirationEnabled"])
	}
	if body["maxReminders"] != float64(5) {
		t.Errorf("maxReminders = %v (%T), want number 5", body["maxReminders"], body["maxReminders"])
	}

	// Durations are objects, not JSON strings.
	assertQuoteDuration(t, body, "reminderDelay", 3, "days")
	assertQuoteDuration(t, body, "reminderInterval", 12, "hours")
	assertQuoteDuration(t, body, "expireAfter", 30, "days")
	assertQuoteDuration(t, body, "expirationWarning", 3, "days")
	assertQuoteDuration(t, body, "expirationWarningInterval", 1, "days")

	if ccEmails, ok := body["ccEmails"].([]interface{}); !ok || ccEmails[0] != "admin@example.com" {
		t.Errorf("ccEmails = %v, want [admin@example.com]", body["ccEmails"])
	}
}

func TestQuoteSchedule_SendQuote_OmitsUnsetFields(t *testing.T) {
	body := captureQuoteSendBody(t, "/v1/quotes/q-1/send", func(c *QuoteClient) error {
		_, err := c.SendQuote(context.Background(), "q-1", &SendQuoteRequest{
			CCEmails: []string{"admin@example.com"},
		})
		return err
	})

	for _, key := range []string{
		"remindersEnabled", "reminderDelay", "reminderInterval", "maxReminders",
		"expirationEnabled", "expireAfter", "expirationWarning", "expirationWarningInterval",
	} {
		if _, present := body[key]; present {
			t.Errorf("%s should be omitted so the org default applies, got %v", key, body[key])
		}
	}
}

// false and 0 are meaningful, not "unset" — the pointer fields keep them off the org-default path.
func TestQuoteSchedule_SendQuote_PreservesMeaningfulZeros(t *testing.T) {
	body := captureQuoteSendBody(t, "/v1/quotes/q-1/send", func(c *QuoteClient) error {
		_, err := c.SendQuote(context.Background(), "q-1", &SendQuoteRequest{
			SignatureSchedule: SignatureSchedule{
				MaxReminders:      intPtr(0),
				ExpirationEnabled: boolPtr(false),
			},
		})
		return err
	})

	if body["maxReminders"] != float64(0) {
		t.Errorf("maxReminders = %v, want number 0 (means no reminders, not dropped)", body["maxReminders"])
	}
	if body["expirationEnabled"] != false {
		t.Errorf("expirationEnabled = %v, want bool false (not dropped)", body["expirationEnabled"])
	}
}

func TestQuoteSchedule_SendQuoteWithDeliverable_CarriesScheduleFlat(t *testing.T) {
	body := captureQuoteSendBody(t, "/v1/quotes/q-1/send-with-deliverable", func(c *QuoteClient) error {
		_, err := c.SendQuoteWithDeliverable(context.Background(), "q-1", &SendQuoteWithDeliverableRequest{
			DeliverableID: "del-1",
			MergePosition: "end",
			SignatureSchedule: SignatureSchedule{
				RemindersEnabled:  boolPtr(true),
				ReminderDelay:     &Duration{Value: 2, Unit: "days"},
				ExpirationEnabled: boolPtr(false),
			},
		})
		return err
	})

	if _, nested := body["schedule"]; nested {
		t.Errorf("schedule fields must be FLAT, found a nested \"schedule\" key")
	}
	if body["deliverableId"] != "del-1" {
		t.Errorf("deliverableId = %v, want del-1", body["deliverableId"])
	}
	if body["remindersEnabled"] != true {
		t.Errorf("remindersEnabled = %v, want bool true", body["remindersEnabled"])
	}
	assertQuoteDuration(t, body, "reminderDelay", 2, "days")
	if body["expirationEnabled"] != false {
		t.Errorf("expirationEnabled = %v, want bool false", body["expirationEnabled"])
	}
}

func TestQuoteSchedule_CreateAndSend_EmitsFlatScheduleOnSendStep(t *testing.T) {
	body := captureQuoteSendBody(t, "/v1/quotes/q-1/send", func(c *QuoteClient) error {
		_, err := c.CreateAndSend(context.Background(), &CreateAndSendRequest{
			Name:      "Enterprise License",
			CompanyID: "c-1",
			ContactID: "ct-1",
			Send: &SendQuoteRequest{
				SignatureSchedule: SignatureSchedule{
					RemindersEnabled: boolPtr(true),
					MaxReminders:     intPtr(0),
					ReminderDelay:    &Duration{Value: 1, Unit: "days"},
				},
			},
		})
		return err
	})

	if _, nested := body["schedule"]; nested {
		t.Errorf("schedule fields must be FLAT on the send step, found a nested \"schedule\" key")
	}
	if body["remindersEnabled"] != true {
		t.Errorf("remindersEnabled = %v, want bool true", body["remindersEnabled"])
	}
	if body["maxReminders"] != float64(0) {
		t.Errorf("maxReminders = %v, want number 0", body["maxReminders"])
	}
	assertQuoteDuration(t, body, "reminderDelay", 1, "days")
}
