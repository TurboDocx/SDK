package turbodocx

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"mime/multipart"
	"net/http"
	"time"
)

// HTTPClient handles HTTP requests to the TurboDocx API
type HTTPClient struct {
	client  *http.Client
	config  ClientConfig
	baseURL string
}

// NewHTTPClient creates a new HTTP client
func NewHTTPClient(config ClientConfig) *HTTPClient {
	return &HTTPClient{
		client: &http.Client{
			Timeout: 30 * time.Second,
		},
		config:  config,
		baseURL: config.BaseURL,
	}
}

// TurboDocxError represents an API error
type TurboDocxError struct {
	Message    string `json:"message"`
	StatusCode int    `json:"statusCode"`
	Code       string `json:"code,omitempty"`
}

func (e *TurboDocxError) Error() string {
	if e.Code != "" {
		return fmt.Sprintf("TurboDocx API error [%s]: %s (status %d)", e.Code, e.Message, e.StatusCode)
	}
	return fmt.Sprintf("TurboDocx API error: %s (status %d)", e.Message, e.StatusCode)
}

func (c *HTTPClient) setHeaders(req *http.Request, contentType string) {
	if contentType != "" {
		req.Header.Set("Content-Type", contentType)
	}

	if c.config.AccessToken != "" {
		req.Header.Set("Authorization", "Bearer "+c.config.AccessToken)
	} else if c.config.APIKey != "" {
		req.Header.Set("X-API-Key", c.config.APIKey)
	}
}

func (c *HTTPClient) handleResponse(resp *http.Response, result interface{}) error {
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return fmt.Errorf("failed to read response body: %w", err)
	}

	if resp.StatusCode >= 400 {
		var apiErr struct {
			Message string `json:"message"`
			Error   string `json:"error"`
			Code    string `json:"code"`
		}
		if err := json.Unmarshal(body, &apiErr); err == nil {
			msg := apiErr.Message
			if msg == "" {
				msg = apiErr.Error
			}
			if msg == "" {
				msg = resp.Status
			}
			return &TurboDocxError{
				Message:    msg,
				StatusCode: resp.StatusCode,
				Code:       apiErr.Code,
			}
		}
		return &TurboDocxError{
			Message:    resp.Status,
			StatusCode: resp.StatusCode,
		}
	}

	if result != nil {
		if err := json.Unmarshal(body, result); err != nil {
			return fmt.Errorf("failed to decode response: %w", err)
		}
	}

	return nil
}

// Get performs a GET request
func (c *HTTPClient) Get(ctx context.Context, path string, result interface{}) error {
	req, err := http.NewRequestWithContext(ctx, "GET", c.baseURL+path, nil)
	if err != nil {
		return fmt.Errorf("failed to create request: %w", err)
	}

	c.setHeaders(req, "application/json")

	resp, err := c.client.Do(req)
	if err != nil {
		return fmt.Errorf("request failed: %w", err)
	}

	return c.handleResponse(resp, result)
}

// GetRaw performs a GET request and returns raw bytes (for file downloads)
func (c *HTTPClient) GetRaw(ctx context.Context, path string) ([]byte, error) {
	req, err := http.NewRequestWithContext(ctx, "GET", c.baseURL+path, nil)
	if err != nil {
		return nil, fmt.Errorf("failed to create request: %w", err)
	}

	c.setHeaders(req, "")

	resp, err := c.client.Do(req)
	if err != nil {
		return nil, fmt.Errorf("request failed: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode >= 400 {
		return nil, &TurboDocxError{
			Message:    resp.Status,
			StatusCode: resp.StatusCode,
		}
	}

	return io.ReadAll(resp.Body)
}

// Post performs a POST request with JSON body
func (c *HTTPClient) Post(ctx context.Context, path string, data interface{}, result interface{}) error {
	var body io.Reader
	if data != nil {
		jsonData, err := json.Marshal(data)
		if err != nil {
			return fmt.Errorf("failed to marshal request body: %w", err)
		}
		body = bytes.NewReader(jsonData)
	}

	req, err := http.NewRequestWithContext(ctx, "POST", c.baseURL+path, body)
	if err != nil {
		return fmt.Errorf("failed to create request: %w", err)
	}

	c.setHeaders(req, "application/json")

	resp, err := c.client.Do(req)
	if err != nil {
		return fmt.Errorf("request failed: %w", err)
	}

	return c.handleResponse(resp, result)
}

// UploadFile performs a multipart file upload
func (c *HTTPClient) UploadFile(ctx context.Context, path string, file []byte, fileName string, additionalData map[string]string, result interface{}) error {
	var buf bytes.Buffer
	writer := multipart.NewWriter(&buf)

	// Add file
	part, err := writer.CreateFormFile("file", fileName)
	if err != nil {
		return fmt.Errorf("failed to create form file: %w", err)
	}
	if _, err := part.Write(file); err != nil {
		return fmt.Errorf("failed to write file data: %w", err)
	}

	// Add additional fields
	for key, value := range additionalData {
		if err := writer.WriteField(key, value); err != nil {
			return fmt.Errorf("failed to write field %s: %w", key, err)
		}
	}

	if err := writer.Close(); err != nil {
		return fmt.Errorf("failed to close multipart writer: %w", err)
	}

	req, err := http.NewRequestWithContext(ctx, "POST", c.baseURL+path, &buf)
	if err != nil {
		return fmt.Errorf("failed to create request: %w", err)
	}

	c.setHeaders(req, "")
	req.Header.Set("Content-Type", writer.FormDataContentType())

	resp, err := c.client.Do(req)
	if err != nil {
		return fmt.Errorf("request failed: %w", err)
	}

	return c.handleResponse(resp, result)
}
