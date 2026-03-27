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

func newDeliverableTestClient(t *testing.T, handler http.HandlerFunc) *DeliverableClient {
	server := httptest.NewServer(handler)
	t.Cleanup(server.Close)

	client, err := NewDeliverableClientOnly(ClientConfig{
		APIKey:  "test-api-key",
		OrgID:   "test-org-id",
		BaseURL: server.URL,
	})
	require.NoError(t, err)
	return client
}

func TestNewDeliverableClientOnly(t *testing.T) {
	t.Run("creates client without sender email", func(t *testing.T) {
		client, err := NewDeliverableClientOnly(ClientConfig{
			APIKey:  "test-key",
			OrgID:   "test-org",
			BaseURL: "https://api.example.com",
		})
		require.NoError(t, err)
		assert.NotNil(t, client)
	})

	t.Run("requires API key", func(t *testing.T) {
		_, err := NewDeliverableClientOnly(ClientConfig{
			OrgID: "test-org",
		})
		require.Error(t, err)
	})

	t.Run("requires org ID", func(t *testing.T) {
		_, err := NewDeliverableClientOnly(ClientConfig{
			APIKey: "test-key",
		})
		require.Error(t, err)
		_, ok := err.(*AuthenticationError)
		assert.True(t, ok)
	})
}

func TestDeliverableClient_ListDeliverables(t *testing.T) {
	t.Run("lists deliverables", func(t *testing.T) {
		client := newDeliverableTestClient(t, func(w http.ResponseWriter, r *http.Request) {
			assert.Equal(t, "GET", r.Method)
			assert.Contains(t, r.URL.Path, "/v1/deliverable")
			assert.Equal(t, "5", r.URL.Query().Get("limit"))
			assert.Equal(t, "true", r.URL.Query().Get("showTags"))

			w.Header().Set("Content-Type", "application/json")
			json.NewEncoder(w).Encode(DeliverableListResponse{
				Results:      []DeliverableRecord{{ID: "d1", Name: "Contract A"}},
				TotalRecords: 1,
			})
		})

		result, err := client.ListDeliverables(context.Background(), &ListDeliverablesOptions{
			Limit:    5,
			ShowTags: true,
		})
		require.NoError(t, err)
		assert.Equal(t, 1, result.TotalRecords)
		assert.Equal(t, "d1", result.Results[0].ID)
	})

	t.Run("lists without options", func(t *testing.T) {
		client := newDeliverableTestClient(t, func(w http.ResponseWriter, r *http.Request) {
			assert.Equal(t, "/v1/deliverable", r.URL.Path)
			assert.Empty(t, r.URL.RawQuery)

			w.Header().Set("Content-Type", "application/json")
			json.NewEncoder(w).Encode(DeliverableListResponse{
				Results:      []DeliverableRecord{},
				TotalRecords: 0,
			})
		})

		result, err := client.ListDeliverables(context.Background(), nil)
		require.NoError(t, err)
		assert.Equal(t, 0, result.TotalRecords)
	})
}

func TestDeliverableClient_GenerateDeliverable(t *testing.T) {
	t.Run("generates deliverable", func(t *testing.T) {
		client := newDeliverableTestClient(t, func(w http.ResponseWriter, r *http.Request) {
			assert.Equal(t, "POST", r.Method)
			assert.Equal(t, "/v1/deliverable", r.URL.Path)
			assert.Equal(t, "Bearer test-api-key", r.Header.Get("Authorization"))

			var body CreateDeliverableRequest
			json.NewDecoder(r.Body).Decode(&body)
			assert.Equal(t, "Employee Contract", body.Name)
			assert.Equal(t, "tmpl-1", body.TemplateID)
			assert.Len(t, body.Variables, 1)

			w.Header().Set("Content-Type", "application/json")
			json.NewEncoder(w).Encode(CreateDeliverableResponse{
				Results: struct {
					Deliverable DeliverableRecord `json:"deliverable"`
				}{
					Deliverable: DeliverableRecord{ID: "new-d-id", Name: "Employee Contract"},
				},
			})
		})

		result, err := client.GenerateDeliverable(context.Background(), &CreateDeliverableRequest{
			Name:       "Employee Contract",
			TemplateID: "tmpl-1",
			Variables: []DeliverableVariable{
				{Placeholder: "{Name}", Text: "John", MimeType: "text"},
			},
			Tags:         []string{"hr"},
		})
		require.NoError(t, err)
		assert.Equal(t, "new-d-id", result.Results.Deliverable.ID)
	})
}

func TestDeliverableClient_GetDeliverableDetails(t *testing.T) {
	t.Run("gets deliverable details", func(t *testing.T) {
		client := newDeliverableTestClient(t, func(w http.ResponseWriter, r *http.Request) {
			assert.Equal(t, "GET", r.Method)
			assert.Equal(t, "/v1/deliverable/d1", r.URL.Path)
			assert.Equal(t, "true", r.URL.Query().Get("showTags"))

			w.Header().Set("Content-Type", "application/json")
			json.NewEncoder(w).Encode(GetDeliverableResponse{
				Results: DeliverableRecord{
					ID:           "d1",
					Name:         "Contract A",
					TemplateName: "Standard",
					Tags:         []Tag{{ID: "t1", Label: "hr"}},
				},
			})
		})

		result, err := client.GetDeliverableDetails(context.Background(), "d1", &GetDeliverableOptions{ShowTags: true})
		require.NoError(t, err)
		assert.Equal(t, "d1", result.ID)
		assert.Equal(t, "Contract A", result.Name)
		assert.Len(t, result.Tags, 1)
	})
}

func TestDeliverableClient_UpdateDeliverableInfo(t *testing.T) {
	t.Run("updates deliverable", func(t *testing.T) {
		client := newDeliverableTestClient(t, func(w http.ResponseWriter, r *http.Request) {
			assert.Equal(t, "PATCH", r.Method)
			assert.Equal(t, "/v1/deliverable/d1", r.URL.Path)

			w.Header().Set("Content-Type", "application/json")
			json.NewEncoder(w).Encode(UpdateDeliverableResponse{
				Message:       "Deliverable updated successfully",
				DeliverableID: "d1",
			})
		})

		tags := []string{"finalized"}
		result, err := client.UpdateDeliverableInfo(context.Background(), "d1", &UpdateDeliverableRequest{
			Name: "Updated Name",
			Tags: &tags,
		})
		require.NoError(t, err)
		assert.Equal(t, "Deliverable updated successfully", result.Message)
	})
}

func TestDeliverableClient_DeleteDeliverable(t *testing.T) {
	t.Run("deletes deliverable", func(t *testing.T) {
		client := newDeliverableTestClient(t, func(w http.ResponseWriter, r *http.Request) {
			assert.Equal(t, "DELETE", r.Method)
			assert.Equal(t, "/v1/deliverable/d1", r.URL.Path)

			w.Header().Set("Content-Type", "application/json")
			json.NewEncoder(w).Encode(DeleteDeliverableResponse{
				Message:       "Deliverable deleted successfully",
				DeliverableID: "d1",
			})
		})

		result, err := client.DeleteDeliverable(context.Background(), "d1")
		require.NoError(t, err)
		assert.Equal(t, "Deliverable deleted successfully", result.Message)
	})
}

func TestDeliverableClient_DownloadSourceFile(t *testing.T) {
	t.Run("downloads source file", func(t *testing.T) {
		mockContent := []byte("PK\x03\x04mock-docx-content")
		client := newDeliverableTestClient(t, func(w http.ResponseWriter, r *http.Request) {
			assert.Equal(t, "GET", r.Method)
			assert.Equal(t, "/v1/deliverable/file/d1", r.URL.Path)
			w.Write(mockContent)
		})

		result, err := client.DownloadSourceFile(context.Background(), "d1")
		require.NoError(t, err)
		assert.Equal(t, mockContent, result)
	})
}

func TestDeliverableClient_DownloadPDF(t *testing.T) {
	t.Run("downloads PDF", func(t *testing.T) {
		mockContent := []byte("%PDF-mock-content")
		client := newDeliverableTestClient(t, func(w http.ResponseWriter, r *http.Request) {
			assert.Equal(t, "GET", r.Method)
			assert.Equal(t, "/v1/deliverable/file/pdf/d1", r.URL.Path)
			w.Write(mockContent)
		})

		result, err := client.DownloadPDF(context.Background(), "d1")
		require.NoError(t, err)
		assert.Equal(t, mockContent, result)
	})
}

