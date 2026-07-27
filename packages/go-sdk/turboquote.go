package turbodocx

import (
	"context"
	"encoding/json"
	"fmt"
	"net/url"
	"os"
	"strconv"
)

// QuoteClient provides TurboQuote quoting operations
type QuoteClient struct {
	http *HTTPClient
}

// NewQuoteClient creates a new TurboQuote client with the given config
func NewQuoteClient(config QuoteClientConfig) (*QuoteClient, error) {
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
			Message:    "API key or access token is required. Set APIKey in config or TURBODOCX_API_KEY environment variable.",
			StatusCode: 401,
		}}
	}
	if config.OrgID == "" {
		return nil, &AuthenticationError{TurboDocxError: TurboDocxError{
			Message:    "Organization ID is required. Set OrgID in config or TURBODOCX_ORG_ID environment variable.",
			StatusCode: 401,
		}}
	}

	httpClient := NewHTTPClient(ClientConfig{
		APIKey:      config.APIKey,
		AccessToken: config.AccessToken,
		OrgID:       config.OrgID,
		BaseURL:     config.BaseURL,
	})

	return &QuoteClient{http: httpClient}, nil
}

// --- Query param helpers ---

// quoteQueryParams converts an options struct to URL query params.
// It uses JSON tags to determine field names.
func quoteQueryParams(opts interface{}) string {
	if opts == nil {
		return ""
	}

	// Marshal to JSON then unmarshal to a generic map to respect json tags
	data, err := json.Marshal(opts)
	if err != nil {
		return ""
	}

	var m map[string]interface{}
	if err := json.Unmarshal(data, &m); err != nil {
		return ""
	}

	q := url.Values{}
	for key, value := range m {
		switch v := value.(type) {
		case []interface{}:
			for _, item := range v {
				q.Add(key, fmt.Sprintf("%v", item))
			}
		case bool:
			q.Set(key, strconv.FormatBool(v))
		case float64:
			if v == float64(int(v)) {
				q.Set(key, strconv.Itoa(int(v)))
			} else {
				q.Set(key, strconv.FormatFloat(v, 'f', -1, 64))
			}
		case string:
			q.Set(key, v)
		default:
			q.Set(key, fmt.Sprintf("%v", v))
		}
	}

	encoded := q.Encode()
	if encoded == "" {
		return ""
	}
	return "?" + encoded
}

// --- Bulk import helper ---

// bulkImport POSTs { "rows": [...] } to the given /bulk path and unwraps the
// { results: { imported, failed, adjusted } } envelope. Rows are sent verbatim;
// per-row validation happens server-side with partial success.
func (c *QuoteClient) bulkImport(ctx context.Context, path string, rows interface{}) (*BulkImportResult, error) {
	var resp struct {
		Results BulkImportResult `json:"results"`
	}
	body := map[string]interface{}{"rows": rows}
	if err := c.http.Post(ctx, path, body, &resp); err != nil {
		return nil, err
	}
	return &resp.Results, nil
}

// ============================================
// QUOTES -- CRUD
// ============================================

// ListQuotes retrieves a paginated list of quotes
func (c *QuoteClient) ListQuotes(ctx context.Context, options *ListQuotesOptions) (*QuoteListResponse, error) {
	var result QuoteListResponse
	qs := quoteQueryParams(options)
	if err := c.http.Get(ctx, "/v1/quotes"+qs, &result); err != nil {
		return nil, err
	}
	return &result, nil
}

// CreateQuote creates a new quote
func (c *QuoteClient) CreateQuote(ctx context.Context, request *CreateQuoteRequest) (*Quote, error) {
	var resp struct {
		Result Quote `json:"result"`
	}
	if err := c.http.Post(ctx, "/v1/quotes", request, &resp); err != nil {
		return nil, err
	}
	return &resp.Result, nil
}

// GetQuote retrieves a quote by ID, including statusInfo when available
func (c *QuoteClient) GetQuote(ctx context.Context, id string) (*Quote, error) {
	var resp struct {
		Result     Quote            `json:"result"`
		StatusInfo *QuoteStatusInfo `json:"statusInfo,omitempty"`
		PreparedBy *QuotePreparedBy `json:"preparedBy,omitempty"`
	}
	if err := c.http.Get(ctx, "/v1/quotes/"+id, &resp); err != nil {
		return nil, err
	}
	quote := resp.Result
	if resp.StatusInfo != nil {
		quote.StatusInfo = resp.StatusInfo
	}
	// preparedBy is a sibling of "result" — the resolved "Prepared by" identity. Fold it onto
	// the quote (same pattern as StatusInfo); prefer it over Creator for display.
	if resp.PreparedBy != nil {
		quote.PreparedBy = resp.PreparedBy
	}
	return &quote, nil
}

// UpdateQuote updates an existing quote
func (c *QuoteClient) UpdateQuote(ctx context.Context, id string, request *UpdateQuoteRequest) (*Quote, error) {
	var resp struct {
		Result Quote `json:"result"`
	}
	if err := c.http.Patch(ctx, "/v1/quotes/"+id, request, &resp); err != nil {
		return nil, err
	}
	return &resp.Result, nil
}

// DeleteQuote deletes a quote by ID
func (c *QuoteClient) DeleteQuote(ctx context.Context, id string) (*QuoteSuccessResponse, error) {
	var result QuoteSuccessResponse
	if err := c.http.Delete(ctx, "/v1/quotes/"+id, &result); err != nil {
		return nil, err
	}
	return &result, nil
}

// DuplicateQuote duplicates a quote
func (c *QuoteClient) DuplicateQuote(ctx context.Context, id string) (*Quote, error) {
	var resp struct {
		Result Quote `json:"result"`
	}
	if err := c.http.Post(ctx, "/v1/quotes/"+id+"/duplicate", nil, &resp); err != nil {
		return nil, err
	}
	return &resp.Result, nil
}

// ApplyPriceBook applies a price book to a quote
func (c *QuoteClient) ApplyPriceBook(ctx context.Context, quoteID string, priceBookID string) (*ApplyPriceBookResponse, error) {
	// API returns { result, message, updatedCount, skippedCount }
	// but our public type uses json:"quote" for the quote field.
	// Use an intermediate struct matching the actual API shape.
	var resp struct {
		Result       Quote  `json:"result"`
		Message      string `json:"message"`
		UpdatedCount int    `json:"updatedCount"`
		SkippedCount int    `json:"skippedCount"`
	}
	body := map[string]string{"priceBookId": priceBookID}
	if err := c.http.Post(ctx, "/v1/quotes/"+quoteID+"/apply-pricebook", body, &resp); err != nil {
		return nil, err
	}
	return &ApplyPriceBookResponse{
		QuoteResult:  resp.Result,
		Message:      resp.Message,
		UpdatedCount: resp.UpdatedCount,
		SkippedCount: resp.SkippedCount,
	}, nil
}

// RemovePriceBook removes a price book from a quote
func (c *QuoteClient) RemovePriceBook(ctx context.Context, quoteID string) (*Quote, error) {
	var resp struct {
		Result Quote `json:"result"`
	}
	if err := c.http.Post(ctx, "/v1/quotes/"+quoteID+"/remove-pricebook", nil, &resp); err != nil {
		return nil, err
	}
	return &resp.Result, nil
}

// DownloadQuotePdf downloads the PDF for a quote
func (c *QuoteClient) DownloadQuotePdf(ctx context.Context, id string) ([]byte, error) {
	return c.http.GetRaw(ctx, "/v1/quotes/"+id+"/pdf")
}

// ============================================
// QUOTES -- STATUS TRANSITIONS
// ============================================

// SendQuote sends a quote for approval
func (c *QuoteClient) SendQuote(ctx context.Context, id string, request *SendQuoteRequest) (*SendQuoteResponse, error) {
	// API returns { result, message } but our public type uses json:"quote".
	var resp struct {
		Result  Quote  `json:"result"`
		Message string `json:"message"`
	}
	if err := c.http.Post(ctx, "/v1/quotes/"+id+"/send", request, &resp); err != nil {
		return nil, err
	}
	return &SendQuoteResponse{
		QuoteResult: resp.Result,
		Message:     resp.Message,
	}, nil
}

// SendQuoteWithDeliverable sends a quote with a deliverable attachment
func (c *QuoteClient) SendQuoteWithDeliverable(ctx context.Context, id string, request *SendQuoteWithDeliverableRequest) (*SendQuoteWithDeliverableResponse, error) {
	var resp struct {
		Result     Quote  `json:"result"`
		Message    string `json:"message"`
		DocumentID string `json:"documentId"`
	}
	if err := c.http.Post(ctx, "/v1/quotes/"+id+"/send-with-deliverable", request, &resp); err != nil {
		return nil, err
	}
	return &SendQuoteWithDeliverableResponse{
		QuoteResult: resp.Result,
		Message:     resp.Message,
		DocumentID:  resp.DocumentID,
	}, nil
}

// DeclineQuote declines a quote
func (c *QuoteClient) DeclineQuote(ctx context.Context, id string, request *DeclineQuoteRequest) (*Quote, error) {
	var resp struct {
		Result Quote `json:"result"`
	}
	if err := c.http.Post(ctx, "/v1/quotes/"+id+"/decline", request, &resp); err != nil {
		return nil, err
	}
	return &resp.Result, nil
}

// VoidQuote voids a quote
func (c *QuoteClient) VoidQuote(ctx context.Context, id string, request *VoidQuoteRequest) (*Quote, error) {
	var resp struct {
		Result Quote `json:"result"`
	}
	if err := c.http.Post(ctx, "/v1/quotes/"+id+"/void", request, &resp); err != nil {
		return nil, err
	}
	return &resp.Result, nil
}

// HandleExpiredQuote resolves an expired sent quote: it voids or declines the
// original and returns a duplicate carrying the new validUntil date.
//
// Action must be "void" or "decline"; Reason and NewValidUntil are both required.
func (c *QuoteClient) HandleExpiredQuote(ctx context.Context, id string, request *HandleExpiredQuoteRequest) (*Quote, error) {
	var resp struct {
		Result Quote `json:"result"`
	}
	if err := c.http.Post(ctx, "/v1/quotes/"+id+"/handle-expired-sent", request, &resp); err != nil {
		return nil, err
	}
	return &resp.Result, nil
}

// ============================================
// LINE ITEMS
// ============================================

// ListLineItems retrieves line items for a quote
func (c *QuoteClient) ListLineItems(ctx context.Context, quoteID string, options *ListLineItemsOptions) (*LineItemListResponse, error) {
	var result LineItemListResponse
	qs := quoteQueryParams(options)
	if err := c.http.Get(ctx, "/v1/quotes/"+quoteID+"/items"+qs, &result); err != nil {
		return nil, err
	}
	return &result, nil
}

// AddLineItems adds one or more product line items to a quote.
// Accepts a single item or a slice of items.
func (c *QuoteClient) AddLineItems(ctx context.Context, quoteID string, items ...AddLineItemRequest) ([]LineItem, error) {
	var resp struct {
		Results []LineItem `json:"results"`
	}
	if err := c.http.Post(ctx, "/v1/quotes/"+quoteID+"/items", items, &resp); err != nil {
		return nil, err
	}
	return resp.Results, nil
}

// AddBundleLineItems adds one or more bundle line items to a quote
func (c *QuoteClient) AddBundleLineItems(ctx context.Context, quoteID string, items ...AddBundleLineItemRequest) ([]LineItem, error) {
	var resp struct {
		Results []LineItem `json:"results"`
	}
	if err := c.http.Post(ctx, "/v1/quotes/"+quoteID+"/items/bundle", items, &resp); err != nil {
		return nil, err
	}
	return resp.Results, nil
}

// UpdateLineItem updates a line item on a quote
func (c *QuoteClient) UpdateLineItem(ctx context.Context, quoteID string, itemID string, request *UpdateLineItemRequest) (*LineItem, error) {
	var resp struct {
		Result LineItem `json:"result"`
	}
	if err := c.http.Patch(ctx, "/v1/quotes/"+quoteID+"/items/"+itemID, request, &resp); err != nil {
		return nil, err
	}
	return &resp.Result, nil
}

// RemoveLineItem removes a line item from a quote
func (c *QuoteClient) RemoveLineItem(ctx context.Context, quoteID string, itemID string) (*QuoteSuccessResponse, error) {
	var result QuoteSuccessResponse
	if err := c.http.Delete(ctx, "/v1/quotes/"+quoteID+"/items/"+itemID, &result); err != nil {
		return nil, err
	}
	return &result, nil
}

// ============================================
// PRODUCTS
// ============================================

// ListProducts retrieves a paginated list of products
func (c *QuoteClient) ListProducts(ctx context.Context, options *ListProductsOptions) (*ProductListResponse, error) {
	var result ProductListResponse
	qs := quoteQueryParams(options)
	if err := c.http.Get(ctx, "/v1/products"+qs, &result); err != nil {
		return nil, err
	}
	return &result, nil
}

// CreateProduct creates a new product. If images are provided, uses multipart upload.
func (c *QuoteClient) CreateProduct(ctx context.Context, request *CreateProductRequest) (*Product, error) {
	var resp struct {
		Result Product `json:"result"`
	}

	if len(request.Images) > 0 {
		dataJSON, err := json.Marshal(request)
		if err != nil {
			return nil, fmt.Errorf("failed to marshal product data: %w", err)
		}
		images, err := resolveProductImages(request.Images)
		if err != nil {
			return nil, err
		}
		if err := c.http.PostProductMultipart(ctx, "/v1/products", dataJSON, images, &resp); err != nil {
			return nil, err
		}
	} else {
		if err := c.http.Post(ctx, "/v1/products", request, &resp); err != nil {
			return nil, err
		}
	}

	return &resp.Result, nil
}

// BulkCreateProducts imports multiple products in one call with partial
// success: failed rows are reported in the result, not returned as an error.
func (c *QuoteClient) BulkCreateProducts(ctx context.Context, rows []CreateProductRequest) (*BulkImportResult, error) {
	return c.bulkImport(ctx, "/v1/products/bulk", rows)
}

// GetProduct retrieves a product by ID
func (c *QuoteClient) GetProduct(ctx context.Context, id string) (*Product, error) {
	var resp struct {
		Result Product `json:"result"`
	}
	if err := c.http.Get(ctx, "/v1/products/"+id, &resp); err != nil {
		return nil, err
	}
	return &resp.Result, nil
}

// UpdateProduct updates an existing product. If images are provided, uses multipart upload.
func (c *QuoteClient) UpdateProduct(ctx context.Context, id string, request *UpdateProductRequest) (*Product, error) {
	var resp struct {
		Result Product `json:"result"`
	}

	if len(request.Images) > 0 {
		dataJSON, err := json.Marshal(request)
		if err != nil {
			return nil, fmt.Errorf("failed to marshal product data: %w", err)
		}
		images, err := resolveProductImages(request.Images)
		if err != nil {
			return nil, err
		}
		if err := c.http.PatchProductMultipart(ctx, "/v1/products/"+id, dataJSON, images, &resp); err != nil {
			return nil, err
		}
	} else {
		if err := c.http.Patch(ctx, "/v1/products/"+id, request, &resp); err != nil {
			return nil, err
		}
	}

	return &resp.Result, nil
}

// DeleteProduct deletes a product by ID
func (c *QuoteClient) DeleteProduct(ctx context.Context, id string) (*QuoteSuccessResponse, error) {
	var result QuoteSuccessResponse
	if err := c.http.Delete(ctx, "/v1/products/"+id, &result); err != nil {
		return nil, err
	}
	return &result, nil
}

// DuplicateProduct duplicates a product
func (c *QuoteClient) DuplicateProduct(ctx context.Context, id string) (*Product, error) {
	var resp struct {
		Result Product `json:"result"`
	}
	if err := c.http.Post(ctx, "/v1/products/"+id+"/duplicate", nil, &resp); err != nil {
		return nil, err
	}
	return &resp.Result, nil
}

// GetProductPrimaryImages retrieves primary images for the given product IDs
func (c *QuoteClient) GetProductPrimaryImages(ctx context.Context, productIDs []string) (ProductPrimaryImagesResponse, error) {
	var resp struct {
		Results ProductPrimaryImagesResponse `json:"results"`
	}
	body := map[string][]string{"productIds": productIDs}
	if err := c.http.Post(ctx, "/v1/products/primary-images", body, &resp); err != nil {
		return nil, err
	}
	return resp.Results, nil
}

// resolveProductImages converts ProductImageInput entries to ProductImageFile entries
func resolveProductImages(inputs []ProductImageInput) ([]ProductImageFile, error) {
	var images []ProductImageFile
	for _, img := range inputs {
		if img.FilePath != "" {
			data, err := os.ReadFile(img.FilePath)
			if err != nil {
				return nil, fmt.Errorf("failed to read image file %s: %w", img.FilePath, err)
			}
			fileName := img.FileName
			if fileName == "" {
				// Extract basename from path
				for i := len(img.FilePath) - 1; i >= 0; i-- {
					if img.FilePath[i] == '/' || img.FilePath[i] == '\\' {
						fileName = img.FilePath[i+1:]
						break
					}
				}
				if fileName == "" {
					fileName = img.FilePath
				}
			}
			images = append(images, ProductImageFile{Data: data, FileName: fileName})
		} else if img.Data != nil {
			fileName := img.FileName
			if fileName == "" {
				fileName = "image.jpg"
			}
			images = append(images, ProductImageFile{Data: img.Data, FileName: fileName})
		}
	}
	return images, nil
}

// ============================================
// PRICE BOOKS
// ============================================

// ListPriceBooks retrieves a paginated list of price books
func (c *QuoteClient) ListPriceBooks(ctx context.Context, options *ListPriceBooksOptions) (*PriceBookListResponse, error) {
	var result PriceBookListResponse
	qs := quoteQueryParams(options)
	if err := c.http.Get(ctx, "/v1/pricebooks"+qs, &result); err != nil {
		return nil, err
	}
	return &result, nil
}

// CreatePriceBook creates a new price book
func (c *QuoteClient) CreatePriceBook(ctx context.Context, request *CreatePriceBookRequest) (*PriceBook, error) {
	var resp struct {
		Result PriceBook `json:"result"`
	}
	// Backend requires discountPercent on POST; fill its documented default of 0
	// when the caller omits it. Copy the request to avoid mutating the caller's struct.
	body := *request
	if body.DiscountPercent == nil {
		zero := 0.0
		body.DiscountPercent = &zero
	}
	if err := c.http.Post(ctx, "/v1/pricebooks", &body, &resp); err != nil {
		return nil, err
	}
	return &resp.Result, nil
}

// BulkCreatePriceBooks imports multiple price books in one call with partial
// success: failed rows are reported in the result, not returned as an error.
func (c *QuoteClient) BulkCreatePriceBooks(ctx context.Context, rows []CreatePriceBookRequest) (*BulkImportResult, error) {
	return c.bulkImport(ctx, "/v1/pricebooks/bulk", rows)
}

// GetPriceBook retrieves a price book by ID
func (c *QuoteClient) GetPriceBook(ctx context.Context, id string) (*PriceBook, error) {
	var resp struct {
		Result PriceBook `json:"result"`
	}
	if err := c.http.Get(ctx, "/v1/pricebooks/"+id, &resp); err != nil {
		return nil, err
	}
	return &resp.Result, nil
}

// UpdatePriceBook updates an existing price book
func (c *QuoteClient) UpdatePriceBook(ctx context.Context, id string, request *UpdatePriceBookRequest) (*PriceBook, error) {
	var resp struct {
		Result PriceBook `json:"result"`
	}
	if err := c.http.Patch(ctx, "/v1/pricebooks/"+id, request, &resp); err != nil {
		return nil, err
	}
	return &resp.Result, nil
}

// DeletePriceBook deletes a price book by ID
func (c *QuoteClient) DeletePriceBook(ctx context.Context, id string) (*QuoteSuccessResponse, error) {
	var result QuoteSuccessResponse
	if err := c.http.Delete(ctx, "/v1/pricebooks/"+id, &result); err != nil {
		return nil, err
	}
	return &result, nil
}

// DuplicatePriceBook duplicates a price book
func (c *QuoteClient) DuplicatePriceBook(ctx context.Context, id string) (*PriceBook, error) {
	var resp struct {
		Result PriceBook `json:"result"`
	}
	if err := c.http.Post(ctx, "/v1/pricebooks/"+id+"/duplicate", nil, &resp); err != nil {
		return nil, err
	}
	return &resp.Result, nil
}

// ListPriceBookProducts retrieves products associated with a price book
func (c *QuoteClient) ListPriceBookProducts(ctx context.Context, id string, options *ListPriceBookProductsOptions) (*PriceBookProductListResponse, error) {
	var result PriceBookProductListResponse
	qs := quoteQueryParams(options)
	if err := c.http.Get(ctx, "/v1/pricebooks/"+id+"/products"+qs, &result); err != nil {
		return nil, err
	}
	return &result, nil
}

// ============================================
// BUNDLES
// ============================================

// ListBundles retrieves a paginated list of bundles
func (c *QuoteClient) ListBundles(ctx context.Context, options *ListBundlesOptions) (*BundleListResponse, error) {
	var result BundleListResponse
	qs := quoteQueryParams(options)
	if err := c.http.Get(ctx, "/v1/bundles"+qs, &result); err != nil {
		return nil, err
	}
	return &result, nil
}

// CreateBundle creates a new bundle
func (c *QuoteClient) CreateBundle(ctx context.Context, request *CreateBundleRequest) (*Bundle, error) {
	var resp struct {
		Result Bundle `json:"result"`
	}
	if err := c.http.Post(ctx, "/v1/bundles", request, &resp); err != nil {
		return nil, err
	}
	return &resp.Result, nil
}

// BulkCreateBundles imports multiple bundles in one call with partial
// success: failed rows are reported in the result, not returned as an error.
// A bundle item whose product isn't found is dropped and reported as adjusted.
func (c *QuoteClient) BulkCreateBundles(ctx context.Context, rows []CreateBundleRequest) (*BulkImportResult, error) {
	return c.bulkImport(ctx, "/v1/bundles/bulk", rows)
}

// GetBundle retrieves a bundle by ID
func (c *QuoteClient) GetBundle(ctx context.Context, id string) (*Bundle, error) {
	var resp struct {
		Result Bundle `json:"result"`
	}
	if err := c.http.Get(ctx, "/v1/bundles/"+id, &resp); err != nil {
		return nil, err
	}
	return &resp.Result, nil
}

// UpdateBundle updates an existing bundle
func (c *QuoteClient) UpdateBundle(ctx context.Context, id string, request *UpdateBundleRequest) (*Bundle, error) {
	var resp struct {
		Result Bundle `json:"result"`
	}
	if err := c.http.Patch(ctx, "/v1/bundles/"+id, request, &resp); err != nil {
		return nil, err
	}
	return &resp.Result, nil
}

// DeleteBundle deletes a bundle by ID
func (c *QuoteClient) DeleteBundle(ctx context.Context, id string) (*QuoteSuccessResponse, error) {
	var result QuoteSuccessResponse
	if err := c.http.Delete(ctx, "/v1/bundles/"+id, &result); err != nil {
		return nil, err
	}
	return &result, nil
}

// DuplicateBundle duplicates a bundle
func (c *QuoteClient) DuplicateBundle(ctx context.Context, id string) (*Bundle, error) {
	var resp struct {
		Result Bundle `json:"result"`
	}
	if err := c.http.Post(ctx, "/v1/bundles/"+id+"/duplicate", nil, &resp); err != nil {
		return nil, err
	}
	return &resp.Result, nil
}

// ============================================
// COMPANIES
// ============================================

// ListCompanies retrieves a paginated list of companies
func (c *QuoteClient) ListCompanies(ctx context.Context, options *ListCompaniesOptions) (*CompanyListResponse, error) {
	var result CompanyListResponse
	qs := quoteQueryParams(options)
	if err := c.http.Get(ctx, "/v1/companies"+qs, &result); err != nil {
		return nil, err
	}
	return &result, nil
}

// CreateCompany creates a new company
func (c *QuoteClient) CreateCompany(ctx context.Context, request *CreateCompanyRequest) (*Company, error) {
	var resp struct {
		Result Company `json:"result"`
	}
	if err := c.http.Post(ctx, "/v1/companies", request, &resp); err != nil {
		return nil, err
	}
	return &resp.Result, nil
}

// BulkCreateCompanies imports multiple companies in one call with partial
// success: failed rows are reported in the result, not returned as an error.
// Each row requires a Contacts slice with at least one contact.
func (c *QuoteClient) BulkCreateCompanies(ctx context.Context, rows []CreateCompanyRequest) (*BulkImportResult, error) {
	return c.bulkImport(ctx, "/v1/companies/bulk", rows)
}

// GetCompany retrieves a company by ID
func (c *QuoteClient) GetCompany(ctx context.Context, id string) (*Company, error) {
	var resp struct {
		Result Company `json:"result"`
	}
	if err := c.http.Get(ctx, "/v1/companies/"+id, &resp); err != nil {
		return nil, err
	}
	return &resp.Result, nil
}

// UpdateCompany updates an existing company
func (c *QuoteClient) UpdateCompany(ctx context.Context, id string, request *UpdateCompanyRequest) (*Company, error) {
	var resp struct {
		Result Company `json:"result"`
	}
	if err := c.http.Patch(ctx, "/v1/companies/"+id, request, &resp); err != nil {
		return nil, err
	}
	return &resp.Result, nil
}

// DeleteCompany deletes a company by ID
func (c *QuoteClient) DeleteCompany(ctx context.Context, id string) (*QuoteSuccessResponse, error) {
	var result QuoteSuccessResponse
	if err := c.http.Delete(ctx, "/v1/companies/"+id, &result); err != nil {
		return nil, err
	}
	return &result, nil
}

// ListCompanyContacts retrieves contacts for a specific company
func (c *QuoteClient) ListCompanyContacts(ctx context.Context, companyID string, options *PaginationParams) (*ContactListResponse, error) {
	var result ContactListResponse
	qs := quoteQueryParams(options)
	if err := c.http.Get(ctx, "/v1/companies/"+companyID+"/contacts"+qs, &result); err != nil {
		return nil, err
	}
	return &result, nil
}

// ============================================
// CONTACTS
// ============================================

// ListContacts retrieves a paginated list of contacts
func (c *QuoteClient) ListContacts(ctx context.Context, options *ListContactsOptions) (*ContactListResponse, error) {
	var result ContactListResponse
	qs := quoteQueryParams(options)
	if err := c.http.Get(ctx, "/v1/contacts"+qs, &result); err != nil {
		return nil, err
	}
	return &result, nil
}

// CreateContact creates a new contact
func (c *QuoteClient) CreateContact(ctx context.Context, request *CreateContactRequest) (*Contact, error) {
	var resp struct {
		Result Contact `json:"result"`
	}
	if err := c.http.Post(ctx, "/v1/contacts", request, &resp); err != nil {
		return nil, err
	}
	return &resp.Result, nil
}

// BulkCreateContacts imports multiple contacts in one call with partial
// success: failed rows are reported in the result, not returned as an error.
// Each row requires a CompanyID.
func (c *QuoteClient) BulkCreateContacts(ctx context.Context, rows []CreateContactRequest) (*BulkImportResult, error) {
	return c.bulkImport(ctx, "/v1/contacts/bulk", rows)
}

// UpdateContact updates an existing contact
func (c *QuoteClient) UpdateContact(ctx context.Context, id string, request *UpdateContactRequest) (*Contact, error) {
	var resp struct {
		Result Contact `json:"result"`
	}
	if err := c.http.Patch(ctx, "/v1/contacts/"+id, request, &resp); err != nil {
		return nil, err
	}
	return &resp.Result, nil
}

// DeleteContact deletes a contact by ID
func (c *QuoteClient) DeleteContact(ctx context.Context, id string) (*QuoteSuccessResponse, error) {
	var result QuoteSuccessResponse
	if err := c.http.Delete(ctx, "/v1/contacts/"+id, &result); err != nil {
		return nil, err
	}
	return &result, nil
}

// ============================================
// TEMPLATES
// ============================================

// ListTemplates retrieves a paginated list of quote templates
func (c *QuoteClient) ListTemplates(ctx context.Context, options *PaginationParams) (*QuoteTemplateListResponse, error) {
	var result QuoteTemplateListResponse
	qs := quoteQueryParams(options)
	if err := c.http.Get(ctx, "/v1/quote-templates"+qs, &result); err != nil {
		return nil, err
	}
	return &result, nil
}

// GetTemplate retrieves the default (active) quote template
func (c *QuoteClient) GetTemplate(ctx context.Context) (*QuoteTemplate, error) {
	var resp struct {
		Result QuoteTemplate `json:"result"`
	}
	if err := c.http.Get(ctx, "/v1/quote-template", &resp); err != nil {
		return nil, err
	}
	return &resp.Result, nil
}

// GetTemplateByID retrieves a specific quote template by ID
func (c *QuoteClient) GetTemplateByID(ctx context.Context, id string) (*QuoteTemplate, error) {
	var resp struct {
		Result QuoteTemplate `json:"result"`
	}
	if err := c.http.Get(ctx, "/v1/quote-templates/"+id, &resp); err != nil {
		return nil, err
	}
	return &resp.Result, nil
}

// CreateTemplate creates a new quote template
func (c *QuoteClient) CreateTemplate(ctx context.Context, request *CreateQuoteTemplateRequest) (*QuoteTemplate, error) {
	var resp struct {
		Result QuoteTemplate `json:"result"`
	}
	if err := c.http.Post(ctx, "/v1/quote-templates", request, &resp); err != nil {
		return nil, err
	}
	return &resp.Result, nil
}

// UpdateTemplate updates an existing quote template
func (c *QuoteClient) UpdateTemplate(ctx context.Context, id string, request *UpdateQuoteTemplateRequest) (*QuoteTemplate, error) {
	var resp struct {
		Result QuoteTemplate `json:"result"`
	}
	if err := c.http.Patch(ctx, "/v1/quote-templates/"+id, request, &resp); err != nil {
		return nil, err
	}
	return &resp.Result, nil
}

// DeleteTemplate deletes a quote template by ID
func (c *QuoteClient) DeleteTemplate(ctx context.Context, id string) (*QuoteSuccessResponse, error) {
	var result QuoteSuccessResponse
	if err := c.http.Delete(ctx, "/v1/quote-templates/"+id, &result); err != nil {
		return nil, err
	}
	return &result, nil
}

// ============================================
// TYPES / CATEGORIES
// ============================================

// ListTypes retrieves a paginated list of quote types/categories
func (c *QuoteClient) ListTypes(ctx context.Context, options *ListTypesOptions) (*QuoteTypeListResponse, error) {
	var result QuoteTypeListResponse
	qs := quoteQueryParams(options)
	if err := c.http.Get(ctx, "/v1/types"+qs, &result); err != nil {
		return nil, err
	}
	return &result, nil
}

// CreateType creates a new quote type/category
func (c *QuoteClient) CreateType(ctx context.Context, request *CreateQuoteTypeRequest) (*QuoteType, error) {
	var resp struct {
		Result QuoteType `json:"result"`
	}
	if err := c.http.Post(ctx, "/v1/types", request, &resp); err != nil {
		return nil, err
	}
	return &resp.Result, nil
}

// BulkCreateTypes imports multiple quote types/categories in one call with
// partial success: failed rows are reported in the result, not returned as an error.
func (c *QuoteClient) BulkCreateTypes(ctx context.Context, rows []CreateQuoteTypeRequest) (*BulkImportResult, error) {
	return c.bulkImport(ctx, "/v1/types/bulk", rows)
}

// UpdateType updates an existing quote type/category
func (c *QuoteClient) UpdateType(ctx context.Context, id string, request *UpdateQuoteTypeRequest) (*QuoteType, error) {
	var resp struct {
		Result QuoteType `json:"result"`
	}
	if err := c.http.Patch(ctx, "/v1/types/"+id, request, &resp); err != nil {
		return nil, err
	}
	return &resp.Result, nil
}

// DeleteType deletes a quote type/category by ID
func (c *QuoteClient) DeleteType(ctx context.Context, id string) (*QuoteSuccessResponse, error) {
	var result QuoteSuccessResponse
	if err := c.http.Delete(ctx, "/v1/types/"+id, &result); err != nil {
		return nil, err
	}
	return &result, nil
}

// ============================================
// CONVENIENCE
// ============================================

// CreateAndSend creates a quote, adds line items, and sends it in one call.
// This is a convenience method that performs 2-4 sequential API calls.
func (c *QuoteClient) CreateAndSend(ctx context.Context, request *CreateAndSendRequest) (*CreateAndSendResponse, error) {
	// Step 1: Create the quote (only the quote fields, not items/send)
	var createResp struct {
		Result Quote `json:"result"`
	}
	if err := c.http.Post(ctx, "/v1/quotes", request, &createResp); err != nil {
		return nil, err
	}
	quoteID := createResp.Result.ID

	// Step 2: Add line items if provided
	if len(request.Items) > 0 {
		var itemsResp struct {
			Results []LineItem `json:"results"`
		}
		if err := c.http.Post(ctx, "/v1/quotes/"+quoteID+"/items", request.Items, &itemsResp); err != nil {
			return nil, err
		}
	}

	// Step 3: Add bundle items if provided
	if len(request.BundleItems) > 0 {
		var bundleResp struct {
			Results []LineItem `json:"results"`
		}
		if err := c.http.Post(ctx, "/v1/quotes/"+quoteID+"/items/bundle", request.BundleItems, &bundleResp); err != nil {
			return nil, err
		}
	}

	// Step 4: Send the quote
	var sendResp struct {
		Result  Quote  `json:"result"`
		Message string `json:"message"`
	}
	if err := c.http.Post(ctx, "/v1/quotes/"+quoteID+"/send", request.Send, &sendResp); err != nil {
		return nil, err
	}

	return &CreateAndSendResponse{
		Quote: sendResp.Result,
	}, nil
}

// ============================================
// QUOTE NUMBER CONFIG (admin only)
// ============================================

// GetQuoteNumberConfig retrieves the per-org quote numbering configuration
// (format + currentFloor). Requires an administrator API key.
func (c *QuoteClient) GetQuoteNumberConfig(ctx context.Context) (*QuoteNumberConfig, error) {
	var resp struct {
		Results QuoteNumberConfig `json:"results"`
	}
	if err := c.http.Get(ctx, "/v1/quotes/number-config", &resp); err != nil {
		return nil, err
	}
	return &resp.Results, nil
}

// UpdateQuoteNumberConfig updates the per-org quote numbering format and returns
// the resulting configuration (format + currentFloor). The full format object
// (all eight fields) is sent as the request body. Requires an administrator API key.
func (c *QuoteClient) UpdateQuoteNumberConfig(ctx context.Context, format *QuoteNumberFormat) (*QuoteNumberConfig, error) {
	var resp struct {
		Results QuoteNumberConfig `json:"results"`
	}
	if err := c.http.Patch(ctx, "/v1/quotes/number-config", format, &resp); err != nil {
		return nil, err
	}
	return &resp.Results, nil
}
