package com.turbodocx;

import com.google.gson.JsonArray;
import com.google.gson.JsonElement;
import com.google.gson.JsonNull;
import com.google.gson.JsonObject;
import com.google.gson.JsonPrimitive;

import java.util.Arrays;
import java.util.HashSet;
import java.util.Map;
import java.util.Set;

/**
 * Response normalizer for MySQL type coercion.
 *
 * MySQL returns tinyint(1) as 0/1 and decimal columns as strings.
 * This normalizer converts them to proper boolean/number types so SDK
 * consumers get the types declared in the Java model classes.
 *
 * Operates on Gson JsonElement trees (deep-copies first, never mutates input).
 */
public class ResponseNormalizer {

    private static final Set<String> BOOLEAN_FIELDS = new HashSet<>(Arrays.asList(
            "isActive",
            "isDefault",
            "showInCatalog",
            "showInQuoteBuilder",
            "showItemsToEndUser",
            "syncWithProducts",
            "isPrimaryAdmin",
            "canManageOrgs",
            "canManageOrgUsers",
            "canManagePartnerUsers",
            "canManageOrgAPIKeys",
            "canManagePartnerAPIKeys",
            "canUpdateEntitlements",
            "canViewAuditLogs",
            "hasFileDownload",
            "hasGDrive",
            "hasWrike",
            "hasSalesforce",
            "hasConnectWise",
            "rdWatermark",
            "hasKnowledgeBase",
            "hasAI",
            "hasTurboSign",
            "hasTurboQuote"
    ));

    private static final Set<String> DECIMAL_FIELDS = new HashSet<>(Arrays.asList(
            "listPrice",
            "cost",
            "unitPrice",
            "discountPercent",
            "subtotal",
            "grandTotal",
            "subtotalMonthly",
            "subtotalQuarterly",
            "subtotalAnnual",
            "subtotalOneTime",
            "taxAmount",
            "taxRate",
            "bundleDiscountPercent",
            "totalListPrice",
            "totalFinalPrice",
            "totalCost",
            "finalPrice",
            "marginPercent"
    ));

    /**
     * Normalize a JsonElement, converting MySQL tinyint booleans and decimal strings.
     * Returns a deep-copy; the input is never mutated.
     */
    public static JsonElement normalize(JsonElement element) {
        if (element == null || element.isJsonNull()) {
            return element;
        }
        if (element.isJsonPrimitive()) {
            return element;
        }
        if (element.isJsonArray()) {
            return normalizeArray(element.getAsJsonArray());
        }
        if (element.isJsonObject()) {
            return normalizeObject(element.getAsJsonObject());
        }
        return element;
    }

    private static JsonArray normalizeArray(JsonArray array) {
        JsonArray result = new JsonArray();
        for (JsonElement item : array) {
            result.add(normalize(item));
        }
        return result;
    }

    private static JsonObject normalizeObject(JsonObject obj) {
        JsonObject result = new JsonObject();
        for (Map.Entry<String, JsonElement> entry : obj.entrySet()) {
            String key = entry.getKey();
            JsonElement value = entry.getValue();

            if (value == null || value.isJsonNull()) {
                result.add(key, value);
            } else if (BOOLEAN_FIELDS.contains(key) && value.isJsonPrimitive() && value.getAsJsonPrimitive().isNumber()) {
                int intVal = value.getAsInt();
                if (intVal == 0 || intVal == 1) {
                    result.add(key, new JsonPrimitive(intVal == 1));
                } else {
                    result.add(key, value);
                }
            } else if (DECIMAL_FIELDS.contains(key) && value.isJsonPrimitive() && value.getAsJsonPrimitive().isString()) {
                String strVal = value.getAsString();
                try {
                    double parsed = Double.parseDouble(strVal);
                    result.add(key, new JsonPrimitive(parsed));
                } catch (NumberFormatException e) {
                    result.add(key, value);
                }
            } else if (value.isJsonObject() || value.isJsonArray()) {
                result.add(key, normalize(value));
            } else {
                result.add(key, value);
            }
        }
        return result;
    }
}
