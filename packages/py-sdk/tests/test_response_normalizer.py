"""
Response Normalizer Tests

MySQL returns tinyint(1) as 0/1 and decimal columns as strings.
The normalizer coerces these to proper boolean/float types so SDK
consumers always get the types declared in the TypedDict definitions.
"""

from turbodocx_sdk.utils.response_normalizer import normalize_response


class TestBooleanCoercion:
    """Boolean coercion (MySQL tinyint)"""

    def test_should_convert_0_to_false_for_known_boolean_fields(self):
        data = {"isActive": 0, "isDefault": 0, "showInCatalog": 0}
        result = normalize_response(data)
        assert result["isActive"] is False
        assert result["isDefault"] is False
        assert result["showInCatalog"] is False

    def test_should_convert_1_to_true_for_known_boolean_fields(self):
        data = {"isActive": 1, "isDefault": 1, "showInCatalog": 1}
        result = normalize_response(data)
        assert result["isActive"] is True
        assert result["isDefault"] is True
        assert result["showInCatalog"] is True

    def test_should_handle_all_known_boolean_fields(self):
        data = {
            "isActive": 1,
            "isDefault": 0,
            "showInCatalog": 1,
            "showInQuoteBuilder": 0,
            "showItemsToEndUser": 1,
            "syncWithProducts": 0,
            "isPrimaryAdmin": 1,
            "canManageOrgs": 1,
            "canManageOrgUsers": 0,
            "canManagePartnerUsers": 1,
            "canManageOrgAPIKeys": 0,
            "canManagePartnerAPIKeys": 1,
            "canUpdateEntitlements": 0,
            "canViewAuditLogs": 1,
            "hasFileDownload": 1,
            "hasGDrive": 0,
            "rdWatermark": 1,
        }
        result = normalize_response(data)
        assert result["isActive"] is True
        assert result["isDefault"] is False
        assert result["showInCatalog"] is True
        assert result["showInQuoteBuilder"] is False
        assert result["showItemsToEndUser"] is True
        assert result["syncWithProducts"] is False
        assert result["isPrimaryAdmin"] is True
        assert result["canManageOrgs"] is True
        assert result["canManageOrgUsers"] is False
        assert result["canManagePartnerUsers"] is True
        assert result["canManageOrgAPIKeys"] is False
        assert result["canManagePartnerAPIKeys"] is True
        assert result["canUpdateEntitlements"] is False
        assert result["canViewAuditLogs"] is True
        assert result["hasFileDownload"] is True
        assert result["hasGDrive"] is False
        assert result["rdWatermark"] is True

    def test_should_leave_actual_booleans_unchanged(self):
        data = {"isActive": True, "isDefault": False}
        result = normalize_response(data)
        assert result["isActive"] is True
        assert result["isDefault"] is False

    def test_should_not_convert_non_boolean_fields_that_happen_to_be_0_or_1(self):
        data = {"quantity": 1, "offset": 0, "name": "test"}
        result = normalize_response(data)
        assert result["quantity"] == 1
        assert result["offset"] == 0
        assert result["name"] == "test"


class TestDecimalCoercion:
    """Decimal coercion (MySQL decimal strings)"""

    def test_should_convert_string_decimals_to_numbers_for_known_numeric_fields(self):
        data = {"listPrice": "99.99", "cost": "50.00", "unitPrice": "25.50"}
        result = normalize_response(data)
        assert result["listPrice"] == 99.99
        assert result["cost"] == 50.0
        assert result["unitPrice"] == 25.5

    def test_should_handle_all_known_decimal_fields(self):
        data = {
            "listPrice": "100.00",
            "cost": "50.00",
            "unitPrice": "75.50",
            "discountPercent": "10.00",
            "subtotal": "67.95",
            "grandTotal": "1234.56",
            "subtotalMonthly": "500.00",
            "subtotalQuarterly": "1500.00",
            "subtotalAnnual": "6000.00",
            "subtotalOneTime": "200.00",
            "taxAmount": "48.00",
            "taxRate": "8.50",
            "bundleDiscountPercent": "15.00",
            "totalListPrice": "1000.00",
            "totalFinalPrice": "850.00",
            "totalCost": "400.00",
            "finalPrice": "85.00",
            "marginPercent": "45.00",
        }
        result = normalize_response(data)
        assert result["listPrice"] == 100.0
        assert result["cost"] == 50.0
        assert result["unitPrice"] == 75.5
        assert result["discountPercent"] == 10.0
        assert result["subtotal"] == 67.95
        assert result["grandTotal"] == 1234.56
        assert result["subtotalMonthly"] == 500.0
        assert result["subtotalQuarterly"] == 1500.0
        assert result["subtotalAnnual"] == 6000.0
        assert result["subtotalOneTime"] == 200.0
        assert result["taxAmount"] == 48.0
        assert result["taxRate"] == 8.5
        assert result["bundleDiscountPercent"] == 15.0
        assert result["totalListPrice"] == 1000.0
        assert result["totalFinalPrice"] == 850.0
        assert result["totalCost"] == 400.0
        assert result["finalPrice"] == 85.0
        assert result["marginPercent"] == 45.0

    def test_should_leave_actual_numbers_unchanged(self):
        data = {"listPrice": 99.99, "quantity": 5}
        result = normalize_response(data)
        assert result["listPrice"] == 99.99
        assert result["quantity"] == 5

    def test_should_handle_null_decimal_fields(self):
        data = {"cost": None, "taxRate": None, "marginPercent": None}
        result = normalize_response(data)
        assert result["cost"] is None
        assert result["taxRate"] is None
        assert result["marginPercent"] is None

    def test_should_not_convert_non_numeric_string_fields(self):
        data = {"name": "99.99", "quoteNumber": "Q-2026-00001", "status": "draft"}
        result = normalize_response(data)
        assert result["name"] == "99.99"
        assert result["quoteNumber"] == "Q-2026-00001"
        assert result["status"] == "draft"


class TestNestedObjects:
    """Nested objects"""

    def test_should_normalize_fields_in_nested_objects(self):
        data = {
            "id": "q-1",
            "isActive": 1,
            "grandTotal": "500.00",
            "company": {
                "id": "c-1",
                "isActive": 1,
                "name": "Acme",
            },
            "contact": {
                "id": "ct-1",
                "isActive": 0,
            },
        }
        result = normalize_response(data)
        assert result["isActive"] is True
        assert result["grandTotal"] == 500.0
        assert result["company"]["isActive"] is True
        assert result["company"]["name"] == "Acme"
        assert result["contact"]["isActive"] is False

    def test_should_normalize_deeply_nested_objects(self):
        data = {
            "items": [
                {
                    "id": "li-1",
                    "isActive": 1,
                    "unitPrice": "50.00",
                    "showItemsToEndUser": 0,
                    "product": {
                        "id": "p-1",
                        "isActive": 1,
                        "listPrice": "100.00",
                        "showInCatalog": 1,
                    },
                }
            ],
        }
        result = normalize_response(data)
        assert result["items"][0]["isActive"] is True
        assert result["items"][0]["unitPrice"] == 50.0
        assert result["items"][0]["showItemsToEndUser"] is False
        assert result["items"][0]["product"]["isActive"] is True
        assert result["items"][0]["product"]["listPrice"] == 100.0
        assert result["items"][0]["product"]["showInCatalog"] is True


class TestArrays:
    """Arrays"""

    def test_should_normalize_objects_inside_arrays(self):
        data = [
            {"id": "1", "isActive": 1, "listPrice": "10.00"},
            {"id": "2", "isActive": 0, "listPrice": "20.00"},
        ]
        result = normalize_response(data)
        assert result[0]["isActive"] is True
        assert result[0]["listPrice"] == 10.0
        assert result[1]["isActive"] is False
        assert result[1]["listPrice"] == 20.0

    def test_should_handle_results_array_pattern(self):
        data = {
            "results": [
                {"id": "1", "isActive": 1, "grandTotal": "100.00"},
                {"id": "2", "isActive": 0, "grandTotal": "200.00"},
            ],
            "totalRecords": 2,
        }
        result = normalize_response(data)
        assert result["results"][0]["isActive"] is True
        assert result["results"][0]["grandTotal"] == 100.0
        assert result["results"][1]["isActive"] is False
        assert result["results"][1]["grandTotal"] == 200.0
        assert result["totalRecords"] == 2


class TestEdgeCases:
    """Edge cases"""

    def test_should_return_primitives_unchanged(self):
        assert normalize_response("hello") == "hello"
        assert normalize_response(42) == 42
        assert normalize_response(None) is None

    def test_should_handle_empty_objects(self):
        assert normalize_response({}) == {}

    def test_should_handle_empty_arrays(self):
        assert normalize_response([]) == []

    def test_should_not_mutate_the_original_object(self):
        data = {"isActive": 1, "listPrice": "99.99"}
        result = normalize_response(data)
        # Original should be unchanged
        assert data["isActive"] == 1
        assert data["listPrice"] == "99.99"
        # Result should be normalized
        assert result["isActive"] is True
        assert result["listPrice"] == 99.99
