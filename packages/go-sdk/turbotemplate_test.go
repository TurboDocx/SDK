package turbodocx

import (
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestNewSimpleVariable(t *testing.T) {
	t.Run("creates simple variable with name and value", func(t *testing.T) {
		variable := NewSimpleVariable("customer_name", "Person A")

		assert.Equal(t, "{customer_name}", variable.Placeholder)
		assert.Equal(t, "customer_name", variable.Name)
		assert.Equal(t, "Person A", variable.Value)
	})

	t.Run("creates simple variable with number value", func(t *testing.T) {
		variable := NewSimpleVariable("order_total", 1500)

		assert.Equal(t, "{order_total}", variable.Placeholder)
		assert.Equal(t, "order_total", variable.Name)
		assert.Equal(t, 1500, variable.Value)
	})

	t.Run("creates simple variable with boolean value", func(t *testing.T) {
		variable := NewSimpleVariable("is_active", true)

		assert.Equal(t, "{is_active}", variable.Placeholder)
		assert.Equal(t, "is_active", variable.Name)
		assert.Equal(t, true, variable.Value)
	})

	t.Run("uses custom placeholder when provided", func(t *testing.T) {
		variable := NewSimpleVariable("customer_name", "Person A", "{custom_placeholder}")

		assert.Equal(t, "{custom_placeholder}", variable.Placeholder)
		assert.Equal(t, "customer_name", variable.Name)
	})

	t.Run("handles name with curly braces", func(t *testing.T) {
		variable := NewSimpleVariable("{customer_name}", "Person A")

		assert.Equal(t, "{customer_name}", variable.Placeholder)
		assert.Equal(t, "{customer_name}", variable.Name)
	})
}

func TestNewNestedVariable(t *testing.T) {
	t.Run("creates nested variable with object value", func(t *testing.T) {
		variable := NewNestedVariable("user", map[string]interface{}{
			"firstName": "Foo",
			"lastName":  "Bar",
			"email":     "foo@example.com",
		})

		assert.Equal(t, "{user}", variable.Placeholder)
		assert.Equal(t, "user", variable.Name)
		assert.Equal(t, map[string]interface{}{
			"firstName": "Foo",
			"lastName":  "Bar",
			"email":     "foo@example.com",
		}, variable.Value)
		assert.NotNil(t, variable.MimeType)
		assert.Equal(t, MimeTypeJSON, *variable.MimeType)
		assert.NotNil(t, variable.UsesAdvancedTemplatingEngine)
		assert.True(t, *variable.UsesAdvancedTemplatingEngine)
	})

	t.Run("creates nested variable with deeply nested object", func(t *testing.T) {
		variable := NewNestedVariable("company", map[string]interface{}{
			"name": "Company ABC",
			"address": map[string]interface{}{
				"street": "123 Test Street",
				"city":   "Test City",
				"state":  "TS",
			},
		})

		assert.Equal(t, "{company}", variable.Placeholder)
		assert.NotNil(t, variable.MimeType)
		assert.Equal(t, MimeTypeJSON, *variable.MimeType)
		assert.True(t, *variable.UsesAdvancedTemplatingEngine)
	})

	t.Run("uses custom placeholder when provided", func(t *testing.T) {
		variable := NewNestedVariable("user", map[string]interface{}{"name": "Test"}, "{custom_user}")

		assert.Equal(t, "{custom_user}", variable.Placeholder)
		assert.Equal(t, "user", variable.Name)
	})
}

func TestNewLoopVariable(t *testing.T) {
	t.Run("creates loop variable with array value", func(t *testing.T) {
		variable := NewLoopVariable("items", []interface{}{
			map[string]interface{}{"name": "Item A", "price": 100},
			map[string]interface{}{"name": "Item B", "price": 200},
		})

		assert.Equal(t, "{items}", variable.Placeholder)
		assert.Equal(t, "items", variable.Name)
		assert.NotNil(t, variable.MimeType)
		assert.Equal(t, MimeTypeJSON, *variable.MimeType)
		assert.True(t, *variable.UsesAdvancedTemplatingEngine)
	})

	t.Run("creates loop variable with empty array", func(t *testing.T) {
		variable := NewLoopVariable("products", []interface{}{})

		assert.Equal(t, "{products}", variable.Placeholder)
		assert.Equal(t, []interface{}{}, variable.Value)
		assert.Equal(t, MimeTypeJSON, *variable.MimeType)
	})

	t.Run("creates loop variable with primitive array", func(t *testing.T) {
		variable := NewLoopVariable("tags", []interface{}{"tag1", "tag2", "tag3"})

		assert.Equal(t, []interface{}{"tag1", "tag2", "tag3"}, variable.Value)
	})

	t.Run("uses custom placeholder when provided", func(t *testing.T) {
		variable := NewLoopVariable("items", []interface{}{}, "{line_items}")

		assert.Equal(t, "{line_items}", variable.Placeholder)
		assert.Equal(t, "items", variable.Name)
	})
}

func TestNewConditionalVariable(t *testing.T) {
	t.Run("creates conditional variable with boolean true", func(t *testing.T) {
		variable := NewConditionalVariable("is_premium", true)

		assert.Equal(t, "{is_premium}", variable.Placeholder)
		assert.Equal(t, "is_premium", variable.Name)
		assert.Equal(t, true, variable.Value)
		assert.True(t, *variable.UsesAdvancedTemplatingEngine)
	})

	t.Run("creates conditional variable with boolean false", func(t *testing.T) {
		variable := NewConditionalVariable("show_discount", false)

		assert.Equal(t, false, variable.Value)
		assert.True(t, *variable.UsesAdvancedTemplatingEngine)
	})

	t.Run("creates conditional variable with truthy value", func(t *testing.T) {
		variable := NewConditionalVariable("count", 5)

		assert.Equal(t, 5, variable.Value)
	})

	t.Run("uses custom placeholder when provided", func(t *testing.T) {
		variable := NewConditionalVariable("is_active", true, "{active_flag}")

		assert.Equal(t, "{active_flag}", variable.Placeholder)
		assert.Equal(t, "is_active", variable.Name)
	})
}

func TestNewImageVariable(t *testing.T) {
	t.Run("creates image variable with URL", func(t *testing.T) {
		variable := NewImageVariable("logo", "https://example.com/logo.png")

		assert.Equal(t, "{logo}", variable.Placeholder)
		assert.Equal(t, "logo", variable.Name)
		assert.Equal(t, "https://example.com/logo.png", variable.Value)
		assert.NotNil(t, variable.MimeType)
		assert.Equal(t, MimeTypeImage, *variable.MimeType)
	})

	t.Run("creates image variable with base64", func(t *testing.T) {
		base64Image := "data:image/png;base64,iVBORw0KGgoAAAANSUhEUg..."
		variable := NewImageVariable("signature", base64Image)

		assert.Equal(t, base64Image, variable.Value)
		assert.Equal(t, MimeTypeImage, *variable.MimeType)
	})

	t.Run("uses custom placeholder when provided", func(t *testing.T) {
		variable := NewImageVariable("logo", "https://example.com/logo.png", "{company_logo}")

		assert.Equal(t, "{company_logo}", variable.Placeholder)
		assert.Equal(t, "logo", variable.Name)
	})
}

func TestTurboTemplateClient_Generate(t *testing.T) {
	t.Run("generates document with simple variables", func(t *testing.T) {
		server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			assert.Equal(t, "/v1/deliverable", r.URL.Path)
			assert.Equal(t, "POST", r.Method)
			assert.Equal(t, "Bearer test-api-key", r.Header.Get("Authorization"))
			assert.Equal(t, "test-org-id", r.Header.Get("x-rapiddocx-org-id"))

			var reqBody GenerateTemplateRequest
			json.NewDecoder(r.Body).Decode(&reqBody)
			assert.Equal(t, "template-123", reqBody.TemplateID)
			assert.Len(t, reqBody.Variables, 2)
			assert.Equal(t, "{customer_name}", reqBody.Variables[0].Placeholder)
			assert.Equal(t, "customer_name", reqBody.Variables[0].Name)
			assert.Equal(t, "Person A", reqBody.Variables[0].Value)

			w.Header().Set("Content-Type", "application/json")
			json.NewEncoder(w).Encode(map[string]interface{}{
				"success":       true,
				"deliverableId": "doc-123",
				"message":       "Document generated successfully",
			})
		}))
		defer server.Close()

		client, _ := NewClientWithConfig(ClientConfig{
			APIKey:      "test-api-key",
			OrgID:       "test-org-id",
			BaseURL:     server.URL,
			SenderEmail: "test@example.com",
		})

		name := "Test Document"
		desc := "Test description"
		result, err := client.TurboTemplate.Generate(context.Background(), &GenerateTemplateRequest{
			TemplateID:  "template-123",
			Name:        &name,
			Description: &desc,
			Variables: []TemplateVariable{
				{Placeholder: "{customer_name}", Name: "customer_name", Value: "Person A"},
				{Placeholder: "{order_total}", Name: "order_total", Value: 1500},
			},
		})

		require.NoError(t, err)
		assert.True(t, result.Success)
		assert.Equal(t, "doc-123", *result.DeliverableID)
	})

	t.Run("generates document with nested object variables", func(t *testing.T) {
		server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			var reqBody GenerateTemplateRequest
			json.NewDecoder(r.Body).Decode(&reqBody)
			assert.Equal(t, "json", string(*reqBody.Variables[0].MimeType))
			assert.True(t, *reqBody.Variables[0].UsesAdvancedTemplatingEngine)

			w.Header().Set("Content-Type", "application/json")
			json.NewEncoder(w).Encode(map[string]interface{}{
				"success":       true,
				"deliverableId": "doc-456",
			})
		}))
		defer server.Close()

		client, _ := NewClientWithConfig(ClientConfig{
			APIKey:      "test-api-key",
			OrgID:       "test-org-id",
			BaseURL:     server.URL,
			SenderEmail: "test@example.com",
		})

		mimeTypeJSON := MimeTypeJSON
		usesAdvanced := true
		name := "Nested Document"
		desc := "Document with nested objects"
		result, err := client.TurboTemplate.Generate(context.Background(), &GenerateTemplateRequest{
			TemplateID:  "template-123",
			Name:        &name,
			Description: &desc,
			Variables: []TemplateVariable{
				{
					Placeholder:                  "{user}",
					Name:                         "user",
					MimeType:                     &mimeTypeJSON,
					Value:                        map[string]interface{}{"firstName": "Foo", "lastName": "Bar"},
					UsesAdvancedTemplatingEngine: &usesAdvanced,
				},
			},
		})

		require.NoError(t, err)
		assert.True(t, result.Success)
	})

	t.Run("generates document with loop/array variables", func(t *testing.T) {
		server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			var reqBody GenerateTemplateRequest
			json.NewDecoder(r.Body).Decode(&reqBody)
			assert.Equal(t, "{items}", reqBody.Variables[0].Placeholder)
			assert.Equal(t, "items", reqBody.Variables[0].Name)

			w.Header().Set("Content-Type", "application/json")
			json.NewEncoder(w).Encode(map[string]interface{}{
				"success":       true,
				"deliverableId": "doc-789",
			})
		}))
		defer server.Close()

		client, _ := NewClientWithConfig(ClientConfig{
			APIKey:      "test-api-key",
			OrgID:       "test-org-id",
			BaseURL:     server.URL,
			SenderEmail: "test@example.com",
		})

		mimeTypeJSON := MimeTypeJSON
		usesAdvanced := true
		name := "Loop Document"
		desc := "Document with loops"
		result, err := client.TurboTemplate.Generate(context.Background(), &GenerateTemplateRequest{
			TemplateID:  "template-123",
			Name:        &name,
			Description: &desc,
			Variables: []TemplateVariable{
				{
					Placeholder:                  "{items}",
					Name:                         "items",
					MimeType:                     &mimeTypeJSON,
					Value:                        []map[string]interface{}{{"name": "Item A"}, {"name": "Item B"}},
					UsesAdvancedTemplatingEngine: &usesAdvanced,
				},
			},
		})

		require.NoError(t, err)
		assert.True(t, result.Success)
	})

	t.Run("generates document with helper-created variables", func(t *testing.T) {
		server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			var reqBody GenerateTemplateRequest
			json.NewDecoder(r.Body).Decode(&reqBody)
			assert.Len(t, reqBody.Variables, 5)

			w.Header().Set("Content-Type", "application/json")
			json.NewEncoder(w).Encode(map[string]interface{}{
				"success":       true,
				"deliverableId": "doc-helper",
			})
		}))
		defer server.Close()

		client, _ := NewClientWithConfig(ClientConfig{
			APIKey:      "test-api-key",
			OrgID:       "test-org-id",
			BaseURL:     server.URL,
			SenderEmail: "test@example.com",
		})

		name := "Helper Document"
		desc := "Document using helper functions"
		result, err := client.TurboTemplate.Generate(context.Background(), &GenerateTemplateRequest{
			TemplateID:  "template-123",
			Name:        &name,
			Description: &desc,
			Variables: []TemplateVariable{
				NewSimpleVariable("title", "Quarterly Report"),
				NewNestedVariable("company", map[string]interface{}{"name": "Company XYZ", "employees": 500}),
				NewLoopVariable("departments", []interface{}{map[string]interface{}{"name": "Dept A"}, map[string]interface{}{"name": "Dept B"}}),
				NewConditionalVariable("show_financials", true),
				NewImageVariable("logo", "https://example.com/logo.png"),
			},
		})

		require.NoError(t, err)
		assert.True(t, result.Success)
	})

	t.Run("includes optional request parameters", func(t *testing.T) {
		server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			var reqBody GenerateTemplateRequest
			json.NewDecoder(r.Body).Decode(&reqBody)
			assert.True(t, *reqBody.ReplaceFonts)
			assert.Equal(t, "Arial", *reqBody.DefaultFont)
			assert.Equal(t, "pdf", *reqBody.OutputFormat)
			assert.Equal(t, "value", reqBody.Metadata["customField"])

			w.Header().Set("Content-Type", "application/json")
			json.NewEncoder(w).Encode(map[string]interface{}{
				"success":       true,
				"deliverableId": "doc-options",
			})
		}))
		defer server.Close()

		client, _ := NewClientWithConfig(ClientConfig{
			APIKey:      "test-api-key",
			OrgID:       "test-org-id",
			BaseURL:     server.URL,
			SenderEmail: "test@example.com",
		})

		name := "Options Document"
		desc := "Document with all options"
		replaceFonts := true
		defaultFont := "Arial"
		outputFormat := "pdf"
		_, err := client.TurboTemplate.Generate(context.Background(), &GenerateTemplateRequest{
			TemplateID:   "template-123",
			Name:         &name,
			Description:  &desc,
			Variables:    []TemplateVariable{NewSimpleVariable("test", "value")},
			ReplaceFonts: &replaceFonts,
			DefaultFont:  &defaultFont,
			OutputFormat: &outputFormat,
			Metadata:     map[string]interface{}{"customField": "value"},
		})

		require.NoError(t, err)
	})

	t.Run("returns error when templateId is missing", func(t *testing.T) {
		client, _ := NewClientWithConfig(ClientConfig{
			APIKey:      "test-api-key",
			OrgID:       "test-org-id",
			SenderEmail: "test@example.com",
		})

		_, err := client.TurboTemplate.Generate(context.Background(), &GenerateTemplateRequest{
			Variables: []TemplateVariable{NewSimpleVariable("test", "value")},
		})

		require.Error(t, err)
		assert.Contains(t, err.Error(), "templateId is required")
	})

	t.Run("returns error when variables are empty", func(t *testing.T) {
		client, _ := NewClientWithConfig(ClientConfig{
			APIKey:      "test-api-key",
			OrgID:       "test-org-id",
			SenderEmail: "test@example.com",
		})

		_, err := client.TurboTemplate.Generate(context.Background(), &GenerateTemplateRequest{
			TemplateID: "template-123",
			Variables:  []TemplateVariable{},
		})

		require.Error(t, err)
		assert.Contains(t, err.Error(), "variables are required")
	})

	t.Run("returns error when variable has no value or text", func(t *testing.T) {
		client, _ := NewClientWithConfig(ClientConfig{
			APIKey:      "test-api-key",
			OrgID:       "test-org-id",
			SenderEmail: "test@example.com",
		})

		_, err := client.TurboTemplate.Generate(context.Background(), &GenerateTemplateRequest{
			TemplateID: "template-123",
			Variables:  []TemplateVariable{{Placeholder: "{test}", Name: "test"}},
		})

		require.Error(t, err)
		assert.Contains(t, err.Error(), "must have either Value or Text")
	})

	t.Run("returns error when placeholder is missing", func(t *testing.T) {
		client, _ := NewClientWithConfig(ClientConfig{
			APIKey:      "test-api-key",
			OrgID:       "test-org-id",
			SenderEmail: "test@example.com",
		})

		_, err := client.TurboTemplate.Generate(context.Background(), &GenerateTemplateRequest{
			TemplateID: "template-123",
			Variables:  []TemplateVariable{{Name: "test", Value: "value"}},
		})

		require.Error(t, err)
		assert.Contains(t, err.Error(), "must have Placeholder")
	})

	t.Run("returns error when name is missing", func(t *testing.T) {
		client, _ := NewClientWithConfig(ClientConfig{
			APIKey:      "test-api-key",
			OrgID:       "test-org-id",
			SenderEmail: "test@example.com",
		})

		_, err := client.TurboTemplate.Generate(context.Background(), &GenerateTemplateRequest{
			TemplateID: "template-123",
			Variables:  []TemplateVariable{{Placeholder: "{test}", Value: "value"}},
		})

		require.Error(t, err)
		assert.Contains(t, err.Error(), "must have Name")
	})
}

func TestTurboTemplateClient_PlaceholderAndNameHandling(t *testing.T) {
	t.Run("requires both placeholder and name in generated request", func(t *testing.T) {
		server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			var reqBody GenerateTemplateRequest
			json.NewDecoder(r.Body).Decode(&reqBody)
			assert.Equal(t, "{customer}", reqBody.Variables[0].Placeholder)
			assert.Equal(t, "customer", reqBody.Variables[0].Name)

			w.Header().Set("Content-Type", "application/json")
			json.NewEncoder(w).Encode(map[string]interface{}{
				"success":       true,
				"deliverableId": "doc-both",
			})
		}))
		defer server.Close()

		client, _ := NewClientWithConfig(ClientConfig{
			APIKey:      "test-api-key",
			OrgID:       "test-org-id",
			BaseURL:     server.URL,
			SenderEmail: "test@example.com",
		})

		name := "Both Fields Document"
		desc := "Document with both placeholder and name"
		_, err := client.TurboTemplate.Generate(context.Background(), &GenerateTemplateRequest{
			TemplateID:  "template-123",
			Name:        &name,
			Description: &desc,
			Variables: []TemplateVariable{
				{Placeholder: "{customer}", Name: "customer", Value: "Person A"},
			},
		})

		require.NoError(t, err)
	})

	t.Run("allows distinct placeholder and name values", func(t *testing.T) {
		server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			var reqBody GenerateTemplateRequest
			json.NewDecoder(r.Body).Decode(&reqBody)
			assert.Equal(t, "{cust_name}", reqBody.Variables[0].Placeholder)
			assert.Equal(t, "customerFullName", reqBody.Variables[0].Name)

			w.Header().Set("Content-Type", "application/json")
			json.NewEncoder(w).Encode(map[string]interface{}{
				"success":       true,
				"deliverableId": "doc-distinct",
			})
		}))
		defer server.Close()

		client, _ := NewClientWithConfig(ClientConfig{
			APIKey:      "test-api-key",
			OrgID:       "test-org-id",
			BaseURL:     server.URL,
			SenderEmail: "test@example.com",
		})

		name := "Distinct Fields Document"
		desc := "Document with distinct placeholder and name"
		_, err := client.TurboTemplate.Generate(context.Background(), &GenerateTemplateRequest{
			TemplateID:  "template-123",
			Name:        &name,
			Description: &desc,
			Variables: []TemplateVariable{
				{Placeholder: "{cust_name}", Name: "customerFullName", Value: "Person A"},
			},
		})

		require.NoError(t, err)
	})
}

func TestTurboTemplateClient_ErrorHandling(t *testing.T) {
	t.Run("handles API errors gracefully", func(t *testing.T) {
		server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusNotFound)
			json.NewEncoder(w).Encode(map[string]interface{}{
				"message": "Template not found",
				"code":    "TEMPLATE_NOT_FOUND",
			})
		}))
		defer server.Close()

		client, _ := NewClientWithConfig(ClientConfig{
			APIKey:      "test-api-key",
			OrgID:       "test-org-id",
			BaseURL:     server.URL,
			SenderEmail: "test@example.com",
		})

		name := "Error Document"
		desc := "Document that should fail"
		_, err := client.TurboTemplate.Generate(context.Background(), &GenerateTemplateRequest{
			TemplateID:  "invalid-template",
			Name:        &name,
			Description: &desc,
			Variables:   []TemplateVariable{NewSimpleVariable("test", "value")},
		})

		require.Error(t, err)
		notFoundErr, ok := err.(*NotFoundError)
		require.True(t, ok, "expected NotFoundError")
		assert.Equal(t, 404, notFoundErr.StatusCode)
	})

	t.Run("handles validation errors", func(t *testing.T) {
		server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusBadRequest)
			json.NewEncoder(w).Encode(map[string]interface{}{
				"message": "Validation failed: Invalid variable configuration",
				"code":    "VALIDATION_ERROR",
			})
		}))
		defer server.Close()

		client, _ := NewClientWithConfig(ClientConfig{
			APIKey:      "test-api-key",
			OrgID:       "test-org-id",
			BaseURL:     server.URL,
			SenderEmail: "test@example.com",
		})

		name := "Validation Error Document"
		desc := "Document that should fail validation"
		_, err := client.TurboTemplate.Generate(context.Background(), &GenerateTemplateRequest{
			TemplateID:  "template-123",
			Name:        &name,
			Description: &desc,
			Variables:   []TemplateVariable{NewSimpleVariable("test", "value")},
		})

		require.Error(t, err)
		validationErr, ok := err.(*ValidationError)
		require.True(t, ok, "expected ValidationError")
		assert.Equal(t, 400, validationErr.StatusCode)
	})

	t.Run("handles rate limit errors", func(t *testing.T) {
		server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusTooManyRequests)
			json.NewEncoder(w).Encode(map[string]interface{}{
				"message": "Rate limit exceeded",
				"code":    "RATE_LIMIT_EXCEEDED",
			})
		}))
		defer server.Close()

		client, _ := NewClientWithConfig(ClientConfig{
			APIKey:      "test-api-key",
			OrgID:       "test-org-id",
			BaseURL:     server.URL,
			SenderEmail: "test@example.com",
		})

		name := "Rate Limit Document"
		desc := "Document that should hit rate limit"
		_, err := client.TurboTemplate.Generate(context.Background(), &GenerateTemplateRequest{
			TemplateID:  "template-123",
			Name:        &name,
			Description: &desc,
			Variables:   []TemplateVariable{NewSimpleVariable("test", "value")},
		})

		require.Error(t, err)
		rateLimitErr, ok := err.(*RateLimitError)
		require.True(t, ok, "expected RateLimitError")
		assert.Equal(t, 429, rateLimitErr.StatusCode)
	})
}
