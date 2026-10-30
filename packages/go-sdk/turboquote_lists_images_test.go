package turbodocx

import (
	"context"
	"encoding/json"
	"io"
	"net/http"
	"net/http/httptest"
	"net/url"
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

// TurboQuote: list sorting and filters, the quote summary / creators / next number reads,
// open quotes, product quote images, custom line item images, named duplicates, company
// email and price book reset.

var (
	testPNG  = []byte{0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 0x00}
	testJPEG = []byte{0xFF, 0xD8, 0xFF, 0xE0, 0x00}
)

// jsonServer answers every request with body, after letting check inspect it.
func jsonServer(t *testing.T, check func(r *http.Request), body interface{}) *httptest.Server {
	t.Helper()
	return httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		check(r)
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(body)
	}))
}

func strPtr(s string) *string { return &s }

func TestQuoteClient_ListQuotes_SortAndNewFilters(t *testing.T) {
	var got url.Values
	server := jsonServer(t, func(r *http.Request) {
		assert.Equal(t, "/v1/quotes", r.URL.Path)
		got = r.URL.Query()
	}, map[string]interface{}{"results": []interface{}{}, "totalRecords": 0})
	defer server.Close()

	yes := true
	_, err := newTestQuoteClient(t, server.URL).ListQuotes(context.Background(), &ListQuotesOptions{
		SortBy:           strPtr("total"),
		SortDirection:    strPtr("asc"),
		Statuses:         []string{"sent", "expired"},
		CompanyIDs:       []string{"c-1", "c-2"},
		Currencies:       []string{"USD", "EUR"},
		CreatedBy:        []string{"u-1"},
		CreatedByAPIKeys: &yes,
		ValidUntilWindow: strPtr("thisMonth"),
		ValidUntilFrom:   strPtr("2026-10-01"),
		ValidUntilTo:     strPtr("2026-10-31"),
		SummaryCurrency:  strPtr("EUR"),
	})

	require.NoError(t, err)
	assert.Equal(t, url.Values{
		"sortBy":           {"total"},
		"sortDirection":    {"asc"},
		"statuses":         {"sent", "expired"},
		"companyIds":       {"c-1", "c-2"},
		"currencies":       {"USD", "EUR"},
		"createdBy":        {"u-1"},
		"createdByApiKeys": {"true"},
		"validUntilWindow": {"thisMonth"},
		"validUntilFrom":   {"2026-10-01"},
		"validUntilTo":     {"2026-10-31"},
		"summaryCurrency":  {"EUR"},
	}, got)
}

func TestQuoteClient_ListQuotes_ReturnsCountsSummaryAndExpiry(t *testing.T) {
	server := jsonServer(t, func(r *http.Request) {}, map[string]interface{}{
		"results": []interface{}{
			map[string]interface{}{"id": "q-1", "status": "sent", "isExpired": true, "isSignatureExpired": false, "lineItemCount": 3},
		},
		"totalRecords": 1,
		"statusCounts": map[string]interface{}{"all": 1, "sent": 1, "expired": 1},
		"summary": map[string]interface{}{
			"currency":     "USD",
			"currencies":   []string{"USD"},
			"winRate":      map[string]interface{}{"percent": nil, "accepted": 0, "declined": 0, "windowDays": 90},
			"openPipeline": map[string]interface{}{"total": 1200.5, "count": 2},
		},
	})
	defer server.Close()

	result, err := newTestQuoteClient(t, server.URL).ListQuotes(context.Background(), nil)

	require.NoError(t, err)
	require.NotNil(t, result.StatusCounts)
	assert.Equal(t, 1, result.StatusCounts.Expired)
	require.NotNil(t, result.Summary)
	assert.Nil(t, result.Summary.WinRate.Percent)
	assert.Equal(t, 90, result.Summary.WinRate.WindowDays)
	assert.Equal(t, 1200.5, result.Summary.OpenPipeline.Total)
	require.NotNil(t, result.Results[0].IsExpired)
	assert.True(t, *result.Results[0].IsExpired)
	assert.Equal(t, 3, *result.Results[0].LineItemCount)
}

func TestQuoteClient_ListProducts_SeveralValuesAndSort(t *testing.T) {
	var got url.Values
	server := jsonServer(t, func(r *http.Request) { got = r.URL.Query() },
		map[string]interface{}{"results": []interface{}{}, "totalRecords": 0})
	defer server.Close()

	_, err := newTestQuoteClient(t, server.URL).ListProducts(context.Background(), &ListProductsOptions{
		BillingFrequencies: []string{"monthly", "annual"},
		CurrencyCodes:      []string{"USD", "INR"},
		SortBy:             strPtr("listPrice"),
		SortDirection:      strPtr("desc"),
	})

	require.NoError(t, err)
	assert.Equal(t, url.Values{
		"billingFrequency": {"monthly", "annual"},
		"currency":         {"USD", "INR"},
		"sortBy":           {"listPrice"},
		"sortDirection":    {"desc"},
	}, got)
}

func TestQuoteClient_ListProducts_OneBillingFrequencyStillWorks(t *testing.T) {
	var got url.Values
	server := jsonServer(t, func(r *http.Request) { got = r.URL.Query() },
		map[string]interface{}{"results": []interface{}{}, "totalRecords": 0})
	defer server.Close()

	_, err := newTestQuoteClient(t, server.URL).ListProducts(context.Background(), &ListProductsOptions{
		BillingFrequency: strPtr("monthly"),
	})

	require.NoError(t, err)
	assert.Equal(t, url.Values{"billingFrequency": {"monthly"}}, got)
}

func TestQuoteClient_ListPriceBooks_Sort(t *testing.T) {
	var got url.Values
	server := jsonServer(t, func(r *http.Request) { got = r.URL.Query() }, map[string]interface{}{
		"results": []interface{}{map[string]interface{}{"id": "pb-1", "overrideCount": 2}}, "totalRecords": 1,
	})
	defer server.Close()

	result, err := newTestQuoteClient(t, server.URL).ListPriceBooks(context.Background(), &ListPriceBooksOptions{
		SortBy: strPtr("overrideCount"), SortDirection: strPtr("desc"),
	})

	require.NoError(t, err)
	assert.Equal(t, url.Values{"sortBy": {"overrideCount"}, "sortDirection": {"desc"}}, got)
	assert.Equal(t, 2, *result.Results[0].OverrideCount)
}

func TestQuoteClient_ListBundles_SeveralCurrenciesAndSort(t *testing.T) {
	var got url.Values
	server := jsonServer(t, func(r *http.Request) { got = r.URL.Query() }, map[string]interface{}{
		"results": []interface{}{map[string]interface{}{
			"id": "b-1", "itemCount": 2, "billingTotals": map[string]interface{}{"monthly": 100, "one-time": 500},
		}},
		"totalRecords": 1,
	})
	defer server.Close()

	result, err := newTestQuoteClient(t, server.URL).ListBundles(context.Background(), &ListBundlesOptions{
		CurrencyCodes: []string{"USD", "EUR"}, SortBy: strPtr("itemCount"), SortDirection: strPtr("asc"),
	})

	require.NoError(t, err)
	assert.Equal(t, url.Values{"currency": {"USD", "EUR"}, "sortBy": {"itemCount"}, "sortDirection": {"asc"}}, got)
	assert.Equal(t, 2, *result.Results[0].ItemCount)
	assert.Equal(t, 500.0, result.Results[0].BillingTotals["one-time"])
}

func TestQuoteClient_ListCompanies_Sort(t *testing.T) {
	var got url.Values
	server := jsonServer(t, func(r *http.Request) { got = r.URL.Query() }, map[string]interface{}{
		"results": []interface{}{map[string]interface{}{"id": "c-1", "email": "ap@acme.test"}}, "totalRecords": 1,
	})
	defer server.Close()

	result, err := newTestQuoteClient(t, server.URL).ListCompanies(context.Background(), &ListCompaniesOptions{
		SortBy: strPtr("contactCount"), SortDirection: strPtr("desc"),
	})

	require.NoError(t, err)
	assert.Equal(t, url.Values{"sortBy": {"contactCount"}, "sortDirection": {"desc"}}, got)
	assert.Equal(t, "ap@acme.test", *result.Results[0].Email)
}

func TestQuoteClient_ListContacts_SeveralCompaniesAndSort(t *testing.T) {
	var got url.Values
	server := jsonServer(t, func(r *http.Request) { got = r.URL.Query() },
		map[string]interface{}{"results": []interface{}{}, "totalRecords": 0})
	defer server.Close()

	_, err := newTestQuoteClient(t, server.URL).ListContacts(context.Background(), &ListContactsOptions{
		CompanyIDs: []string{"c-1", "c-2"}, SortBy: strPtr("name"), SortDirection: strPtr("asc"),
	})

	require.NoError(t, err)
	assert.Equal(t, url.Values{"companyIds": {"c-1", "c-2"}, "sortBy": {"name"}, "sortDirection": {"asc"}}, got)
}

func TestQuoteClient_ListCompanyContacts_SortAndContactCount(t *testing.T) {
	var got url.Values
	server := jsonServer(t, func(r *http.Request) {
		assert.Equal(t, "/v1/companies/c-1/contacts", r.URL.Path)
		got = r.URL.Query()
	}, map[string]interface{}{
		"results": []interface{}{}, "totalRecords": 0, "company": map[string]interface{}{"id": "c-1", "contactCount": 1},
	})
	defer server.Close()

	result, err := newTestQuoteClient(t, server.URL).ListCompanyContacts(context.Background(), "c-1", &ListCompanyContactsOptions{
		SortBy: strPtr("createdOn"), SortDirection: strPtr("desc"),
	})

	require.NoError(t, err)
	assert.Equal(t, url.Values{"sortBy": {"createdOn"}, "sortDirection": {"desc"}}, got)
	require.NotNil(t, result.Company)
	assert.Equal(t, 1, *result.Company.ContactCount)
}

func TestQuoteClient_ListTypes_Sort(t *testing.T) {
	var got url.Values
	server := jsonServer(t, func(r *http.Request) { got = r.URL.Query() },
		map[string]interface{}{"results": []interface{}{}, "totalRecords": 0})
	defer server.Close()

	_, err := newTestQuoteClient(t, server.URL).ListTypes(context.Background(), &ListTypesOptions{
		CategoryType: strPtr("product_category"), SortBy: strPtr("usageCount"), SortDirection: strPtr("desc"),
	})

	require.NoError(t, err)
	assert.Equal(t, url.Values{
		"categoryType": {"product_category"}, "sortBy": {"usageCount"}, "sortDirection": {"desc"},
	}, got)
}

func TestQuoteClient_GetQuoteSummary(t *testing.T) {
	var got url.Values
	server := jsonServer(t, func(r *http.Request) {
		assert.Equal(t, "GET", r.Method)
		assert.Equal(t, "/v1/quotes/summary", r.URL.Path)
		got = r.URL.Query()
	}, map[string]interface{}{"summary": map[string]interface{}{
		"currency": "EUR", "openPipeline": map[string]interface{}{"total": 10, "count": 1},
	}})
	defer server.Close()

	result, err := newTestQuoteClient(t, server.URL).GetQuoteSummary(context.Background(), &QuoteSummaryOptions{
		Currencies: []string{"EUR", "USD"}, SummaryCurrency: strPtr("EUR"),
	})

	require.NoError(t, err)
	assert.Equal(t, url.Values{"currencies": {"EUR", "USD"}, "summaryCurrency": {"EUR"}}, got)
	assert.Equal(t, "EUR", result.CurrencyCode)
	assert.Equal(t, 1, result.OpenPipeline.Count)
}

func TestQuoteClient_ListQuoteCreators(t *testing.T) {
	server := jsonServer(t, func(r *http.Request) {
		assert.Equal(t, "/v1/quotes/creators", r.URL.Path)
	}, map[string]interface{}{"results": []interface{}{
		map[string]interface{}{"id": "u-1", "name": "Ana Lee", "email": "ana@acme.test", "isAPIKey": false, "apiKeyDeleted": false},
		map[string]interface{}{"id": "u-2", "name": "Zapier key", "email": nil, "isAPIKey": true, "apiKeyDeleted": true},
	}})
	defer server.Close()

	result, err := newTestQuoteClient(t, server.URL).ListQuoteCreators(context.Background())

	require.NoError(t, err)
	require.Len(t, result, 2)
	assert.Equal(t, "Ana Lee", result[0].Name)
	assert.Equal(t, "ana@acme.test", *result[0].Email)
	assert.True(t, result[1].IsAPIKey)
	assert.Nil(t, result[1].Email)
	assert.True(t, result[1].APIKeyDeleted)
}

func TestQuoteClient_GetNextQuoteNumber(t *testing.T) {
	server := jsonServer(t, func(r *http.Request) {
		assert.Equal(t, "/v1/quotes/number-config/next", r.URL.Path)
	}, map[string]interface{}{"results": map[string]interface{}{"nextNumber": "Q-2026-0042", "sequence": 42, "canEdit": true}})
	defer server.Close()

	result, err := newTestQuoteClient(t, server.URL).GetNextQuoteNumber(context.Background())

	require.NoError(t, err)
	assert.Equal(t, &NextQuoteNumber{NextNumber: "Q-2026-0042", Sequence: 42, CanEdit: true}, result)
}

func TestQuoteClient_OpenQuotes(t *testing.T) {
	body := map[string]interface{}{
		"results": []interface{}{map[string]interface{}{
			"id": "q-1", "quoteNumber": "Q-1", "name": "Renewal", "status": "sent", "updatedOn": "2026-10-01",
		}},
		"totalRecords": 1,
	}
	t.Run("company", func(t *testing.T) {
		server := jsonServer(t, func(r *http.Request) {
			assert.Equal(t, "/v1/companies/c-1/open-quotes", r.URL.Path)
		}, body)
		defer server.Close()

		result, err := newTestQuoteClient(t, server.URL).GetCompanyOpenQuotes(context.Background(), "c-1")

		require.NoError(t, err)
		assert.Equal(t, 1, result.TotalRecords)
		assert.Equal(t, QuoteStatusSent, result.Results[0].Status)
	})
	t.Run("contact", func(t *testing.T) {
		server := jsonServer(t, func(r *http.Request) {
			assert.Equal(t, "/v1/contacts/ct-1/open-quotes", r.URL.Path)
		}, body)
		defer server.Close()

		result, err := newTestQuoteClient(t, server.URL).GetContactOpenQuotes(context.Background(), "ct-1")

		require.NoError(t, err)
		assert.Equal(t, "Q-1", result.Results[0].QuoteNumber)
	})
}

func TestQuoteClient_GetProductQuoteImages(t *testing.T) {
	server := jsonServer(t, func(r *http.Request) {
		assert.Equal(t, "POST", r.Method)
		assert.Equal(t, "/v1/products/quote-images", r.URL.Path)
		var body map[string][]string
		json.NewDecoder(r.Body).Decode(&body)
		assert.Equal(t, []string{"p-1", "p-2"}, body["productIds"])
	}, map[string]interface{}{"results": map[string]interface{}{
		"p-1": []interface{}{map[string]interface{}{"id": "i-1", "productId": "p-1", "displayOrder": 0}},
		"p-2": []interface{}{},
	}})
	defer server.Close()

	result, err := newTestQuoteClient(t, server.URL).GetProductQuoteImages(context.Background(), []string{"p-1", "p-2"})

	require.NoError(t, err)
	assert.Len(t, result["p-1"], 1)
	assert.Len(t, result["p-2"], 0)
}

func TestQuoteClient_LineItemImages(t *testing.T) {
	t.Run("GetQuoteLineItemImages keys images by line item", func(t *testing.T) {
		server := jsonServer(t, func(r *http.Request) {
			assert.Equal(t, "/v1/quotes/q-1/items/images", r.URL.Path)
		}, map[string]interface{}{"results": map[string]interface{}{
			"li-1": []interface{}{map[string]interface{}{"id": "img-1", "lineItemId": "li-1", "displayOrder": 0}},
		}})
		defer server.Close()

		result, err := newTestQuoteClient(t, server.URL).GetQuoteLineItemImages(context.Background(), "q-1")

		require.NoError(t, err)
		assert.Equal(t, "img-1", result["li-1"][0].ID)
	})

	t.Run("GetLineItemImages returns one item's images", func(t *testing.T) {
		server := jsonServer(t, func(r *http.Request) {
			assert.Equal(t, "/v1/quotes/q-1/items/li-1/images", r.URL.Path)
		}, map[string]interface{}{"results": []interface{}{map[string]interface{}{"id": "img-1", "lineItemId": "li-1"}}})
		defer server.Close()

		result, err := newTestQuoteClient(t, server.URL).GetLineItemImages(context.Background(), "q-1", "li-1")

		require.NoError(t, err)
		assert.Equal(t, "img-1", result[0].ID)
	})

	t.Run("AddLineItemImages uploads 'images' parts with detected types and no data part", func(t *testing.T) {
		server := jsonServer(t, func(r *http.Request) {
			assert.Equal(t, "POST", r.Method)
			assert.Equal(t, "/v1/quotes/q-1/items/li-1/images", r.URL.Path)
			require.NoError(t, r.ParseMultipartForm(10<<20))
			_, hasData := r.MultipartForm.Value["data"]
			assert.False(t, hasData)
			files := r.MultipartForm.File["images"]
			require.Len(t, files, 2)
			assert.Equal(t, "image/png", files[0].Header.Get("Content-Type"))
			assert.Equal(t, "image/jpeg", files[1].Header.Get("Content-Type"))
			f, _ := files[0].Open()
			data, _ := io.ReadAll(f)
			assert.Equal(t, testPNG, data)
		}, map[string]interface{}{"results": []interface{}{map[string]interface{}{"id": "img-1"}, map[string]interface{}{"id": "img-2"}}})
		defer server.Close()

		result, err := newTestQuoteClient(t, server.URL).AddLineItemImages(context.Background(), "q-1", "li-1", []ProductImageInput{
			{Data: testPNG, FileName: "a.png"},
			{Data: testJPEG, FileName: "b.jpg"},
		})

		require.NoError(t, err)
		assert.Len(t, result, 2)
	})

	t.Run("ReorderLineItemImages puts the ids first to last", func(t *testing.T) {
		server := jsonServer(t, func(r *http.Request) {
			assert.Equal(t, "PUT", r.Method)
			assert.Equal(t, "/v1/quotes/q-1/items/li-1/images/order", r.URL.Path)
			var body map[string][]string
			json.NewDecoder(r.Body).Decode(&body)
			assert.Equal(t, []string{"img-2", "img-1"}, body["imageIds"])
		}, map[string]interface{}{"results": []interface{}{map[string]interface{}{"id": "img-2"}, map[string]interface{}{"id": "img-1"}}})
		defer server.Close()

		result, err := newTestQuoteClient(t, server.URL).ReorderLineItemImages(context.Background(), "q-1", "li-1", []string{"img-2", "img-1"})

		require.NoError(t, err)
		assert.Equal(t, "img-2", result[0].ID)
	})

	t.Run("RemoveLineItemImage returns the images left", func(t *testing.T) {
		server := jsonServer(t, func(r *http.Request) {
			assert.Equal(t, "DELETE", r.Method)
			assert.Equal(t, "/v1/quotes/q-1/items/li-1/images/img-1", r.URL.Path)
		}, map[string]interface{}{"results": []interface{}{map[string]interface{}{"id": "img-2"}}})
		defer server.Close()

		result, err := newTestQuoteClient(t, server.URL).RemoveLineItemImage(context.Background(), "q-1", "li-1", "img-1")

		require.NoError(t, err)
		assert.Equal(t, "img-2", result[0].ID)
	})
}

func TestQuoteClient_DuplicatesTakeAName(t *testing.T) {
	cases := []struct {
		name string
		path string
		call func(c *QuoteClient, opts ...DuplicateOptions) (string, error)
	}{
		{"DuplicateQuote", "/v1/quotes/x-1/duplicate", func(c *QuoteClient, opts ...DuplicateOptions) (string, error) {
			r, err := c.DuplicateQuote(context.Background(), "x-1", opts...)
			if err != nil {
				return "", err
			}
			return r.ID, nil
		}},
		{"DuplicateProduct", "/v1/products/x-1/duplicate", func(c *QuoteClient, opts ...DuplicateOptions) (string, error) {
			r, err := c.DuplicateProduct(context.Background(), "x-1", opts...)
			if err != nil {
				return "", err
			}
			return r.ID, nil
		}},
		{"DuplicatePriceBook", "/v1/pricebooks/x-1/duplicate", func(c *QuoteClient, opts ...DuplicateOptions) (string, error) {
			r, err := c.DuplicatePriceBook(context.Background(), "x-1", opts...)
			if err != nil {
				return "", err
			}
			return r.ID, nil
		}},
		{"DuplicateBundle", "/v1/bundles/x-1/duplicate", func(c *QuoteClient, opts ...DuplicateOptions) (string, error) {
			r, err := c.DuplicateBundle(context.Background(), "x-1", opts...)
			if err != nil {
				return "", err
			}
			return r.ID, nil
		}},
	}
	for _, tc := range cases {
		t.Run(tc.name+" sends the name", func(t *testing.T) {
			var body []byte
			server := jsonServer(t, func(r *http.Request) {
				assert.Equal(t, tc.path, r.URL.Path)
				body, _ = io.ReadAll(r.Body)
			}, map[string]interface{}{"result": map[string]interface{}{"id": "x-2"}})
			defer server.Close()

			id, err := tc.call(newTestQuoteClient(t, server.URL), DuplicateOptions{Name: "Q4 copy"})

			require.NoError(t, err)
			assert.Equal(t, "x-2", id)
			assert.JSONEq(t, `{"name":"Q4 copy"}`, string(body))
		})
		t.Run(tc.name+" without a name sends no body", func(t *testing.T) {
			var body []byte
			server := jsonServer(t, func(r *http.Request) { body, _ = io.ReadAll(r.Body) },
				map[string]interface{}{"result": map[string]interface{}{"id": "x-2"}})
			defer server.Close()

			_, err := tc.call(newTestQuoteClient(t, server.URL))

			require.NoError(t, err)
			assert.Empty(t, body)
		})
	}
}

func TestQuoteClient_CompanyEmailAndPriceBookReset(t *testing.T) {
	t.Run("CreateCompany sends the email", func(t *testing.T) {
		var body map[string]interface{}
		server := jsonServer(t, func(r *http.Request) { json.NewDecoder(r.Body).Decode(&body) },
			map[string]interface{}{"result": map[string]interface{}{"id": "c-1"}})
		defer server.Close()

		_, err := newTestQuoteClient(t, server.URL).CreateCompany(context.Background(), &CreateCompanyRequest{
			Name: "Acme", Email: strPtr("ap@acme.test"),
			Contacts: []CreateCompanyContactInput{{Name: "Ana", Email: "ana@acme.test"}},
		})

		require.NoError(t, err)
		assert.Equal(t, "ap@acme.test", body["email"])
	})

	t.Run("UpdateCompany ClearEmail sends an explicit null", func(t *testing.T) {
		var body []byte
		server := jsonServer(t, func(r *http.Request) { body, _ = io.ReadAll(r.Body) },
			map[string]interface{}{"result": map[string]interface{}{"id": "c-1"}})
		defer server.Close()

		req := &UpdateCompanyRequest{}
		req.ClearEmail()
		_, err := newTestQuoteClient(t, server.URL).UpdateCompany(context.Background(), "c-1", req)

		require.NoError(t, err)
		assert.JSONEq(t, `{"email":null}`, string(body))
	})

	t.Run("UpdatePriceBook sends resetProductPricing", func(t *testing.T) {
		var body []byte
		server := jsonServer(t, func(r *http.Request) { body, _ = io.ReadAll(r.Body) },
			map[string]interface{}{"result": map[string]interface{}{"id": "pb-1"}})
		defer server.Close()

		yes := true
		_, err := newTestQuoteClient(t, server.URL).UpdatePriceBook(context.Background(), "pb-1", &UpdatePriceBookRequest{
			ResetProductPricing: &yes,
		})

		require.NoError(t, err)
		assert.JSONEq(t, `{"resetProductPricing":true}`, string(body))
	})
}

func TestQuoteClient_DeleteSentQuoteIsAConflict(t *testing.T) {
	message := "A sent quote can't be deleted. Void it instead."
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusConflict)
		json.NewEncoder(w).Encode(map[string]interface{}{
			"message": message,
			"error":   map[string]interface{}{"message": message, "code": "CANNOT_DELETE_SENT_QUOTE"},
			"data":    map[string]interface{}{},
		})
	}))
	defer server.Close()

	_, err := newTestQuoteClient(t, server.URL).DeleteQuote(context.Background(), "q-1")

	var conflict *ConflictError
	require.ErrorAs(t, err, &conflict)
	assert.Equal(t, 409, conflict.StatusCode)
	assert.Equal(t, "CANNOT_DELETE_SENT_QUOTE", conflict.Code)
	assert.Equal(t, message, conflict.Message)
}
