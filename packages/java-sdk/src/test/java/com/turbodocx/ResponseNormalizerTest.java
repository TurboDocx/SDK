package com.turbodocx;

import com.google.gson.*;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Response Normalizer Tests
 *
 * MySQL returns tinyint(1) as 0/1 and decimal columns as strings.
 * The normalizer coerces these to proper boolean/number types so SDK
 * consumers always get the types declared in the Java model classes.
 */
class ResponseNormalizerTest {

    private final Gson gson = new Gson();

    // ============================================
    // Boolean coercion (MySQL tinyint)
    // ============================================

    @Nested
    @DisplayName("boolean coercion (MySQL tinyint)")
    class BooleanCoercion {

        @Test
        @DisplayName("should convert 0 to false for known boolean fields")
        void convertZeroToFalse() {
            JsonObject input = new JsonObject();
            input.addProperty("isActive", 0);
            input.addProperty("isDefault", 0);
            input.addProperty("showInCatalog", 0);

            JsonObject result = ResponseNormalizer.normalize(input).getAsJsonObject();

            assertFalse(result.get("isActive").getAsBoolean());
            assertFalse(result.get("isDefault").getAsBoolean());
            assertFalse(result.get("showInCatalog").getAsBoolean());
        }

        @Test
        @DisplayName("should convert 1 to true for known boolean fields")
        void convertOneToTrue() {
            JsonObject input = new JsonObject();
            input.addProperty("isActive", 1);
            input.addProperty("isDefault", 1);
            input.addProperty("showInCatalog", 1);

            JsonObject result = ResponseNormalizer.normalize(input).getAsJsonObject();

            assertTrue(result.get("isActive").getAsBoolean());
            assertTrue(result.get("isDefault").getAsBoolean());
            assertTrue(result.get("showInCatalog").getAsBoolean());
        }

        @Test
        @DisplayName("should handle all known boolean fields")
        void handleAllBooleanFields() {
            JsonObject input = new JsonObject();
            input.addProperty("isActive", 1);
            input.addProperty("isDefault", 0);
            input.addProperty("showInCatalog", 1);
            input.addProperty("showInQuoteBuilder", 0);
            input.addProperty("showItemsToEndUser", 1);
            input.addProperty("syncWithProducts", 0);
            input.addProperty("isPrimaryAdmin", 1);
            input.addProperty("canManageOrgs", 1);
            input.addProperty("canManageOrgUsers", 0);
            input.addProperty("canManagePartnerUsers", 1);
            input.addProperty("canManageOrgAPIKeys", 0);
            input.addProperty("canManagePartnerAPIKeys", 1);
            input.addProperty("canUpdateEntitlements", 0);
            input.addProperty("canViewAuditLogs", 1);
            input.addProperty("hasFileDownload", 1);
            input.addProperty("hasGDrive", 0);
            input.addProperty("rdWatermark", 1);

            JsonObject result = ResponseNormalizer.normalize(input).getAsJsonObject();

            assertTrue(result.get("isActive").getAsBoolean());
            assertFalse(result.get("isDefault").getAsBoolean());
            assertTrue(result.get("showInCatalog").getAsBoolean());
            assertFalse(result.get("showInQuoteBuilder").getAsBoolean());
            assertTrue(result.get("showItemsToEndUser").getAsBoolean());
            assertFalse(result.get("syncWithProducts").getAsBoolean());
            assertTrue(result.get("isPrimaryAdmin").getAsBoolean());
            assertTrue(result.get("canManageOrgs").getAsBoolean());
            assertFalse(result.get("canManageOrgUsers").getAsBoolean());
            assertTrue(result.get("canManagePartnerUsers").getAsBoolean());
            assertFalse(result.get("canManageOrgAPIKeys").getAsBoolean());
            assertTrue(result.get("canManagePartnerAPIKeys").getAsBoolean());
            assertFalse(result.get("canUpdateEntitlements").getAsBoolean());
            assertTrue(result.get("canViewAuditLogs").getAsBoolean());
            assertTrue(result.get("hasFileDownload").getAsBoolean());
            assertFalse(result.get("hasGDrive").getAsBoolean());
            assertTrue(result.get("rdWatermark").getAsBoolean());
        }

        @Test
        @DisplayName("should leave actual booleans unchanged")
        void leaveBooleansUnchanged() {
            JsonObject input = new JsonObject();
            input.addProperty("isActive", true);
            input.addProperty("isDefault", false);

            JsonObject result = ResponseNormalizer.normalize(input).getAsJsonObject();

            assertTrue(result.get("isActive").getAsBoolean());
            assertFalse(result.get("isDefault").getAsBoolean());
        }

        @Test
        @DisplayName("should not convert non-boolean fields that happen to be 0 or 1")
        void doNotConvertNonBooleanFields() {
            JsonObject input = new JsonObject();
            input.addProperty("quantity", 1);
            input.addProperty("offset", 0);
            input.addProperty("name", "test");

            JsonObject result = ResponseNormalizer.normalize(input).getAsJsonObject();

            assertEquals(1, result.get("quantity").getAsInt());
            assertEquals(0, result.get("offset").getAsInt());
            assertEquals("test", result.get("name").getAsString());
        }
    }

    // ============================================
    // Decimal coercion (MySQL decimal strings)
    // ============================================

    @Nested
    @DisplayName("decimal coercion (MySQL decimal strings)")
    class DecimalCoercion {

        @Test
        @DisplayName("should convert string decimals to numbers for known numeric fields")
        void convertStringDecimalsToNumbers() {
            JsonObject input = new JsonObject();
            input.addProperty("listPrice", "99.99");
            input.addProperty("cost", "50.00");
            input.addProperty("unitPrice", "25.50");

            JsonObject result = ResponseNormalizer.normalize(input).getAsJsonObject();

            assertEquals(99.99, result.get("listPrice").getAsDouble(), 0.001);
            assertEquals(50.0, result.get("cost").getAsDouble(), 0.001);
            assertEquals(25.5, result.get("unitPrice").getAsDouble(), 0.001);
        }

        @Test
        @DisplayName("should handle all known decimal fields")
        void handleAllDecimalFields() {
            JsonObject input = new JsonObject();
            input.addProperty("listPrice", "100.00");
            input.addProperty("cost", "50.00");
            input.addProperty("unitPrice", "75.50");
            input.addProperty("discountPercent", "10.00");
            input.addProperty("subtotal", "67.95");
            input.addProperty("grandTotal", "1234.56");
            input.addProperty("subtotalMonthly", "500.00");
            input.addProperty("subtotalQuarterly", "1500.00");
            input.addProperty("subtotalAnnual", "6000.00");
            input.addProperty("subtotalOneTime", "200.00");
            input.addProperty("taxAmount", "48.00");
            input.addProperty("taxRate", "8.50");
            input.addProperty("bundleDiscountPercent", "15.00");
            input.addProperty("totalListPrice", "1000.00");
            input.addProperty("totalFinalPrice", "850.00");
            input.addProperty("totalCost", "400.00");
            input.addProperty("finalPrice", "85.00");
            input.addProperty("marginPercent", "45.00");

            JsonObject result = ResponseNormalizer.normalize(input).getAsJsonObject();

            assertEquals(100.0, result.get("listPrice").getAsDouble(), 0.001);
            assertEquals(50.0, result.get("cost").getAsDouble(), 0.001);
            assertEquals(75.5, result.get("unitPrice").getAsDouble(), 0.001);
            assertEquals(10.0, result.get("discountPercent").getAsDouble(), 0.001);
            assertEquals(67.95, result.get("subtotal").getAsDouble(), 0.001);
            assertEquals(1234.56, result.get("grandTotal").getAsDouble(), 0.001);
            assertEquals(500.0, result.get("subtotalMonthly").getAsDouble(), 0.001);
            assertEquals(1500.0, result.get("subtotalQuarterly").getAsDouble(), 0.001);
            assertEquals(6000.0, result.get("subtotalAnnual").getAsDouble(), 0.001);
            assertEquals(200.0, result.get("subtotalOneTime").getAsDouble(), 0.001);
            assertEquals(48.0, result.get("taxAmount").getAsDouble(), 0.001);
            assertEquals(8.5, result.get("taxRate").getAsDouble(), 0.001);
            assertEquals(15.0, result.get("bundleDiscountPercent").getAsDouble(), 0.001);
            assertEquals(1000.0, result.get("totalListPrice").getAsDouble(), 0.001);
            assertEquals(850.0, result.get("totalFinalPrice").getAsDouble(), 0.001);
            assertEquals(400.0, result.get("totalCost").getAsDouble(), 0.001);
            assertEquals(85.0, result.get("finalPrice").getAsDouble(), 0.001);
            assertEquals(45.0, result.get("marginPercent").getAsDouble(), 0.001);
        }

        @Test
        @DisplayName("should leave actual numbers unchanged")
        void leaveNumbersUnchanged() {
            JsonObject input = new JsonObject();
            input.addProperty("listPrice", 99.99);
            input.addProperty("quantity", 5);

            JsonObject result = ResponseNormalizer.normalize(input).getAsJsonObject();

            assertEquals(99.99, result.get("listPrice").getAsDouble(), 0.001);
            assertEquals(5, result.get("quantity").getAsInt());
        }

        @Test
        @DisplayName("should handle null decimal fields")
        void handleNullDecimalFields() {
            JsonObject input = new JsonObject();
            input.add("cost", JsonNull.INSTANCE);
            input.add("taxRate", JsonNull.INSTANCE);
            input.add("marginPercent", JsonNull.INSTANCE);

            JsonObject result = ResponseNormalizer.normalize(input).getAsJsonObject();

            assertTrue(result.get("cost").isJsonNull());
            assertTrue(result.get("taxRate").isJsonNull());
            assertTrue(result.get("marginPercent").isJsonNull());
        }

        @Test
        @DisplayName("should not convert non-numeric string fields")
        void doNotConvertNonNumericStrings() {
            JsonObject input = new JsonObject();
            input.addProperty("name", "99.99");
            input.addProperty("quoteNumber", "Q-2026-00001");
            input.addProperty("status", "draft");

            JsonObject result = ResponseNormalizer.normalize(input).getAsJsonObject();

            assertEquals("99.99", result.get("name").getAsString());
            assertEquals("Q-2026-00001", result.get("quoteNumber").getAsString());
            assertEquals("draft", result.get("status").getAsString());
        }
    }

    // ============================================
    // Nested objects
    // ============================================

    @Nested
    @DisplayName("nested objects")
    class NestedObjects {

        @Test
        @DisplayName("should normalize fields in nested objects")
        void normalizeNestedObjects() {
            JsonObject company = new JsonObject();
            company.addProperty("id", "c-1");
            company.addProperty("isActive", 1);
            company.addProperty("name", "Acme");

            JsonObject contact = new JsonObject();
            contact.addProperty("id", "ct-1");
            contact.addProperty("isActive", 0);

            JsonObject input = new JsonObject();
            input.addProperty("id", "q-1");
            input.addProperty("isActive", 1);
            input.addProperty("grandTotal", "500.00");
            input.add("company", company);
            input.add("contact", contact);

            JsonObject result = ResponseNormalizer.normalize(input).getAsJsonObject();

            assertTrue(result.get("isActive").getAsBoolean());
            assertEquals(500.0, result.get("grandTotal").getAsDouble(), 0.001);
            assertTrue(result.getAsJsonObject("company").get("isActive").getAsBoolean());
            assertEquals("Acme", result.getAsJsonObject("company").get("name").getAsString());
            assertFalse(result.getAsJsonObject("contact").get("isActive").getAsBoolean());
        }

        @Test
        @DisplayName("should normalize deeply nested objects")
        void normalizeDeeplyNestedObjects() {
            JsonObject product = new JsonObject();
            product.addProperty("id", "p-1");
            product.addProperty("isActive", 1);
            product.addProperty("listPrice", "100.00");
            product.addProperty("showInCatalog", 1);

            JsonObject item = new JsonObject();
            item.addProperty("id", "li-1");
            item.addProperty("isActive", 1);
            item.addProperty("unitPrice", "50.00");
            item.addProperty("showItemsToEndUser", 0);
            item.add("product", product);

            JsonArray items = new JsonArray();
            items.add(item);

            JsonObject input = new JsonObject();
            input.add("items", items);

            JsonObject result = ResponseNormalizer.normalize(input).getAsJsonObject();
            JsonObject resultItem = result.getAsJsonArray("items").get(0).getAsJsonObject();

            assertTrue(resultItem.get("isActive").getAsBoolean());
            assertEquals(50.0, resultItem.get("unitPrice").getAsDouble(), 0.001);
            assertFalse(resultItem.get("showItemsToEndUser").getAsBoolean());
            assertTrue(resultItem.getAsJsonObject("product").get("isActive").getAsBoolean());
            assertEquals(100.0, resultItem.getAsJsonObject("product").get("listPrice").getAsDouble(), 0.001);
            assertTrue(resultItem.getAsJsonObject("product").get("showInCatalog").getAsBoolean());
        }
    }

    // ============================================
    // Arrays
    // ============================================

    @Nested
    @DisplayName("arrays")
    class Arrays {

        @Test
        @DisplayName("should normalize objects inside arrays")
        void normalizeObjectsInArrays() {
            JsonObject obj1 = new JsonObject();
            obj1.addProperty("id", "1");
            obj1.addProperty("isActive", 1);
            obj1.addProperty("listPrice", "10.00");

            JsonObject obj2 = new JsonObject();
            obj2.addProperty("id", "2");
            obj2.addProperty("isActive", 0);
            obj2.addProperty("listPrice", "20.00");

            JsonArray input = new JsonArray();
            input.add(obj1);
            input.add(obj2);

            JsonArray result = ResponseNormalizer.normalize(input).getAsJsonArray();

            assertTrue(result.get(0).getAsJsonObject().get("isActive").getAsBoolean());
            assertEquals(10.0, result.get(0).getAsJsonObject().get("listPrice").getAsDouble(), 0.001);
            assertFalse(result.get(1).getAsJsonObject().get("isActive").getAsBoolean());
            assertEquals(20.0, result.get(1).getAsJsonObject().get("listPrice").getAsDouble(), 0.001);
        }

        @Test
        @DisplayName("should handle results array pattern")
        void handleResultsArrayPattern() {
            JsonObject item1 = new JsonObject();
            item1.addProperty("id", "1");
            item1.addProperty("isActive", 1);
            item1.addProperty("grandTotal", "100.00");

            JsonObject item2 = new JsonObject();
            item2.addProperty("id", "2");
            item2.addProperty("isActive", 0);
            item2.addProperty("grandTotal", "200.00");

            JsonArray results = new JsonArray();
            results.add(item1);
            results.add(item2);

            JsonObject input = new JsonObject();
            input.add("results", results);
            input.addProperty("totalRecords", 2);

            JsonObject result = ResponseNormalizer.normalize(input).getAsJsonObject();
            JsonArray resultArray = result.getAsJsonArray("results");

            assertTrue(resultArray.get(0).getAsJsonObject().get("isActive").getAsBoolean());
            assertEquals(100.0, resultArray.get(0).getAsJsonObject().get("grandTotal").getAsDouble(), 0.001);
            assertFalse(resultArray.get(1).getAsJsonObject().get("isActive").getAsBoolean());
            assertEquals(200.0, resultArray.get(1).getAsJsonObject().get("grandTotal").getAsDouble(), 0.001);
            assertEquals(2, result.get("totalRecords").getAsInt());
        }
    }

    // ============================================
    // Edge cases
    // ============================================

    @Nested
    @DisplayName("edge cases")
    class EdgeCases {

        @Test
        @DisplayName("should return primitives unchanged")
        void returnPrimitivesUnchanged() {
            JsonPrimitive strPrim = new JsonPrimitive("hello");
            assertSame(strPrim, ResponseNormalizer.normalize(strPrim));

            JsonPrimitive numPrim = new JsonPrimitive(42);
            assertSame(numPrim, ResponseNormalizer.normalize(numPrim));

            assertNull(ResponseNormalizer.normalize((JsonElement) null));

            assertSame(JsonNull.INSTANCE, ResponseNormalizer.normalize(JsonNull.INSTANCE));
        }

        @Test
        @DisplayName("should handle empty objects")
        void handleEmptyObjects() {
            JsonObject input = new JsonObject();
            JsonObject result = ResponseNormalizer.normalize(input).getAsJsonObject();
            assertEquals(0, result.size());
        }

        @Test
        @DisplayName("should handle empty arrays")
        void handleEmptyArrays() {
            JsonArray input = new JsonArray();
            JsonArray result = ResponseNormalizer.normalize(input).getAsJsonArray();
            assertEquals(0, result.size());
        }

        @Test
        @DisplayName("should not mutate the original object")
        void doNotMutateOriginal() {
            JsonObject input = new JsonObject();
            input.addProperty("isActive", 1);
            input.addProperty("listPrice", "99.99");

            JsonObject result = ResponseNormalizer.normalize(input).getAsJsonObject();

            // Original should be unchanged
            assertEquals(1, input.get("isActive").getAsInt());
            assertEquals("99.99", input.get("listPrice").getAsString());

            // Result should be normalized
            assertTrue(result.get("isActive").getAsBoolean());
            assertEquals(99.99, result.get("listPrice").getAsDouble(), 0.001);
        }
    }
}
