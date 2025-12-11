package turbodocx

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"mime/multipart"
	"net/http"
	"net/textproto"
	"os"
	"path/filepath"
	"strings"
	"time"
)

// FileTypeInfo contains detected file type information
type FileTypeInfo struct {
	MimeType  string
	Extension string
}

// DetectFileType detects file type from magic bytes
func DetectFileType(fileBytes []byte) FileTypeInfo {
	if len(fileBytes) < 4 {
		return FileTypeInfo{MimeType: "application/octet-stream", Extension: "bin"}
	}

	// PDF: %PDF (0x25 0x50 0x44 0x46)
	if fileBytes[0] == 0x25 && fileBytes[1] == 0x50 && fileBytes[2] == 0x44 && fileBytes[3] == 0x46 {
		return FileTypeInfo{MimeType: "application/pdf", Extension: "pdf"}
	}

	// ZIP-based formats (DOCX, PPTX): starts with PK (0x50 0x4B)
	if fileBytes[0] == 0x50 && fileBytes[1] == 0x4B {
		headerLen := len(fileBytes)
		if headerLen > 2000 {
			headerLen = 2000
		}
		header := string(fileBytes[:headerLen])

		// PPTX contains 'ppt/' in the ZIP structure
		if strings.Contains(header, "ppt/") {
			return FileTypeInfo{
				MimeType:  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
				Extension: "pptx",
			}
		}

		// DOCX contains 'word/' in the ZIP structure
		if strings.Contains(header, "word/") {
			return FileTypeInfo{
				MimeType:  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
				Extension: "docx",
			}
		}

		// Default to DOCX for unknown ZIP
		return FileTypeInfo{
			MimeType:  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
			Extension: "docx",
		}
	}

	// Unknown file type
	return FileTypeInfo{MimeType: "application/octet-stream", Extension: "bin"}
}

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

// GetSenderConfig returns the sender email and name configuration
func (c *HTTPClient) GetSenderConfig() (senderEmail, senderName string) {
	return c.config.SenderEmail, c.config.SenderName
}

// TurboDocxError represents a base API error
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

// AuthenticationError is raised when authentication fails (HTTP 401)
type AuthenticationError struct {
	TurboDocxError
}

// ValidationError is raised when validation fails (HTTP 400)
type ValidationError struct {
	TurboDocxError
}

// NotFoundError is raised when resource is not found (HTTP 404)
type NotFoundError struct {
	TurboDocxError
}

// RateLimitError is raised when rate limit is exceeded (HTTP 429)
type RateLimitError struct {
	TurboDocxError
}

// NetworkError is raised when network request fails
type NetworkError struct {
	TurboDocxError
}

func (c *HTTPClient) setHeaders(req *http.Request, contentType string) {
	if contentType != "" {
		req.Header.Set("Content-Type", contentType)
	}

	// API key is sent as Bearer token (backend expects Authorization header)
	if c.config.AccessToken != "" {
		req.Header.Set("Authorization", "Bearer "+c.config.AccessToken)
	} else if c.config.APIKey != "" {
		req.Header.Set("Authorization", "Bearer "+c.config.APIKey)
	}

	// Organization ID header (required by backend)
	if c.config.OrgID != "" {
		req.Header.Set("x-rapiddocx-org-id", c.config.OrgID)
	}
}

func (c *HTTPClient) handleResponse(resp *http.Response, result interface{}) error {
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return &NetworkError{TurboDocxError: TurboDocxError{
			Message:    fmt.Sprintf("failed to read response body: %v", err),
			StatusCode: 0,
		}}
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
			baseErr := TurboDocxError{
				Message:    msg,
				StatusCode: resp.StatusCode,
				Code:       apiErr.Code,
			}

			switch resp.StatusCode {
			case 400:
				return &ValidationError{TurboDocxError: baseErr}
			case 401:
				return &AuthenticationError{TurboDocxError: baseErr}
			case 404:
				return &NotFoundError{TurboDocxError: baseErr}
			case 429:
				return &RateLimitError{TurboDocxError: baseErr}
			default:
				return &baseErr
			}
		}
		baseErr := TurboDocxError{
			Message:    resp.Status,
			StatusCode: resp.StatusCode,
		}
		switch resp.StatusCode {
		case 400:
			return &ValidationError{TurboDocxError: baseErr}
		case 401:
			return &AuthenticationError{TurboDocxError: baseErr}
		case 404:
			return &NotFoundError{TurboDocxError: baseErr}
		case 429:
			return &RateLimitError{TurboDocxError: baseErr}
		default:
			return &baseErr
		}
	}

	if result != nil {
		// Smart unwrapping: if response has ONLY "data" key, extract it
		// This handles backend responses that wrap data in { "data": { ... } }
		var wrapper map[string]json.RawMessage
		if err := json.Unmarshal(body, &wrapper); err == nil {
			// If only "data" key exists, unwrap it
			if data, ok := wrapper["data"]; ok && len(wrapper) == 1 {
				if err := json.Unmarshal(data, result); err != nil {
					return fmt.Errorf("failed to decode unwrapped response: %w", err)
				}
				return nil
			}
		}

		// Otherwise unmarshal directly
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
		return &NetworkError{TurboDocxError: TurboDocxError{
			Message: fmt.Sprintf("failed to create request: %v", err),
		}}
	}

	c.setHeaders(req, "application/json")

	resp, err := c.client.Do(req)
	if err != nil {
		return &NetworkError{TurboDocxError: TurboDocxError{
			Message: fmt.Sprintf("request failed: %v", err),
		}}
	}

	return c.handleResponse(resp, result)
}

// GetRaw performs a GET request and returns raw bytes (for file downloads)
func (c *HTTPClient) GetRaw(ctx context.Context, path string) ([]byte, error) {
	req, err := http.NewRequestWithContext(ctx, "GET", c.baseURL+path, nil)
	if err != nil {
		return nil, &NetworkError{TurboDocxError: TurboDocxError{
			Message: fmt.Sprintf("failed to create request: %v", err),
		}}
	}

	c.setHeaders(req, "")

	resp, err := c.client.Do(req)
	if err != nil {
		return nil, &NetworkError{TurboDocxError: TurboDocxError{
			Message: fmt.Sprintf("request failed: %v", err),
		}}
	}
	defer resp.Body.Close()

	if resp.StatusCode >= 400 {
		baseErr := TurboDocxError{
			Message:    resp.Status,
			StatusCode: resp.StatusCode,
		}
		switch resp.StatusCode {
		case 400:
			return nil, &ValidationError{TurboDocxError: baseErr}
		case 401:
			return nil, &AuthenticationError{TurboDocxError: baseErr}
		case 404:
			return nil, &NotFoundError{TurboDocxError: baseErr}
		case 429:
			return nil, &RateLimitError{TurboDocxError: baseErr}
		default:
			return nil, &baseErr
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
		return &NetworkError{TurboDocxError: TurboDocxError{
			Message: fmt.Sprintf("failed to create request: %v", err),
		}}
	}

	c.setHeaders(req, "application/json")

	resp, err := c.client.Do(req)
	if err != nil {
		return &NetworkError{TurboDocxError: TurboDocxError{
			Message: fmt.Sprintf("request failed: %v", err),
		}}
	}

	return c.handleResponse(resp, result)
}

// UploadFile performs a multipart file upload
// file can be either a file path (string) or file content ([]byte)
func (c *HTTPClient) UploadFile(ctx context.Context, path string, file interface{}, fileName string, additionalData map[string]string, result interface{}) error {
	var fileBytes []byte
	var err error

	// Handle file path vs bytes
	switch f := file.(type) {
	case string:
		// File path - read from disk
		fileBytes, err = os.ReadFile(f)
		if err != nil {
			return fmt.Errorf("failed to read file: %w", err)
		}
		if fileName == "" {
			fileName = filepath.Base(f)
		}
	case []byte:
		// Bytes - use directly
		fileBytes = f
		if fileName == "" {
			// Detect extension from content
			detected := DetectFileType(fileBytes)
			fileName = "document." + detected.Extension
		}
	default:
		return fmt.Errorf("file must be a file path (string) or file content ([]byte)")
	}

	// Detect MIME type from file content
	detected := DetectFileType(fileBytes)
	mimeType := detected.MimeType

	var buf bytes.Buffer
	writer := multipart.NewWriter(&buf)

	// Create form file part with correct MIME type
	// Using CreatePart instead of CreateFormFile to set proper Content-Type
	h := make(textproto.MIMEHeader)
	h.Set("Content-Disposition", fmt.Sprintf(`form-data; name="file"; filename="%s"`, fileName))
	h.Set("Content-Type", mimeType)

	part, err := writer.CreatePart(h)
	if err != nil {
		return fmt.Errorf("failed to create form file: %w", err)
	}
	if _, err := part.Write(fileBytes); err != nil {
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
		return &NetworkError{TurboDocxError: TurboDocxError{
			Message: fmt.Sprintf("failed to create request: %v", err),
		}}
	}

	c.setHeaders(req, "")
	req.Header.Set("Content-Type", writer.FormDataContentType())

	resp, err := c.client.Do(req)
	if err != nil {
		return &NetworkError{TurboDocxError: TurboDocxError{
			Message: fmt.Sprintf("request failed: %v", err),
		}}
	}

	return c.handleResponse(resp, result)
}

// UploadFileBytes is a convenience method for uploading file bytes
func (c *HTTPClient) UploadFileBytes(ctx context.Context, path string, fileBytes []byte, fileName string, additionalData map[string]string, result interface{}) error {
	return c.UploadFile(ctx, path, fileBytes, fileName, additionalData, result)
}

// UploadFilePath is a convenience method for uploading a file from disk
func (c *HTTPClient) UploadFilePath(ctx context.Context, path string, filePath string, additionalData map[string]string, result interface{}) error {
	return c.UploadFile(ctx, path, filePath, "", additionalData, result)
}
