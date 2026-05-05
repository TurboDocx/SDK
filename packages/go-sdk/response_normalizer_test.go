package turbodocx

import (
	"encoding/json"
	"strings"
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

// parseJSON decodes a JSON string using UseNumber (mirroring handleResponse) so
// integers arrive as json.Number, not float64.
func parseJSON(t *testing.T, s string) interface{} {
	t.Helper()
	var v interface{}
	dec := json.NewDecoder(strings.NewReader(s))
	dec.UseNumber()
	require.NoError(t, dec.Decode(&v))
	return v
}

// =============================================
// Boolean Coercion (MySQL tinyint)
// =============================================

func TestNormalizeBooleanCoercion(t *testing.T) {
	t.Run("should convert 0 to false for known boolean fields", func(t *testing.T) {
		input := parseJSON(t, `{"isActive": 0, "isDefault": 0, "showInCatalog": 0}`)
		result := normalizeValue(input).(map[string]interface{})
		assert.Equal(t, false, result["isActive"])
		assert.Equal(t, false, result["isDefault"])
		assert.Equal(t, false, result["showInCatalog"])
	})

	t.Run("should convert 1 to true for known boolean fields", func(t *testing.T) {
		input := parseJSON(t, `{"isActive": 1, "isDefault": 1, "showInCatalog": 1}`)
		result := normalizeValue(input).(map[string]interface{})
		assert.Equal(t, true, result["isActive"])
		assert.Equal(t, true, result["isDefault"])
		assert.Equal(t, true, result["showInCatalog"])
	})

	t.Run("should handle all known boolean fields", func(t *testing.T) {
		input := parseJSON(t, `{
			"isActive": 1, "isDefault": 0, "showInCatalog": 1,
			"showInQuoteBuilder": 0, "showItemsToEndUser": 1,
			"syncWithProducts": 0, "isPrimaryAdmin": 1,
			"canManageOrgs": 1, "canManageUsers": 0,
			"canManageBilling": 1, "canViewAuditLog": 0,
			"hasFileDownload": 1, "hasGDrive": 0, "rdWatermark": 1
		}`)
		result := normalizeValue(input).(map[string]interface{})
		assert.Equal(t, true, result["isActive"])
		assert.Equal(t, false, result["isDefault"])
		assert.Equal(t, true, result["showInCatalog"])
		assert.Equal(t, false, result["showInQuoteBuilder"])
		assert.Equal(t, true, result["showItemsToEndUser"])
		assert.Equal(t, false, result["syncWithProducts"])
		assert.Equal(t, true, result["isPrimaryAdmin"])
		assert.Equal(t, true, result["canManageOrgs"])
		assert.Equal(t, false, result["canManageUsers"])
		assert.Equal(t, true, result["canManageBilling"])
		assert.Equal(t, false, result["canViewAuditLog"])
		assert.Equal(t, true, result["hasFileDownload"])
		assert.Equal(t, false, result["hasGDrive"])
		assert.Equal(t, true, result["rdWatermark"])
	})

	t.Run("should leave actual booleans unchanged", func(t *testing.T) {
		input := parseJSON(t, `{"isActive": true, "isDefault": false}`)
		result := normalizeValue(input).(map[string]interface{})
		assert.Equal(t, true, result["isActive"])
		assert.Equal(t, false, result["isDefault"])
	})

	t.Run("should not convert non-boolean fields that happen to be 0 or 1", func(t *testing.T) {
		input := parseJSON(t, `{"quantity": 1, "offset": 0, "name": "test"}`)
		result := normalizeValue(input).(map[string]interface{})
		assert.Equal(t, json.Number("1"), result["quantity"])
		assert.Equal(t, json.Number("0"), result["offset"])
		assert.Equal(t, "test", result["name"])
	})
}

// =============================================
// Decimal Coercion (MySQL decimal strings)
// =============================================

func TestNormalizeDecimalCoercion(t *testing.T) {
	t.Run("should convert string decimals to float64 for known numeric fields", func(t *testing.T) {
		input := parseJSON(t, `{"listPrice": "99.99", "cost": "50.00", "unitPrice": "25.50"}`)
		result := normalizeValue(input).(map[string]interface{})
		assert.Equal(t, 99.99, result["listPrice"])
		assert.Equal(t, 50.0, result["cost"])
		assert.Equal(t, 25.5, result["unitPrice"])
	})

	t.Run("should handle all known decimal fields", func(t *testing.T) {
		input := parseJSON(t, `{
			"listPrice": "100.00", "cost": "50.00", "unitPrice": "75.50",
			"discountPercent": "10.00", "subtotal": "67.95",
			"grandTotal": "1234.56", "subtotalMonthly": "500.00",
			"subtotalQuarterly": "1500.00", "subtotalAnnual": "6000.00",
			"subtotalOneTime": "200.00", "taxAmount": "48.00",
			"taxRate": "8.50", "bundleDiscountPercent": "15.00",
			"totalListPrice": "1000.00", "totalFinalPrice": "850.00",
			"totalCost": "400.00", "finalPrice": "85.00",
			"marginPercent": "45.00"
		}`)
		result := normalizeValue(input).(map[string]interface{})
		assert.Equal(t, 100.0, result["listPrice"])
		assert.Equal(t, 50.0, result["cost"])
		assert.Equal(t, 75.5, result["unitPrice"])
		assert.Equal(t, 10.0, result["discountPercent"])
		assert.Equal(t, 67.95, result["subtotal"])
		assert.Equal(t, 1234.56, result["grandTotal"])
		assert.Equal(t, 500.0, result["subtotalMonthly"])
		assert.Equal(t, 1500.0, result["subtotalQuarterly"])
		assert.Equal(t, 6000.0, result["subtotalAnnual"])
		assert.Equal(t, 200.0, result["subtotalOneTime"])
		assert.Equal(t, 48.0, result["taxAmount"])
		assert.Equal(t, 8.5, result["taxRate"])
		assert.Equal(t, 15.0, result["bundleDiscountPercent"])
		assert.Equal(t, 1000.0, result["totalListPrice"])
		assert.Equal(t, 850.0, result["totalFinalPrice"])
		assert.Equal(t, 400.0, result["totalCost"])
		assert.Equal(t, 85.0, result["finalPrice"])
		assert.Equal(t, 45.0, result["marginPercent"])
	})

	t.Run("should leave actual numbers unchanged", func(t *testing.T) {
		input := parseJSON(t, `{"listPrice": 99.99, "quantity": 5}`)
		result := normalizeValue(input).(map[string]interface{})
		// When decoded with UseNumber, numbers stay as json.Number
		// but decimal fields should remain unchanged when already numeric
		// coerceDecimal only converts strings, so json.Number passes through
		assert.Equal(t, json.Number("99.99"), result["listPrice"])
		assert.Equal(t, json.Number("5"), result["quantity"])
	})

	t.Run("should handle null decimal fields", func(t *testing.T) {
		input := parseJSON(t, `{"cost": null, "taxRate": null, "marginPercent": null}`)
		result := normalizeValue(input).(map[string]interface{})
		assert.Nil(t, result["cost"])
		assert.Nil(t, result["taxRate"])
		assert.Nil(t, result["marginPercent"])
	})

	t.Run("should not convert non-numeric string fields", func(t *testing.T) {
		input := parseJSON(t, `{"name": "99.99", "quoteNumber": "Q-2026-00001", "status": "draft"}`)
		result := normalizeValue(input).(map[string]interface{})
		assert.Equal(t, "99.99", result["name"])
		assert.Equal(t, "Q-2026-00001", result["quoteNumber"])
		assert.Equal(t, "draft", result["status"])
	})

	t.Run("should leave non-parseable strings in decimal fields unchanged", func(t *testing.T) {
		input := parseJSON(t, `{"listPrice": "not-a-number"}`)
		result := normalizeValue(input).(map[string]interface{})
		assert.Equal(t, "not-a-number", result["listPrice"])
	})
}

// =============================================
// Nested Objects
// =============================================

func TestNormalizeNestedObjects(t *testing.T) {
	t.Run("should normalize fields in nested objects", func(t *testing.T) {
		input := parseJSON(t, `{
			"id": "q-1",
			"isActive": 1,
			"grandTotal": "500.00",
			"company": {
				"id": "c-1",
				"isActive": 1,
				"name": "Acme"
			},
			"contact": {
				"id": "ct-1",
				"isActive": 0
			}
		}`)
		result := normalizeValue(input).(map[string]interface{})
		assert.Equal(t, true, result["isActive"])
		assert.Equal(t, 500.0, result["grandTotal"])

		company := result["company"].(map[string]interface{})
		assert.Equal(t, true, company["isActive"])
		assert.Equal(t, "Acme", company["name"])

		contact := result["contact"].(map[string]interface{})
		assert.Equal(t, false, contact["isActive"])
	})

	t.Run("should normalize deeply nested objects", func(t *testing.T) {
		input := parseJSON(t, `{
			"items": [{
				"id": "li-1",
				"isActive": 1,
				"unitPrice": "50.00",
				"showItemsToEndUser": 0,
				"product": {
					"id": "p-1",
					"isActive": 1,
					"listPrice": "100.00",
					"showInCatalog": 1
				}
			}]
		}`)
		result := normalizeValue(input).(map[string]interface{})
		items := result["items"].([]interface{})
		item := items[0].(map[string]interface{})
		assert.Equal(t, true, item["isActive"])
		assert.Equal(t, 50.0, item["unitPrice"])
		assert.Equal(t, false, item["showItemsToEndUser"])

		product := item["product"].(map[string]interface{})
		assert.Equal(t, true, product["isActive"])
		assert.Equal(t, 100.0, product["listPrice"])
		assert.Equal(t, true, product["showInCatalog"])
	})
}

// =============================================
// Arrays
// =============================================

func TestNormalizeArrays(t *testing.T) {
	t.Run("should normalize objects inside arrays", func(t *testing.T) {
		input := parseJSON(t, `[
			{"id": "1", "isActive": 1, "listPrice": "10.00"},
			{"id": "2", "isActive": 0, "listPrice": "20.00"}
		]`)
		result := normalizeValue(input).([]interface{})
		first := result[0].(map[string]interface{})
		second := result[1].(map[string]interface{})
		assert.Equal(t, true, first["isActive"])
		assert.Equal(t, 10.0, first["listPrice"])
		assert.Equal(t, false, second["isActive"])
		assert.Equal(t, 20.0, second["listPrice"])
	})

	t.Run("should handle results array pattern", func(t *testing.T) {
		input := parseJSON(t, `{
			"results": [
				{"id": "1", "isActive": 1, "grandTotal": "100.00"},
				{"id": "2", "isActive": 0, "grandTotal": "200.00"}
			],
			"totalRecords": 2
		}`)
		result := normalizeValue(input).(map[string]interface{})
		results := result["results"].([]interface{})
		first := results[0].(map[string]interface{})
		second := results[1].(map[string]interface{})
		assert.Equal(t, true, first["isActive"])
		assert.Equal(t, 100.0, first["grandTotal"])
		assert.Equal(t, false, second["isActive"])
		assert.Equal(t, 200.0, second["grandTotal"])
		assert.Equal(t, json.Number("2"), result["totalRecords"])
	})
}

// =============================================
// Edge Cases
// =============================================

func TestNormalizeEdgeCases(t *testing.T) {
	t.Run("should return primitives unchanged", func(t *testing.T) {
		assert.Equal(t, "hello", normalizeValue("hello"))
		assert.Equal(t, json.Number("42"), normalizeValue(json.Number("42")))
		assert.Nil(t, normalizeValue(nil))
	})

	t.Run("should handle empty objects", func(t *testing.T) {
		input := parseJSON(t, `{}`)
		result := normalizeValue(input).(map[string]interface{})
		assert.Empty(t, result)
	})

	t.Run("should handle empty arrays", func(t *testing.T) {
		input := parseJSON(t, `[]`)
		result := normalizeValue(input).([]interface{})
		assert.Empty(t, result)
	})

	t.Run("should not mutate the original map", func(t *testing.T) {
		input := parseJSON(t, `{"isActive": 1, "listPrice": "99.99"}`)
		original := input.(map[string]interface{})
		result := normalizeValue(input).(map[string]interface{})
		// Original should still be json.Number
		assert.Equal(t, json.Number("1"), original["isActive"])
		assert.Equal(t, "99.99", original["listPrice"])
		// Result should be coerced
		assert.Equal(t, true, result["isActive"])
		assert.Equal(t, 99.99, result["listPrice"])
	})
}
