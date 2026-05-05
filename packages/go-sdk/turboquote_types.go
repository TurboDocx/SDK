package turbodocx

// ============================================
// Shared Enums / Constants
// ============================================

// QuoteStatus represents the status of a quote
type QuoteStatus = string

const (
	QuoteStatusDraft    QuoteStatus = "draft"
	QuoteStatusSent     QuoteStatus = "sent"
	QuoteStatusAccepted QuoteStatus = "accepted"
	QuoteStatusDeclined QuoteStatus = "declined"
	QuoteStatusVoided   QuoteStatus = "voided"
)

// BillingFrequency represents a billing interval
type BillingFrequency = string

const (
	BillingFrequencyMonthly   BillingFrequency = "monthly"
	BillingFrequencyQuarterly BillingFrequency = "quarterly"
	BillingFrequencyAnnual    BillingFrequency = "annual"
	BillingFrequencyOneTime   BillingFrequency = "one-time"
)

// LineItemType represents line item types
type LineItemType = string

const (
	LineItemTypeProduct LineItemType = "product"
	LineItemTypeBundle  LineItemType = "bundle"
)

// RenewalPeriod represents a renewal interval
type RenewalPeriod = string

const (
	RenewalPeriodWeekly    RenewalPeriod = "weekly"
	RenewalPeriodMonthly   RenewalPeriod = "monthly"
	RenewalPeriodQuarterly RenewalPeriod = "quarterly"
	RenewalPeriodAnnually  RenewalPeriod = "annually"
)

// Currency represents a supported currency
type Currency = string

const (
	CurrencyUSD Currency = "USD"
	CurrencyEUR Currency = "EUR"
	CurrencyGBP Currency = "GBP"
	CurrencyCAD Currency = "CAD"
	CurrencyAUD Currency = "AUD"
	CurrencyINR Currency = "INR"
)

// CategoryType represents a category classification
type CategoryType = string

const (
	CategoryTypeProductCategory CategoryType = "product_category"
	CategoryTypePricebookType   CategoryType = "pricebook_type"
	CategoryTypeCompanyIndustry CategoryType = "company_industry"
	CategoryTypeBundleCategory  CategoryType = "bundle_category"
)

// BundleItemStatus represents the status of a bundle item
type BundleItemStatus = string

const (
	BundleItemStatusActive             BundleItemStatus = "active"
	BundleItemStatusProductDeleted     BundleItemStatus = "product_deleted"
	BundleItemStatusProductUnavailable BundleItemStatus = "product_unavailable"
	BundleItemStatusCurrencyMismatch   BundleItemStatus = "currency_mismatch"
)

// ============================================
// Shared Types
// ============================================

// QuotePaginationParams holds standard pagination/search options
type QuotePaginationParams struct {
	Limit  *int    `json:"limit,omitempty"`
	Offset *int    `json:"offset,omitempty"`
	Query  *string `json:"query,omitempty"`
}

// QuotePaginatedResponse is the generic paginated response shape
type QuotePaginatedResponse struct {
	TotalRecords int `json:"totalRecords"`
}

// QuoteSuccessResponse is a generic success response
type QuoteSuccessResponse struct {
	Message string `json:"message"`
}

// ============================================
// Quote Types
// ============================================

// QuoteStatusInfo describes the current status capabilities of a quote
type QuoteStatusInfo struct {
	CurrentStatus string `json:"currentStatus"`
	CanSend       bool   `json:"canSend"`
	CanAccept     bool   `json:"canAccept"`
	CanDecline    bool   `json:"canDecline"`
	CanVoid       bool   `json:"canVoid"`
	IsTerminal    bool   `json:"isTerminal"`
}

// QuoteCreator represents the creator of a quote
type QuoteCreator struct {
	ID        string `json:"id"`
	FirstName string `json:"firstName"`
	LastName  string `json:"lastName"`
}

// Quote represents a quote entity
type Quote struct {
	ID                 string           `json:"id"`
	OrgID              string           `json:"orgId"`
	QuoteNumber        string           `json:"quoteNumber"`
	Name               string           `json:"name"`
	Status             QuoteStatus      `json:"status"`
	CompanyID          string           `json:"companyId"`
	ContactID          string           `json:"contactId"`
	PriceBookID        *string          `json:"priceBookId"`
	TermDays           int              `json:"termDays"`
	RenewalPeriod      *string          `json:"renewalPeriod"`
	SentAt             *string          `json:"sentAt"`
	ValidUntil         *string          `json:"validUntil"`
	TaxRate            *float64         `json:"taxRate"`
	CurrencyCode       Currency         `json:"currency"`
	SubtotalMonthly    float64          `json:"subtotalMonthly"`
	SubtotalQuarterly  float64          `json:"subtotalQuarterly"`
	SubtotalAnnual     float64          `json:"subtotalAnnual"`
	SubtotalOneTime    float64          `json:"subtotalOneTime"`
	TaxAmount          float64          `json:"taxAmount"`
	GrandTotal         float64          `json:"grandTotal"`
	IsActive           bool             `json:"isActive"`
	CreatedBy          *string          `json:"createdBy"`
	CreatedOn          string           `json:"createdOn"`
	UpdatedOn          string           `json:"updatedOn"`
	Company            *Company         `json:"company,omitempty"`
	Contact            *Contact         `json:"contact,omitempty"`
	LineItems          []LineItem       `json:"lineItems,omitempty"`
	PriceBook          *PriceBook       `json:"priceBook,omitempty"`
	Creator            *QuoteCreator    `json:"creator,omitempty"`
	StatusInfo         *QuoteStatusInfo `json:"statusInfo,omitempty"`
}

// ============================================
// Quote Request Types
// ============================================

// CreateQuoteRequest is the request to create a new quote
type CreateQuoteRequest struct {
	Name          string   `json:"name"`
	CompanyID     string   `json:"companyId"`
	ContactID     string   `json:"contactId"`
	CurrencyCode  *string  `json:"currency,omitempty"`
	TermDays      *int     `json:"termDays,omitempty"`
	RenewalPeriod *string  `json:"renewalPeriod,omitempty"`
	ValidUntil    *string  `json:"validUntil,omitempty"`
	TaxRate       *float64 `json:"taxRate,omitempty"`
	PriceBookID   *string  `json:"priceBookId,omitempty"`
}

// UpdateQuoteRequest is the request to update a quote
type UpdateQuoteRequest struct {
	Name          *string  `json:"name,omitempty"`
	CompanyID     *string  `json:"companyId,omitempty"`
	ContactID     *string  `json:"contactId,omitempty"`
	TermDays      *int     `json:"termDays,omitempty"`
	RenewalPeriod *string  `json:"renewalPeriod,omitempty"`
	ValidUntil    *string  `json:"validUntil,omitempty"`
	TaxRate       *float64 `json:"taxRate,omitempty"`
	CurrencyCode  *string  `json:"currency,omitempty"`
	PriceBookID   *string  `json:"priceBookId,omitempty"`
}

// ListQuotesOptions holds the filter/pagination options for listing quotes
type ListQuotesOptions struct {
	Limit      *int     `json:"limit,omitempty"`
	Offset     *int     `json:"offset,omitempty"`
	Query      *string  `json:"query,omitempty"`
	Statuses   []string `json:"statuses,omitempty"`
	CompanyID  *string  `json:"companyId,omitempty"`
	ContactID  *string  `json:"contactId,omitempty"`
	CurrencyCode *string `json:"currency,omitempty"`
}

// SendQuoteRequest is the request to send a quote
type SendQuoteRequest struct {
	CCEmails   []string `json:"ccEmails,omitempty"`
	ValidUntil *string  `json:"validUntil,omitempty"`
}

// SendQuoteWithDeliverableRequest is the request to send a quote with a deliverable
type SendQuoteWithDeliverableRequest struct {
	DeliverableID string   `json:"deliverableId"`
	MergePosition string   `json:"mergePosition"`
	CCEmails      []string `json:"ccEmails,omitempty"`
}

// DeclineQuoteRequest is the request to decline a quote
type DeclineQuoteRequest struct {
	Reason string `json:"reason"`
}

// VoidQuoteRequest is the request to void a quote
type VoidQuoteRequest struct {
	Reason string `json:"reason"`
}

// HandleExpiredQuoteRequest is the request to handle an expired sent quote
type HandleExpiredQuoteRequest struct {
	Action        string `json:"action"`
	Reason        string `json:"reason"`
	NewValidUntil string `json:"newValidUntil"`
}

// CreateAndSendRequest is the convenience request to create, add items, and send a quote
type CreateAndSendRequest struct {
	// Quote fields
	Name          string   `json:"name"`
	CompanyID     string   `json:"companyId"`
	ContactID     string   `json:"contactId"`
	CurrencyCode  *string  `json:"currency,omitempty"`
	TermDays      *int     `json:"termDays,omitempty"`
	RenewalPeriod *string  `json:"renewalPeriod,omitempty"`
	ValidUntil    *string  `json:"validUntil,omitempty"`
	TaxRate       *float64 `json:"taxRate,omitempty"`
	PriceBookID   *string  `json:"priceBookId,omitempty"`

	// Line items
	Items       []AddLineItemRequest       `json:"-"`
	BundleItems []AddBundleLineItemRequest `json:"-"`

	// Send options
	Send *SendQuoteRequest `json:"-"`
}

// ============================================
// Quote Response Types
// ============================================

// QuoteListStats holds aggregate statistics returned with a quote list
type QuoteListStats struct {
	Total                   int                       `json:"total"`
	Draft                   int                       `json:"draft"`
	Sent                    int                       `json:"sent"`
	Accepted                int                       `json:"accepted"`
	Declined                int                       `json:"declined"`
	Voided                  int                       `json:"voided"`
	TotalPipeline           []CurrencyTotalEntry      `json:"totalPipeline"`
	ActiveQuotes            int                       `json:"activeQuotes"`
	MonthlyRecurringRevenue []CurrencyTotalEntry      `json:"monthlyRecurringRevenue"`
	WinRate                 float64                   `json:"winRate"`
	AvgMargin               float64                   `json:"avgMargin"`
	QuotesThisMonth         int                       `json:"quotesThisMonth"`
}

// CurrencyTotalEntry represents a currency-specific total
type CurrencyTotalEntry struct {
	CurrencyCode string  `json:"currency"`
	Total        float64 `json:"total"`
}

// QuoteListResponse is the response from listing quotes
type QuoteListResponse struct {
	Results      []Quote        `json:"results"`
	TotalRecords int            `json:"totalRecords"`
	Stats        QuoteListStats `json:"stats"`
}

// SendQuoteResponse is the response from sending a quote
type SendQuoteResponse struct {
	QuoteResult Quote  `json:"quote"`
	Message     string `json:"message"`
}

// SendQuoteWithDeliverableResponse is the response from sending a quote with a deliverable
type SendQuoteWithDeliverableResponse struct {
	QuoteResult Quote  `json:"quote"`
	Message     string `json:"message"`
	DocumentID  string `json:"documentId"`
}

// ApplyPriceBookResponse is the response from applying a price book to a quote
type ApplyPriceBookResponse struct {
	QuoteResult  Quote  `json:"quote"`
	Message      string `json:"message"`
	UpdatedCount int    `json:"updatedCount"`
	SkippedCount int    `json:"skippedCount"`
}

// CreateAndSendResponse is the response from the createAndSend convenience method
type CreateAndSendResponse struct {
	QuoteResult Quote `json:"quote"`
}

// ============================================
// Line Item Types
// ============================================

// LineItem represents a line item on a quote
type LineItem struct {
	ID                  string     `json:"id"`
	OrgID               string     `json:"orgId"`
	QuoteID             string     `json:"quoteId"`
	LineItemTypeField   string     `json:"lineItemType"`
	ParentLineItemID    *string    `json:"parentLineItemId"`
	ProductID           *string    `json:"productId"`
	ProductName         *string    `json:"productName"`
	ProductSku          *string    `json:"productSku"`
	ProductDescription  *string    `json:"productDescription"`
	BundleID            *string    `json:"bundleId"`
	BundleName          *string    `json:"bundleName"`
	BundleDescription   *string    `json:"bundleDescription"`
	Quantity            int        `json:"quantity"`
	UnitPrice           float64    `json:"unitPrice"`
	DiscountPercent     float64    `json:"discountPercent"`
	Subtotal            float64    `json:"subtotal"`
	Cost                *float64   `json:"cost"`
	MarginPercent       *float64   `json:"marginPercent"`
	CategoryID          *string    `json:"categoryId"`
	CategoryName        *string    `json:"categoryName"`
	BillingFrequencyVal *string    `json:"billingFrequency"`
	ShowItemsToEndUser  bool       `json:"showItemsToEndUser"`
	IsActive            bool       `json:"isActive"`
	CreatedBy           *string    `json:"createdBy"`
	CreatedOn           string     `json:"createdOn"`
	UpdatedOn           string     `json:"updatedOn"`
	Product             *Product   `json:"product,omitempty"`
	ChildLineItems      []LineItem `json:"childLineItems,omitempty"`
}

// AddLineItemRequest is the request to add a product line item
type AddLineItemRequest struct {
	ProductID          *string  `json:"productId"`
	ProductName        string   `json:"productName"`
	UnitPrice          float64  `json:"unitPrice"`
	BillingFrequency   string   `json:"billingFrequency"`
	Quantity           *int     `json:"quantity,omitempty"`
	DiscountPercent    *float64 `json:"discountPercent,omitempty"`
	CategoryID         *string  `json:"categoryId,omitempty"`
	CategoryName       *string  `json:"categoryName,omitempty"`
	Cost               *float64 `json:"cost,omitempty"`
	ProductSku         *string  `json:"productSku,omitempty"`
	ProductDescription *string  `json:"productDescription,omitempty"`
}

// AddBundleLineItemRequest is the request to add a bundle line item
type AddBundleLineItemRequest struct {
	BundleID           string  `json:"bundleId"`
	BundleName         string  `json:"bundleName"`
	Quantity           *int    `json:"quantity,omitempty"`
	DiscountPercent    *float64 `json:"discountPercent,omitempty"`
	BundleDescription  *string  `json:"bundleDescription,omitempty"`
	ShowItemsToEndUser *bool    `json:"showItemsToEndUser,omitempty"`
}

// UpdateLineItemRequest is the request to update a line item
type UpdateLineItemRequest struct {
	Quantity           *int     `json:"quantity,omitempty"`
	UnitPrice          *float64 `json:"unitPrice,omitempty"`
	DiscountPercent    *float64 `json:"discountPercent,omitempty"`
	BillingFrequency   *string  `json:"billingFrequency,omitempty"`
	CategoryID         *string  `json:"categoryId,omitempty"`
	CategoryName       *string  `json:"categoryName,omitempty"`
	Cost               *float64 `json:"cost,omitempty"`
	ShowItemsToEndUser *bool    `json:"showItemsToEndUser,omitempty"`
	ProductName        *string  `json:"productName,omitempty"`
	ProductSku         *string  `json:"productSku,omitempty"`
	ProductDescription *string  `json:"productDescription,omitempty"`
}

// ListLineItemsOptions holds the filter/pagination options for listing line items
type ListLineItemsOptions struct {
	Limit             *int    `json:"limit,omitempty"`
	Offset            *int    `json:"offset,omitempty"`
	LineItemType      *string `json:"lineItemType,omitempty"`
	BillingFrequency  *string `json:"billingFrequency,omitempty"`
	ParentLineItemID  *string `json:"parentLineItemId,omitempty"`
}

// LineItemListResponse is the response from listing line items
type LineItemListResponse struct {
	Results      []LineItem `json:"results"`
	TotalRecords int        `json:"totalRecords"`
}

// ============================================
// Product Types
// ============================================

// ProductImage represents an image attached to a product
type ProductImage struct {
	ID           string `json:"id"`
	ProductID    string `json:"productId"`
	FileID       string `json:"fileId"`
	FileName     string `json:"fileName"`
	FileType     string `json:"fileType"`
	DisplayOrder int    `json:"displayOrder"`
	ImageData    string `json:"imageData,omitempty"`
}

// ProductCategory represents an inline category reference
type ProductCategory struct {
	ID           string `json:"id"`
	Name         string `json:"name"`
	CategoryType string `json:"categoryType"`
}

// Product represents a product entity
type Product struct {
	ID                    string           `json:"id"`
	OrgID                 string           `json:"orgId"`
	Name                  string           `json:"name"`
	Sku                   *string          `json:"sku"`
	Description           *string          `json:"description"`
	DetailedSpecification *string          `json:"detailedSpecification"`
	InternalNotes         *string          `json:"internalNotes"`
	CategoryID            string           `json:"categoryId"`
	ListPrice             float64          `json:"listPrice"`
	Cost                  *float64         `json:"cost"`
	MinimumOrderQuantity  int              `json:"minimumOrderQuantity"`
	BillingFrequency      string           `json:"billingFrequency"`
	CurrencyCode          Currency         `json:"currency"`
	ShowInCatalog         bool             `json:"showInCatalog"`
	IsActive              bool             `json:"isActive"`
	CreatedBy             *string          `json:"createdBy"`
	CreatedOn             string           `json:"createdOn"`
	UpdatedOn             string           `json:"updatedOn"`
	Images                []ProductImage   `json:"images,omitempty"`
	Category              *ProductCategory `json:"category,omitempty"`
}

// CreateProductRequest is the request to create a product
type CreateProductRequest struct {
	Name                  string   `json:"name"`
	ListPrice             float64  `json:"listPrice"`
	BillingFrequency      string   `json:"billingFrequency"`
	CategoryID            string   `json:"categoryId"`
	Sku                   *string  `json:"sku,omitempty"`
	Description           *string  `json:"description,omitempty"`
	DetailedSpecification *string  `json:"detailedSpecification,omitempty"`
	InternalNotes         *string  `json:"internalNotes,omitempty"`
	Cost                  *float64 `json:"cost,omitempty"`
	MinimumOrderQuantity  *int     `json:"minimumOrderQuantity,omitempty"`
	CurrencyCode          *string  `json:"currency,omitempty"`
	ShowInCatalog         *bool    `json:"showInCatalog,omitempty"`

	// Images for multipart upload (file paths or byte slices)
	Images []ProductImageInput `json:"-"`
}

// ProductImageInput represents an image to upload (either file path or raw bytes)
type ProductImageInput struct {
	FilePath string // local file path
	Data     []byte // raw image bytes
	FileName string // optional filename (used with Data)
}

// UpdateProductRequest is the request to update a product
type UpdateProductRequest struct {
	Name                  *string  `json:"name,omitempty"`
	ListPrice             *float64 `json:"listPrice,omitempty"`
	BillingFrequency      *string  `json:"billingFrequency,omitempty"`
	Sku                   *string  `json:"sku,omitempty"`
	Description           *string  `json:"description,omitempty"`
	DetailedSpecification *string  `json:"detailedSpecification,omitempty"`
	InternalNotes         *string  `json:"internalNotes,omitempty"`
	CategoryID            *string  `json:"categoryId,omitempty"`
	Cost                  *float64 `json:"cost,omitempty"`
	MinimumOrderQuantity  *int     `json:"minimumOrderQuantity,omitempty"`
	CurrencyCode          *string  `json:"currency,omitempty"`
	ShowInCatalog         *bool    `json:"showInCatalog,omitempty"`
	ImageIDsToKeep        []string `json:"imageIdsToKeep,omitempty"`
	ImageOrder            []string `json:"imageOrder,omitempty"`

	// Images for multipart upload
	Images []ProductImageInput `json:"-"`
}

// ListProductsOptions holds the filter/pagination options for listing products
type ListProductsOptions struct {
	Limit            *int     `json:"limit,omitempty"`
	Offset           *int     `json:"offset,omitempty"`
	Query            *string  `json:"query,omitempty"`
	CategoryIDs      []string `json:"categoryIds,omitempty"`
	BillingFrequency *string  `json:"billingFrequency,omitempty"`
	CurrencyCode     *string  `json:"currency,omitempty"`
	ShowInCatalog    *bool    `json:"showInCatalog,omitempty"`
}

// ProductListResponse is the response from listing products
type ProductListResponse struct {
	Results         []Product `json:"results"`
	TotalRecords    int       `json:"totalRecords"`
	TotalProducts   int       `json:"totalProducts"`
	ActiveProducts  int       `json:"activeProducts"`
	TotalCategories int       `json:"totalCategories"`
	CatalogValue    float64   `json:"catalogValue"`
}

// ProductPrimaryImagesResponse maps product IDs to their primary image (or null)
type ProductPrimaryImagesResponse map[string]*ProductImage

// ============================================
// PriceBook Types
// ============================================

// PriceBookProductPricing represents product pricing within a price book
type PriceBookProductPricing struct {
	ID              *string  `json:"id,omitempty"`
	PriceBookID     *string  `json:"priceBookId,omitempty"`
	ProductID       string   `json:"productId"`
	DiscountPercent float64  `json:"discountPercent"`
	FinalPrice      float64  `json:"finalPrice"`
	OrgID           *string  `json:"orgId,omitempty"`
	IsActive        *bool    `json:"isActive,omitempty"`
	CreatedBy       *string  `json:"createdBy,omitempty"`
	CreatedOn       *string  `json:"createdOn,omitempty"`
	UpdatedOn       *string  `json:"updatedOn,omitempty"`
	Product         *Product `json:"product,omitempty"`
}

// PriceBookType represents an inline price book type reference
type PriceBookType struct {
	ID           string `json:"id"`
	Name         string `json:"name"`
	CategoryType string `json:"categoryType"`
}

// PriceBook represents a price book entity
type PriceBook struct {
	ID                 string                    `json:"id"`
	OrgID              string                    `json:"orgId"`
	Name               string                    `json:"name"`
	Description        *string                   `json:"description"`
	PriceBookTypeID    string                    `json:"priceBookTypeId"`
	DiscountPercent    float64                   `json:"discountPercent"`
	ValidFrom          string                    `json:"validFrom"`
	ValidTo            *string                   `json:"validTo"`
	IsDefault          bool                      `json:"isDefault"`
	ShowInQuoteBuilder bool                      `json:"showInQuoteBuilder"`
	IsActive           bool                      `json:"isActive"`
	CreatedBy          *string                   `json:"createdBy"`
	CreatedOn          string                    `json:"createdOn"`
	UpdatedOn          string                    `json:"updatedOn"`
	ProductPricing     []PriceBookProductPricing `json:"productPricing,omitempty"`
	PriceBookType      *PriceBookType            `json:"priceBookType,omitempty"`
	ProductCount       *int                      `json:"productCount,omitempty"`
}

// PriceBookProductPricingInput represents a product pricing entry for create/update
type PriceBookProductPricingInput struct {
	ProductID       string   `json:"productId"`
	DiscountPercent *float64 `json:"discountPercent,omitempty"`
	FinalPrice      *float64 `json:"finalPrice,omitempty"`
}

// CreatePriceBookRequest is the request to create a price book
type CreatePriceBookRequest struct {
	Name               string                         `json:"name"`
	PriceBookTypeID    string                         `json:"priceBookTypeId"`
	ValidFrom          string                         `json:"validFrom"`
	DiscountPercent    *float64                       `json:"discountPercent,omitempty"`
	Description        *string                        `json:"description,omitempty"`
	ValidTo            *string                        `json:"validTo,omitempty"`
	IsDefault          *bool                          `json:"isDefault,omitempty"`
	ShowInQuoteBuilder *bool                          `json:"showInQuoteBuilder,omitempty"`
	ProductPricing     []PriceBookProductPricingInput `json:"productPricing,omitempty"`
}

// UpdatePriceBookRequest is the request to update a price book
type UpdatePriceBookRequest struct {
	Name               *string                        `json:"name,omitempty"`
	PriceBookTypeID    *string                        `json:"priceBookTypeId,omitempty"`
	Description        *string                        `json:"description,omitempty"`
	DiscountPercent    *float64                       `json:"discountPercent,omitempty"`
	ValidFrom          *string                        `json:"validFrom,omitempty"`
	ValidTo            *string                        `json:"validTo,omitempty"`
	IsDefault          *bool                          `json:"isDefault,omitempty"`
	ShowInQuoteBuilder *bool                          `json:"showInQuoteBuilder,omitempty"`
	ProductPricing     []PriceBookProductPricingInput `json:"productPricing,omitempty"`
}

// ListPriceBooksOptions holds the filter/pagination options for listing price books
type ListPriceBooksOptions struct {
	Limit              *int     `json:"limit,omitempty"`
	Offset             *int     `json:"offset,omitempty"`
	Query              *string  `json:"query,omitempty"`
	PriceBookTypeIDs   []string `json:"priceBookTypeIds,omitempty"`
	ShowInQuoteBuilder *bool    `json:"showInQuoteBuilder,omitempty"`
}

// ListPriceBookProductsOptions holds the filter/pagination options for listing price book products
type ListPriceBookProductsOptions struct {
	Limit       *int     `json:"limit,omitempty"`
	Offset      *int     `json:"offset,omitempty"`
	Query       *string  `json:"query,omitempty"`
	CategoryIDs []string `json:"categoryIds,omitempty"`
}

// PriceBookListResponse is the response from listing price books
type PriceBookListResponse struct {
	Results              []PriceBook `json:"results"`
	TotalRecords         int         `json:"totalRecords"`
	TotalPriceBooks      int         `json:"totalPriceBooks"`
	ActiveInBuilder      int         `json:"activeInBuilder"`
	TotalProducts        int         `json:"totalProducts"`
	DefaultPriceBookName *string     `json:"defaultPriceBookName"`
}

// PriceBookProductListResponse is the response from listing price book products
type PriceBookProductListResponse struct {
	Results      []PriceBookProductPricing `json:"results"`
	TotalRecords int                       `json:"totalRecords"`
}

// ============================================
// Bundle Types
// ============================================

// BundleItem represents a product within a bundle
type BundleItem struct {
	ID              string   `json:"id"`
	OrgID           string   `json:"orgId"`
	BundleID        string   `json:"bundleId"`
	ProductID       string   `json:"productId"`
	Quantity        int      `json:"quantity"`
	UnitPrice       float64  `json:"unitPrice"`
	DiscountPercent float64  `json:"discountPercent"`
	FinalPrice      float64  `json:"finalPrice"`
	Cost            *float64 `json:"cost"`
	BillingFrequency string  `json:"billingFrequency"`
	ItemStatus      string   `json:"itemStatus"`
	IsActive        bool     `json:"isActive"`
	CreatedBy       *string  `json:"createdBy"`
	CreatedOn       string   `json:"createdOn"`
	UpdatedOn       string   `json:"updatedOn"`
	Product         *Product `json:"product,omitempty"`
}

// BundleCategory represents an inline category reference for bundles
type BundleCategory struct {
	ID           string `json:"id"`
	Name         string `json:"name"`
	CategoryType string `json:"categoryType"`
}

// Bundle represents a bundle entity
type Bundle struct {
	ID                    string          `json:"id"`
	OrgID                 string          `json:"orgId"`
	Name                  string          `json:"name"`
	Description           *string         `json:"description"`
	Sku                   *string         `json:"sku"`
	CategoryID            *string         `json:"categoryId"`
	BundleDiscountPercent float64         `json:"bundleDiscountPercent"`
	TotalListPrice        float64         `json:"totalListPrice"`
	TotalFinalPrice       float64         `json:"totalFinalPrice"`
	TotalCost             float64         `json:"totalCost"`
	CurrencyCode          Currency        `json:"currency"`
	ShowItemsToEndUser    bool            `json:"showItemsToEndUser"`
	ShowInCatalog         bool            `json:"showInCatalog"`
	SyncWithProducts      bool            `json:"syncWithProducts"`
	IsActive              bool            `json:"isActive"`
	CreatedBy             *string         `json:"createdBy"`
	CreatedOn             string          `json:"createdOn"`
	UpdatedOn             string          `json:"updatedOn"`
	Items                 []BundleItem    `json:"items,omitempty"`
	Category              *BundleCategory `json:"category,omitempty"`
}

// BundleItemInput represents a bundle item entry for create/update
type BundleItemInput struct {
	ProductID       string   `json:"productId"`
	UnitPrice       float64  `json:"unitPrice"`
	BillingFrequency string  `json:"billingFrequency"`
	Quantity        *int     `json:"quantity,omitempty"`
	DiscountPercent *float64 `json:"discountPercent,omitempty"`
	FinalPrice      *float64 `json:"finalPrice,omitempty"`
	Cost            *float64 `json:"cost,omitempty"`
}

// CreateBundleRequest is the request to create a bundle
type CreateBundleRequest struct {
	Name                  string            `json:"name"`
	CategoryID            string            `json:"categoryId"`
	Items                 []BundleItemInput `json:"items,omitempty"`
	Description           *string           `json:"description,omitempty"`
	Sku                   *string           `json:"sku,omitempty"`
	BundleDiscountPercent *float64          `json:"bundleDiscountPercent,omitempty"`
	CurrencyCode          *string           `json:"currency,omitempty"`
	ShowItemsToEndUser    *bool             `json:"showItemsToEndUser,omitempty"`
	ShowInCatalog         *bool             `json:"showInCatalog,omitempty"`
	SyncWithProducts      *bool             `json:"syncWithProducts,omitempty"`
}

// UpdateBundleRequest is the request to update a bundle
type UpdateBundleRequest struct {
	Name                  *string           `json:"name,omitempty"`
	Items                 []BundleItemInput `json:"items,omitempty"`
	Description           *string           `json:"description,omitempty"`
	Sku                   *string           `json:"sku,omitempty"`
	CategoryID            *string           `json:"categoryId,omitempty"`
	BundleDiscountPercent *float64          `json:"bundleDiscountPercent,omitempty"`
	CurrencyCode          *string           `json:"currency,omitempty"`
	ShowItemsToEndUser    *bool             `json:"showItemsToEndUser,omitempty"`
	ShowInCatalog         *bool             `json:"showInCatalog,omitempty"`
	SyncWithProducts      *bool             `json:"syncWithProducts,omitempty"`
}

// ListBundlesOptions holds the filter/pagination options for listing bundles
type ListBundlesOptions struct {
	Limit         *int     `json:"limit,omitempty"`
	Offset        *int     `json:"offset,omitempty"`
	Query         *string  `json:"query,omitempty"`
	CategoryIDs   []string `json:"categoryIds,omitempty"`
	CurrencyCode  *string  `json:"currency,omitempty"`
	ShowInCatalog *bool    `json:"showInCatalog,omitempty"`
}

// BundleListResponse is the response from listing bundles
type BundleListResponse struct {
	Results         []Bundle `json:"results"`
	TotalRecords    int      `json:"totalRecords"`
	TotalBundles    int      `json:"totalBundles"`
	ActiveBundles   int      `json:"activeBundles"`
	TotalCategories int      `json:"totalCategories"`
	CatalogValue    float64  `json:"catalogValue"`
}

// ============================================
// Company Types
// ============================================

// Company represents a company entity
type Company struct {
	ID               string     `json:"id"`
	OrgID            string     `json:"orgId"`
	Name             string     `json:"name"`
	Phone            *string    `json:"phone"`
	City             *string    `json:"city"`
	State            *string    `json:"state"`
	Country          *string    `json:"country"`
	IndustryID       *string    `json:"industryId"`
	LastActivityDate *string    `json:"lastActivityDate"`
	IsActive         bool       `json:"isActive"`
	CreatedBy        *string    `json:"createdBy"`
	CreatedOn        string     `json:"createdOn"`
	UpdatedOn        string     `json:"updatedOn"`
	ContactCount     *int       `json:"contactCount,omitempty"`
	Industry         *QuoteType `json:"industry,omitempty"`
}

// CreateCompanyContactInput represents an inline contact for company creation
type CreateCompanyContactInput struct {
	Name  string  `json:"name"`
	Email string  `json:"email"`
	Phone *string `json:"phone,omitempty"`
	Title *string `json:"title,omitempty"`
}

// CreateCompanyRequest is the request to create a company
type CreateCompanyRequest struct {
	Name       string                      `json:"name"`
	Contacts   []CreateCompanyContactInput `json:"contacts"`
	Phone      *string                     `json:"phone,omitempty"`
	City       *string                     `json:"city,omitempty"`
	State      *string                     `json:"state,omitempty"`
	Country    *string                     `json:"country,omitempty"`
	IndustryID *string                     `json:"industryId,omitempty"`
}

// UpdateCompanyRequest is the request to update a company
type UpdateCompanyRequest struct {
	Name       *string `json:"name,omitempty"`
	Phone      *string `json:"phone,omitempty"`
	City       *string `json:"city,omitempty"`
	State      *string `json:"state,omitempty"`
	Country    *string `json:"country,omitempty"`
	IndustryID *string `json:"industryId,omitempty"`
}

// ListCompaniesOptions holds the filter/pagination options for listing companies
type ListCompaniesOptions struct {
	Limit       *int     `json:"limit,omitempty"`
	Offset      *int     `json:"offset,omitempty"`
	Query       *string  `json:"query,omitempty"`
	IndustryIDs []string `json:"industryIds,omitempty"`
}

// CompanyListResponse is the response from listing companies
type CompanyListResponse struct {
	Results      []Company `json:"results"`
	TotalRecords int       `json:"totalRecords"`
}

// ============================================
// Contact Types
// ============================================

// Contact represents a contact entity
type Contact struct {
	ID        string   `json:"id"`
	OrgID     string   `json:"orgId"`
	CompanyID string   `json:"companyId"`
	Name      string   `json:"name"`
	Email     *string  `json:"email"`
	Phone     *string  `json:"phone"`
	Title     *string  `json:"title"`
	IsActive  bool     `json:"isActive"`
	CreatedBy *string  `json:"createdBy"`
	CreatedOn string   `json:"createdOn"`
	UpdatedOn string   `json:"updatedOn"`
	Company   *Company `json:"company,omitempty"`
}

// CreateContactRequest is the request to create a contact
type CreateContactRequest struct {
	Name      string  `json:"name"`
	CompanyID string  `json:"companyId"`
	Email     *string `json:"email,omitempty"`
	Phone     *string `json:"phone,omitempty"`
	Title     *string `json:"title,omitempty"`
}

// UpdateContactRequest is the request to update a contact
type UpdateContactRequest struct {
	Name  *string `json:"name,omitempty"`
	Email *string `json:"email,omitempty"`
	Phone *string `json:"phone,omitempty"`
	Title *string `json:"title,omitempty"`
}

// ListContactsOptions holds the filter/pagination options for listing contacts
type ListContactsOptions struct {
	Limit     *int    `json:"limit,omitempty"`
	Offset    *int    `json:"offset,omitempty"`
	Query     *string `json:"query,omitempty"`
	CompanyID *string `json:"companyId,omitempty"`
}

// ContactListResponse is the response from listing contacts
type ContactListResponse struct {
	Results      []Contact `json:"results"`
	TotalRecords int       `json:"totalRecords"`
}

// ============================================
// Quote Template Types
// ============================================

// QuoteTemplate represents a quote template entity
type QuoteTemplate struct {
	ID                string  `json:"id"`
	OrgID             string  `json:"orgId"`
	LogoURL           *string `json:"logoUrl"`
	PrimaryColor      string  `json:"primaryColor"`
	PrimaryTextColor  string  `json:"primaryTextColor"`
	Disclaimer        *string `json:"disclaimer"`
	TermsAndConditions *string `json:"termsAndConditions"`
	ClosingMessage    *string `json:"closingMessage"`
	SenderName        *string `json:"senderName"`
	SenderPhone       *string `json:"senderPhone"`
	SenderEmail       *string `json:"senderEmail"`
	ContactEmail      *string `json:"contactEmail"`
	IsActive          bool    `json:"isActive"`
	CreatedBy         *string `json:"createdBy"`
	CreatedOn         string  `json:"createdOn"`
	UpdatedOn         string  `json:"updatedOn"`
}

// CreateQuoteTemplateRequest is the request to create a quote template
type CreateQuoteTemplateRequest struct {
	LogoURL            *string `json:"logoUrl,omitempty"`
	PrimaryColor       *string `json:"primaryColor,omitempty"`
	PrimaryTextColor   *string `json:"primaryTextColor,omitempty"`
	Disclaimer         *string `json:"disclaimer,omitempty"`
	TermsAndConditions *string `json:"termsAndConditions,omitempty"`
	ClosingMessage     *string `json:"closingMessage,omitempty"`
	SenderName         *string `json:"senderName,omitempty"`
	SenderPhone        *string `json:"senderPhone,omitempty"`
	SenderEmail        *string `json:"senderEmail,omitempty"`
	ContactEmail       *string `json:"contactEmail,omitempty"`
}

// UpdateQuoteTemplateRequest is the same shape as CreateQuoteTemplateRequest
type UpdateQuoteTemplateRequest = CreateQuoteTemplateRequest

// QuoteTemplateListResponse is the response from listing templates
type QuoteTemplateListResponse struct {
	Results      []QuoteTemplate `json:"results"`
	TotalRecords int             `json:"totalRecords"`
}

// ============================================
// Quote Type / Category Types
// ============================================

// QuoteTypeUsage represents usage information for a type/category
type QuoteTypeUsage struct {
	InUse      bool     `json:"inUse"`
	UsageCount int      `json:"usageCount"`
	UsedIn     []string `json:"usedIn"`
}

// QuoteType represents a type/category entity (product_category, pricebook_type, etc.)
type QuoteType struct {
	ID           string          `json:"id"`
	OrgID        string          `json:"orgId"`
	Name         string          `json:"name"`
	CategoryType CategoryType    `json:"categoryType"`
	IsDefault    bool            `json:"isDefault"`
	IsActive     bool            `json:"isActive"`
	CreatedBy    *string         `json:"createdBy"`
	CreatedOn    string          `json:"createdOn"`
	UpdatedOn    string          `json:"updatedOn"`
	Usage        *QuoteTypeUsage `json:"usage,omitempty"`
}

// CreateQuoteTypeRequest is the request to create a type/category
type CreateQuoteTypeRequest struct {
	Name         string       `json:"name"`
	CategoryType CategoryType `json:"categoryType"`
}

// UpdateQuoteTypeRequest is the request to update a type/category
type UpdateQuoteTypeRequest struct {
	Name *string `json:"name,omitempty"`
}

// ListTypesOptions holds the filter/pagination options for listing types
type ListTypesOptions struct {
	Limit        *int    `json:"limit,omitempty"`
	Offset       *int    `json:"offset,omitempty"`
	Query        *string `json:"query,omitempty"`
	CategoryType *string `json:"categoryType,omitempty"`
	IncludeUsage *bool   `json:"includeUsage,omitempty"`
}

// QuoteTypeListResponse is the response from listing types
type QuoteTypeListResponse struct {
	Results      []QuoteType `json:"results"`
	TotalRecords int         `json:"totalRecords"`
}

// ============================================
// Workflow Types (for completeness)
// ============================================

// WorkflowNodePosition represents x/y position of a workflow node
type WorkflowNodePosition struct {
	X float64 `json:"x"`
	Y float64 `json:"y"`
}

// WorkflowConditionData represents a condition in a workflow node
type WorkflowConditionData struct {
	Field    string      `json:"field"`
	Operator string      `json:"operator"`
	Value    interface{} `json:"value"`
}

// WorkflowNodeData holds the data section of a workflow node
type WorkflowNodeData struct {
	Label        string                 `json:"label"`
	Condition    *WorkflowConditionData `json:"condition,omitempty"`
	Approvers    []string               `json:"approvers,omitempty"`
	RequireAll   *bool                  `json:"requireAll,omitempty"`
	TimeoutHours *int                   `json:"timeoutHours,omitempty"`
}

// WorkflowNode represents a single node in a workflow
type WorkflowNode struct {
	ID        string               `json:"id"`
	Type      string               `json:"type"`
	Data      WorkflowNodeData     `json:"data"`
	Position  WorkflowNodePosition `json:"position"`
	Deletable *bool                `json:"deletable,omitempty"`
}

// WorkflowEdge represents a connection between workflow nodes
type WorkflowEdge struct {
	ID     string `json:"id"`
	Source string `json:"source"`
	Target string `json:"target"`
}

// WorkflowViewport represents the visual viewport of a workflow
type WorkflowViewport struct {
	X    float64 `json:"x"`
	Y    float64 `json:"y"`
	Zoom float64 `json:"zoom"`
}

// Workflow represents an approval workflow
type Workflow struct {
	ID          string            `json:"id"`
	OrgID       string            `json:"orgId"`
	Name        string            `json:"name"`
	Description *string           `json:"description"`
	Nodes       []WorkflowNode    `json:"nodes"`
	Edges       []WorkflowEdge    `json:"edges"`
	Viewport    *WorkflowViewport `json:"viewport"`
	IsActive    bool              `json:"isActive"`
	CreatedBy   *string           `json:"createdBy"`
	CreatedOn   string            `json:"createdOn"`
	UpdatedOn   string            `json:"updatedOn"`
}

// ============================================
// QuoteClientConfig
// ============================================

// QuoteClientConfig holds configuration for the TurboQuote client
type QuoteClientConfig struct {
	// APIKey is your TurboDocx API key
	APIKey string

	// AccessToken is an OAuth2 access token (alternative to APIKey)
	AccessToken string

	// OrgID is your Organization ID
	OrgID string

	// BaseURL is the API base URL (optional, default: https://api.turbodocx.com)
	BaseURL string
}
