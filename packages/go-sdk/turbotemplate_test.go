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
	t.Run("creates simple variable with placeholder, name, value and mimeType", func(t *testing.T) {
		variable, err := NewSimpleVariable("{customer_name}", "customer_name", "Person A", MimeTypeText)

		require.NoError(t, err)
		assert.Equal(t, "{customer_name}", variable.Placeholder)
		assert.Equal(t, "customer_name", variable.Name)
		assert.Equal(t, "Person A", variable.Value)
		assert.Equal(t, MimeTypeText, variable.MimeType)
	})

	t.Run("creates simple variable with number value", func(t *testing.T) {
		variable, err := NewSimpleVariable("{order_total}", "order_total", 1500, MimeTypeText)

		require.NoError(t, err)
		assert.Equal(t, "{order_total}", variable.Placeholder)
		assert.Equal(t, "order_total", variable.Name)
		assert.Equal(t, 1500, variable.Value)
		assert.Equal(t, MimeTypeText, variable.MimeType)
	})

	t.Run("creates simple variable with html mimeType", func(t *testing.T) {
		variable, err := NewSimpleVariable("{content}", "content", "<b>Bold</b>", MimeTypeHTML)

		require.NoError(t, err)
		assert.Equal(t, "{content}", variable.Placeholder)
		assert.Equal(t, "content", variable.Name)
		assert.Equal(t, "<b>Bold</b>", variable.Value)
		assert.Equal(t, MimeTypeHTML, variable.MimeType)
	})

	t.Run("returns error when placeholder is missing", func(t *testing.T) {
		_, err := NewSimpleVariable("", "name", "value", MimeTypeText)

		assert.Error(t, err)
		assert.Contains(t, err.Error(), "placeholder is required")
	})

	t.Run("returns error when name is missing", func(t *testing.T) {
		_, err := NewSimpleVariable("{test}", "", "value", MimeTypeText)

		assert.Error(t, err)
		assert.Contains(t, err.Error(), "name is required")
	})

	t.Run("returns error when mimeType is missing", func(t *testing.T) {
		_, err := NewSimpleVariable("{test}", "test", "value", "")

		assert.Error(t, err)
		assert.Contains(t, err.Error(), "mimeType is required")
	})

	t.Run("returns error when mimeType is invalid", func(t *testing.T) {
		_, err := NewSimpleVariable("{test}", "test", "value", MimeTypeJSON)

		assert.Error(t, err)
		assert.Contains(t, err.Error(), "mimeType must be 'text' or 'html'")
	})
}

func TestNewAdvancedEngineVariable(t *testing.T) {
	t.Run("creates advanced engine variable with object value", func(t *testing.T) {
		variable, err := NewAdvancedEngineVariable("{user}", "user", map[string]interface{}{
			"firstName": "Foo",
			"lastName":  "Bar",
			"email":     "foo@example.com",
		})

		require.NoError(t, err)
		assert.Equal(t, "{user}", variable.Placeholder)
		assert.Equal(t, "user", variable.Name)
		assert.Equal(t, map[string]interface{}{
			"firstName": "Foo",
			"lastName":  "Bar",
			"email":     "foo@example.com",
		}, variable.Value)
		assert.Equal(t, MimeTypeJSON, variable.MimeType)
		assert.NotNil(t, variable.UsesAdvancedTemplatingEngine)
		assert.True(t, *variable.UsesAdvancedTemplatingEngine)
	})

	t.Run("creates advanced engine variable with deeply nested object", func(t *testing.T) {
		variable, err := NewAdvancedEngineVariable("{company}", "company", map[string]interface{}{
			"name": "Company ABC",
			"address": map[string]interface{}{
				"street": "123 Test Street",
				"city":   "Test City",
				"state":  "TS",
			},
		})

		require.NoError(t, err)
		assert.Equal(t, "{company}", variable.Placeholder)
		assert.Equal(t, MimeTypeJSON, variable.MimeType)
		assert.True(t, *variable.UsesAdvancedTemplatingEngine)
	})

	t.Run("returns error when placeholder is missing", func(t *testing.T) {
		_, err := NewAdvancedEngineVariable("", "user", map[string]interface{}{"name": "Test"})

		assert.Error(t, err)
		assert.Contains(t, err.Error(), "placeholder is required")
	})

	t.Run("returns error when name is missing", func(t *testing.T) {
		_, err := NewAdvancedEngineVariable("{user}", "", map[string]interface{}{"name": "Test"})

		assert.Error(t, err)
		assert.Contains(t, err.Error(), "name is required")
	})
}

func TestNewLoopVariable(t *testing.T) {
	t.Run("creates loop variable with array value", func(t *testing.T) {
		variable, err := NewLoopVariable("{items}", "items", []interface{}{
			map[string]interface{}{"name": "Item A", "price": 100},
			map[string]interface{}{"name": "Item B", "price": 200},
		})

		require.NoError(t, err)
		assert.Equal(t, "{items}", variable.Placeholder)
		assert.Equal(t, "items", variable.Name)
		assert.Equal(t, MimeTypeJSON, variable.MimeType)
		assert.True(t, *variable.UsesAdvancedTemplatingEngine)
	})

	t.Run("creates loop variable with empty array", func(t *testing.T) {
		variable, err := NewLoopVariable("{products}", "products", []interface{}{})

		require.NoError(t, err)
		assert.Equal(t, "{products}", variable.Placeholder)
		assert.Equal(t, []interface{}{}, variable.Value)
		assert.Equal(t, MimeTypeJSON, variable.MimeType)
	})

	t.Run("creates loop variable with primitive array", func(t *testing.T) {
		variable, err := NewLoopVariable("{tags}", "tags", []interface{}{"tag1", "tag2", "tag3"})

		require.NoError(t, err)
		assert.Equal(t, []interface{}{"tag1", "tag2", "tag3"}, variable.Value)
		assert.Equal(t, MimeTypeJSON, variable.MimeType)
	})

	t.Run("returns error when placeholder is missing", func(t *testing.T) {
		_, err := NewLoopVariable("", "items", []interface{}{})

		assert.Error(t, err)
		assert.Contains(t, err.Error(), "placeholder is required")
	})

	t.Run("returns error when name is missing", func(t *testing.T) {
		_, err := NewLoopVariable("{items}", "", []interface{}{})

		assert.Error(t, err)
		assert.Contains(t, err.Error(), "name is required")
	})
}

func TestNewConditionalVariable(t *testing.T) {
	t.Run("creates conditional variable with boolean true", func(t *testing.T) {
		variable, err := NewConditionalVariable("{is_premium}", "is_premium", true)

		require.NoError(t, err)
		assert.Equal(t, "{is_premium}", variable.Placeholder)
		assert.Equal(t, "is_premium", variable.Name)
		assert.Equal(t, true, variable.Value)
		assert.Equal(t, MimeTypeJSON, variable.MimeType)
		assert.True(t, *variable.UsesAdvancedTemplatingEngine)
	})

	t.Run("creates conditional variable with boolean false", func(t *testing.T) {
		variable, err := NewConditionalVariable("{show_discount}", "show_discount", false)

		require.NoError(t, err)
		assert.Equal(t, false, variable.Value)
		assert.Equal(t, MimeTypeJSON, variable.MimeType)
		assert.True(t, *variable.UsesAdvancedTemplatingEngine)
	})

	t.Run("creates conditional variable with truthy value", func(t *testing.T) {
		variable, err := NewConditionalVariable("{count}", "count", 5)

		require.NoError(t, err)
		assert.Equal(t, 5, variable.Value)
		assert.Equal(t, MimeTypeJSON, variable.MimeType)
	})

	t.Run("returns error when placeholder is missing", func(t *testing.T) {
		_, err := NewConditionalVariable("", "is_active", true)

		assert.Error(t, err)
		assert.Contains(t, err.Error(), "placeholder is required")
	})

	t.Run("returns error when name is missing", func(t *testing.T) {
		_, err := NewConditionalVariable("{is_active}", "", true)

		assert.Error(t, err)
		assert.Contains(t, err.Error(), "name is required")
	})
}

func TestNewImageVariable(t *testing.T) {
	t.Run("creates image variable with URL", func(t *testing.T) {
		variable, err := NewImageVariable("{logo}", "logo", "https://example.com/logo.png")

		require.NoError(t, err)
		assert.Equal(t, "{logo}", variable.Placeholder)
		assert.Equal(t, "logo", variable.Name)
		assert.Equal(t, "https://example.com/logo.png", variable.Value)
		assert.Equal(t, MimeTypeImage, variable.MimeType)
	})

	t.Run("creates image variable with base64", func(t *testing.T) {
		base64Image := "data:image/png;base64,iVBORw0KGgoAAAANSUhEUg..."
		variable, err := NewImageVariable("{signature}", "signature", base64Image)

		require.NoError(t, err)
		assert.Equal(t, base64Image, variable.Value)
		assert.Equal(t, MimeTypeImage, variable.MimeType)
	})

	t.Run("returns error when placeholder is missing", func(t *testing.T) {
		_, err := NewImageVariable("", "logo", "https://example.com/logo.png")

		assert.Error(t, err)
		assert.Contains(t, err.Error(), "placeholder is required")
	})

	t.Run("returns error when name is missing", func(t *testing.T) {
		_, err := NewImageVariable("{logo}", "", "https://example.com/logo.png")

		assert.Error(t, err)
		assert.Contains(t, err.Error(), "name is required")
	})

	t.Run("returns error when imageURL is missing", func(t *testing.T) {
		_, err := NewImageVariable("{logo}", "logo", "")

		assert.Error(t, err)
		assert.Contains(t, err.Error(), "imageURL is required")
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
				{Placeholder: "{customer_name}", Name: "customer_name", Value: "Person A", MimeType: MimeTypeText},
				{Placeholder: "{order_total}", Name: "order_total", Value: 1500, MimeType: MimeTypeText},
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
			assert.Equal(t, "json", string(reqBody.Variables[0].MimeType))
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
					MimeType:                     mimeTypeJSON,
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
					MimeType:                     mimeTypeJSON,
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
				must(NewSimpleVariable("{title}", "title", "Quarterly Report", MimeTypeText)),
				must(NewAdvancedEngineVariable("{company}", "company", map[string]interface{}{"name": "Company XYZ", "employees": 500})),
				must(NewLoopVariable("{departments}", "departments", []interface{}{map[string]interface{}{"name": "Dept A"}, map[string]interface{}{"name": "Dept B"}})),
				must(NewConditionalVariable("{show_financials}", "show_financials", true)),
				must(NewImageVariable("{logo}", "logo", "https://example.com/logo.png")),
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
			Variables:    []TemplateVariable{must(NewSimpleVariable("{test}", "test", "value", MimeTypeText))},
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
			Variables: []TemplateVariable{must(NewSimpleVariable("{test}", "test", "value", MimeTypeText))},
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

	t.Run("allows variable with no value or text", func(t *testing.T) {
		server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			w.Header().Set("Content-Type", "application/json")
			json.NewEncoder(w).Encode(map[string]interface{}{
				"success":       true,
				"deliverableId": "doc-no-value",
			})
		}))
		defer server.Close()

		client, _ := NewClientWithConfig(ClientConfig{
			APIKey:      "test-api-key",
			OrgID:       "test-org-id",
			BaseURL:     server.URL,
			SenderEmail: "test@example.com",
		})

		mimeType := MimeTypeText
		result, err := client.TurboTemplate.Generate(context.Background(), &GenerateTemplateRequest{
			TemplateID: "template-123",
			Variables:  []TemplateVariable{{Placeholder: "{test}", Name: "test", MimeType: mimeType}},
		})

		require.NoError(t, err)
		assert.True(t, result.Success)
	})

	t.Run("allows variable with nil value", func(t *testing.T) {
		server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			w.Header().Set("Content-Type", "application/json")
			json.NewEncoder(w).Encode(map[string]interface{}{
				"success":       true,
				"deliverableId": "doc-nil-value",
			})
		}))
		defer server.Close()

		client, _ := NewClientWithConfig(ClientConfig{
			APIKey:      "test-api-key",
			OrgID:       "test-org-id",
			BaseURL:     server.URL,
			SenderEmail: "test@example.com",
		})

		mimeType := MimeTypeText
		result, err := client.TurboTemplate.Generate(context.Background(), &GenerateTemplateRequest{
			TemplateID: "template-123",
			Variables:  []TemplateVariable{{Placeholder: "{test}", Name: "test", Value: nil, MimeType: mimeType}},
		})

		require.NoError(t, err)
		assert.True(t, result.Success)
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
				{Placeholder: "{customer}", Name: "customer", Value: "Person A", MimeType: MimeTypeText},
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
				{Placeholder: "{cust_name}", Name: "customerFullName", Value: "Person A", MimeType: MimeTypeText},
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
			Variables:   []TemplateVariable{must(NewSimpleVariable("{test}", "test", "value", MimeTypeText))},
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
			Variables:   []TemplateVariable{must(NewSimpleVariable("{test}", "test", "value", MimeTypeText))},
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
			Variables:   []TemplateVariable{must(NewSimpleVariable("{test}", "test", "value", MimeTypeText))},
		})

		require.Error(t, err)
		rateLimitErr, ok := err.(*RateLimitError)
		require.True(t, ok, "expected RateLimitError")
		assert.Equal(t, 429, rateLimitErr.StatusCode)
	})
}

// must is a helper function to handle errors in variable creation for tests
func must(v TemplateVariable, err error) TemplateVariable {
	if err != nil {
		panic(err)
	}
	return v
}

func TestTurboTemplateClient_Download(t *testing.T) {
	t.Run("downloads deliverable in source format by default", func(t *testing.T) {
		mockContent := []byte("mock document content")

		server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			assert.Equal(t, "/v1/deliverable/file/deliverable-123", r.URL.Path)
			assert.Equal(t, "GET", r.Method)
			w.Write(mockContent)
		}))
		defer server.Close()

		client, _ := NewClientWithConfig(ClientConfig{
			APIKey:      "test-api-key",
			OrgID:       "test-org-id",
			BaseURL:     server.URL,
			SenderEmail: "test@example.com",
		})

		result, err := client.TurboTemplate.Download(context.Background(), "deliverable-123", DownloadFormatSource)

		require.NoError(t, err)
		assert.Equal(t, mockContent, result)
	})

	t.Run("downloads deliverable as PDF when format is pdf", func(t *testing.T) {
		mockContent := []byte("mock pdf content")

		server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			assert.Equal(t, "/v1/deliverable/file/pdf/deliverable-456", r.URL.Path)
			assert.Equal(t, "GET", r.Method)
			w.Write(mockContent)
		}))
		defer server.Close()

		client, _ := NewClientWithConfig(ClientConfig{
			APIKey:      "test-api-key",
			OrgID:       "test-org-id",
			BaseURL:     server.URL,
			SenderEmail: "test@example.com",
		})

		result, err := client.TurboTemplate.Download(context.Background(), "deliverable-456", DownloadFormatPDF)

		require.NoError(t, err)
		assert.Equal(t, mockContent, result)
	})

	t.Run("returns error when deliverableID is empty", func(t *testing.T) {
		client, _ := NewClientWithConfig(ClientConfig{
			APIKey:      "test-api-key",
			OrgID:       "test-org-id",
			SenderEmail: "test@example.com",
		})

		_, err := client.TurboTemplate.Download(context.Background(), "", DownloadFormatSource)

		require.Error(t, err)
		assert.Contains(t, err.Error(), "deliverableID is required")
	})

	t.Run("handles download errors", func(t *testing.T) {
		server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusNotFound)
			w.Write([]byte(`{"message": "Deliverable not found"}`))
		}))
		defer server.Close()

		client, _ := NewClientWithConfig(ClientConfig{
			APIKey:      "test-api-key",
			OrgID:       "test-org-id",
			BaseURL:     server.URL,
			SenderEmail: "test@example.com",
		})

		_, err := client.TurboTemplate.Download(context.Background(), "invalid-id", DownloadFormatSource)

		require.Error(t, err)
	})
}
