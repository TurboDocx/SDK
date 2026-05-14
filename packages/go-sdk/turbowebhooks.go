package turbodocx

import (
	"context"
	"encoding/json"
	"net/url"
	"os"
	"strconv"
)

// SignatureWebhookName is the fixed name of the single SDK-managed webhook
// per org. Matches the UI's Signature Webhooks settings page.
const SignatureWebhookName = "signature"

// WebhooksClient provides org-scoped management of the org's "signature"
// webhook.
//
// The SDK is intentionally locked to a single webhook per org, identified by
// the fixed name `signature`. This matches the UI's Signature Webhooks
// settings page so SDK-managed and UI-managed webhooks stay in sync. To
// manage multiple webhooks per org, call the REST API directly.
//
// Construct via NewWebhooksClient or NewWebhooksClientWithConfig.
type WebhooksClient struct {
	http *HTTPClient
}

// NewWebhooksClient creates a WebhooksClient with the given API key + org ID.
func NewWebhooksClient(apiKey, orgID string) (*WebhooksClient, error) {
	return NewWebhooksClientWithConfig(ClientConfig{
		APIKey: apiKey,
		OrgID:  orgID,
	})
}

// NewWebhooksClientWithConfig creates a WebhooksClient.
// Unlike NewClientWithConfig, this does NOT require SenderEmail since
// webhook routes don't send signature emails.
func NewWebhooksClientWithConfig(config ClientConfig) (*WebhooksClient, error) {
	if config.APIKey == "" {
		config.APIKey = os.Getenv("TURBODOCX_API_KEY")
	}
	if config.AccessToken == "" {
		config.AccessToken = os.Getenv("TURBODOCX_ACCESS_TOKEN")
	}
	if config.OrgID == "" {
		config.OrgID = os.Getenv("TURBODOCX_ORG_ID")
	}
	if config.BaseURL == "" {
		config.BaseURL = os.Getenv("TURBODOCX_BASE_URL")
	}
	if config.BaseURL == "" {
		config.BaseURL = "https://api.turbodocx.com"
	}

	if config.APIKey == "" && config.AccessToken == "" {
		return nil, &AuthenticationError{TurboDocxError: TurboDocxError{
			Message:    "API key or access token is required",
			StatusCode: 401,
		}}
	}
	if config.OrgID == "" {
		return nil, &AuthenticationError{TurboDocxError: TurboDocxError{
			Message:    "Organization ID (OrgID) is required for authentication",
			StatusCode: 401,
		}}
	}

	return &WebhooksClient{
		http: NewHTTPClient(config),
	}, nil
}

// =========================================================================
// CRUD
// =========================================================================

// CreateWebhookRequest is the payload for CreateWebhook.
// The `name` field is hardcoded by the SDK and is not part of this struct.
type CreateWebhookRequest struct {
	URLs   []string `json:"urls"`
	Events []string `json:"events"`
}

// CreateWebhookResponse is the data unwrapped from the create envelope.
type CreateWebhookResponse struct {
	ID     string `json:"id"`
	Secret string `json:"secret"`
}

type createWebhookEnvelope struct {
	Data    CreateWebhookResponse `json:"data"`
	Message string                `json:"message,omitempty"`
}

// CreateWebhook creates the org's signature webhook. The returned Secret is
// shown ONCE; store it on receipt — it cannot be retrieved later.
func (c *WebhooksClient) CreateWebhook(ctx context.Context, req CreateWebhookRequest) (*CreateWebhookResponse, error) {
	body := map[string]interface{}{
		"name":   SignatureWebhookName,
		"urls":   req.URLs,
		"events": req.Events,
	}
	var envelope createWebhookEnvelope
	if err := c.http.Post(ctx, "/api/webhooks", body, &envelope); err != nil {
		return nil, err
	}
	return &envelope.Data, nil
}

// GetWebhook fetches the org's signature webhook with current delivery stats
// and the server-provided list of subscribable events. Returns the raw JSON
// as a map so callers can read evolving fields without SDK upgrades.
func (c *WebhooksClient) GetWebhook(ctx context.Context) (map[string]interface{}, error) {
	var result map[string]interface{}
	if err := c.http.Get(ctx, "/api/webhooks/"+SignatureWebhookName, &result); err != nil {
		return nil, err
	}
	return result, nil
}

// UpdateWebhookRequest contains the fields that can be patched on the
// signature webhook. Renaming is not supported — the SDK manages a fixed name.
// Use a pointer or nil to leave a field unchanged.
type UpdateWebhookRequest struct {
	URLs     []string `json:"urls,omitempty"`
	Events   []string `json:"events,omitempty"`
	IsActive *bool    `json:"isActive,omitempty"`
}

// UpdateWebhook patches one or more fields on the signature webhook.
func (c *WebhooksClient) UpdateWebhook(ctx context.Context, req UpdateWebhookRequest) (map[string]interface{}, error) {
	var envelope struct {
		Data    map[string]interface{} `json:"data"`
		Message string                 `json:"message,omitempty"`
	}
	if err := c.http.Patch(ctx, "/api/webhooks/"+SignatureWebhookName, req, &envelope); err != nil {
		return nil, err
	}
	return envelope.Data, nil
}

// DeleteWebhook soft-deletes the signature webhook and its delivery history.
func (c *WebhooksClient) DeleteWebhook(ctx context.Context) (map[string]interface{}, error) {
	var result map[string]interface{}
	if err := c.http.Delete(ctx, "/api/webhooks/"+SignatureWebhookName, &result); err != nil {
		return nil, err
	}
	return result, nil
}

// =========================================================================
// TEST / NOTIFY
// =========================================================================

// TestWebhookRequest is the payload for TestWebhook and NotifyWebhook.
type TestWebhookRequest struct {
	EventType string                 `json:"eventType"`
	Payload   map[string]interface{} `json:"payload"`
}

// TestWebhook sends a test delivery to all URLs configured on the signature
// webhook.
func (c *WebhooksClient) TestWebhook(ctx context.Context, req TestWebhookRequest) (map[string]interface{}, error) {
	return c.postEnvelope(ctx, "/api/webhooks/"+SignatureWebhookName+"/test", req)
}

// NotifyWebhook sends a manual notification to all URLs configured on the
// signature webhook.
//
// NOTE: Routes through the same backend handler as TestWebhook and returns
// the same shape; only the response/error message strings differ. Prefer
// TestWebhook in new code.
func (c *WebhooksClient) NotifyWebhook(ctx context.Context, req TestWebhookRequest) (map[string]interface{}, error) {
	return c.postEnvelope(ctx, "/api/webhooks/"+SignatureWebhookName+"/notify", req)
}

// =========================================================================
// DELIVERIES + REPLAY
// =========================================================================

// ListDeliveriesRequest holds optional filters for ListWebhookDeliveries.
// Use nil for any field to skip that filter.
type ListDeliveriesRequest struct {
	Limit        *int
	Offset       *int
	EventType    string
	IsDelivered  *bool
	HTTPStatus   *int
}

// ListWebhookDeliveries returns historical delivery attempts for the
// signature webhook, with optional filters.
func (c *WebhooksClient) ListWebhookDeliveries(ctx context.Context, req ListDeliveriesRequest) (map[string]interface{}, error) {
	q := url.Values{}
	if req.Limit != nil {
		q.Set("limit", strconv.Itoa(*req.Limit))
	}
	if req.Offset != nil {
		q.Set("offset", strconv.Itoa(*req.Offset))
	}
	if req.EventType != "" {
		q.Set("eventType", req.EventType)
	}
	if req.IsDelivered != nil {
		q.Set("isDelivered", strconv.FormatBool(*req.IsDelivered))
	}
	if req.HTTPStatus != nil {
		q.Set("httpStatus", strconv.Itoa(*req.HTTPStatus))
	}

	path := "/api/webhooks/" + SignatureWebhookName + "/deliveries"
	if encoded := q.Encode(); encoded != "" {
		path += "?" + encoded
	}

	var result map[string]interface{}
	if err := c.http.Get(ctx, path, &result); err != nil {
		return nil, err
	}
	return result, nil
}

// ReplayWebhookDelivery manually retries a specific past delivery by ID.
func (c *WebhooksClient) ReplayWebhookDelivery(ctx context.Context, deliveryID string) (map[string]interface{}, error) {
	body := map[string]interface{}{"deliveryId": deliveryID}
	return c.postEnvelope(ctx, "/api/webhooks/"+SignatureWebhookName+"/replay", body)
}

// =========================================================================
// SECRET ROTATION + STATS
// =========================================================================

// RegenerateWebhookSecret rotates the webhook's HMAC secret. The new secret
// is shown ONCE in the response and must be saved; old signatures will fail
// immediately.
func (c *WebhooksClient) RegenerateWebhookSecret(ctx context.Context) (map[string]interface{}, error) {
	return c.postEnvelope(ctx, "/api/webhooks/"+SignatureWebhookName+"/regenerate", nil)
}

// GetWebhookStats returns aggregate delivery stats for the signature webhook
// over a sliding window. Pass 0 for days to use the backend default (30).
func (c *WebhooksClient) GetWebhookStats(ctx context.Context, days int) (map[string]interface{}, error) {
	path := "/api/webhooks/" + SignatureWebhookName + "/stats"
	if days > 0 {
		path += "?days=" + strconv.Itoa(days)
	}
	var result map[string]interface{}
	if err := c.http.Get(ctx, path, &result); err != nil {
		return nil, err
	}
	return result, nil
}

// =========================================================================
// Internals
// =========================================================================

// postEnvelope handles routes that return `{data, message}` envelopes.
// The SDK's smartUnwrap only strips single-key {data} responses; envelopes
// with a `message` field are returned as-is, so we extract `.data` explicitly.
func (c *WebhooksClient) postEnvelope(ctx context.Context, path string, body interface{}) (map[string]interface{}, error) {
	var envelope struct {
		Data    json.RawMessage `json:"data"`
		Message string          `json:"message,omitempty"`
	}
	if err := c.http.Post(ctx, path, body, &envelope); err != nil {
		return nil, err
	}
	if len(envelope.Data) == 0 {
		return map[string]interface{}{}, nil
	}
	var data map[string]interface{}
	if err := json.Unmarshal(envelope.Data, &data); err != nil {
		return nil, err
	}
	return data, nil
}
