package turbodocx

import (
	"encoding/json"
	"strconv"
)

// booleanFields are MySQL tinyint(1) fields that should be coerced from 0/1 to bool.
var booleanFields = map[string]bool{
	"isActive":             true,
	"isDefault":            true,
	"showInCatalog":        true,
	"showInQuoteBuilder":   true,
	"showItemsToEndUser":   true,
	"syncWithProducts":     true,
	"isPrimaryAdmin":       true,
	"canManageOrgs":        true,
	"canManageUsers":       true,
	"canManageBilling":     true,
	"canViewAuditLog":      true,
	"canManageApiKeys":     true,
	"canManageEntitlements": true,
	"hasFileDownload":      true,
	"hasGDrive":            true,
	"hasWrike":             true,
	"hasSalesforce":        true,
	"hasConnectWise":       true,
	"rdWatermark":          true,
	"hasKnowledgeBase":     true,
	"hasAI":               true,
	"hasTurboSign":         true,
	"hasTurboQuote":        true,
}

// decimalFields are MySQL decimal columns that may arrive as strings and need coercion to float64.
var decimalFields = map[string]bool{
	"listPrice":             true,
	"cost":                  true,
	"unitPrice":             true,
	"discountPercent":       true,
	"subtotal":              true,
	"grandTotal":            true,
	"subtotalMonthly":       true,
	"subtotalQuarterly":     true,
	"subtotalAnnual":        true,
	"subtotalOneTime":       true,
	"taxAmount":             true,
	"taxRate":               true,
	"bundleDiscountPercent": true,
	"totalListPrice":        true,
	"totalFinalPrice":       true,
	"totalCost":             true,
	"finalPrice":            true,
	"marginPercent":         true,
}

// normalizeValue recursively walks an interface{} tree (decoded with UseNumber)
// and coerces known boolean fields from 0/1 to bool and known decimal fields
// from string to float64.
func normalizeValue(data interface{}) interface{} {
	switch v := data.(type) {
	case map[string]interface{}:
		return normalizeMap(v)
	case []interface{}:
		return normalizeSlice(v)
	default:
		return data
	}
}

// normalizeMap walks a map and normalizes known fields.
func normalizeMap(m map[string]interface{}) map[string]interface{} {
	result := make(map[string]interface{}, len(m))
	for key, value := range m {
		if value == nil {
			result[key] = nil
			continue
		}

		if booleanFields[key] {
			result[key] = coerceBool(value)
			continue
		}

		if decimalFields[key] {
			result[key] = coerceDecimal(value)
			continue
		}

		// Recurse into nested structures
		result[key] = normalizeValue(value)
	}
	return result
}

// normalizeSlice normalizes each element of a slice.
func normalizeSlice(s []interface{}) []interface{} {
	result := make([]interface{}, len(s))
	for i, item := range s {
		result[i] = normalizeValue(item)
	}
	return result
}

// coerceBool converts 0/1 (json.Number) to bool. Leaves actual bools and other types unchanged.
func coerceBool(v interface{}) interface{} {
	switch val := v.(type) {
	case json.Number:
		n, err := val.Int64()
		if err == nil && (n == 0 || n == 1) {
			return n == 1
		}
		return v
	case float64:
		if val == 0 || val == 1 {
			return val == 1
		}
		return v
	default:
		return v
	}
}

// coerceDecimal converts string decimal values to float64. Leaves numbers and other types unchanged.
func coerceDecimal(v interface{}) interface{} {
	switch val := v.(type) {
	case string:
		f, err := strconv.ParseFloat(val, 64)
		if err != nil {
			return v // not a valid number string, leave as-is
		}
		return f
	default:
		return v
	}
}
