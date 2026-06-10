"""
TurboQuote Module Tests

Tests for all TurboQuote SDK operations organized by entity:
- Configuration
- Quotes (CRUD + status + PDF)
- Line Items
- Products
- Price Books
- Bundles
- Companies
- Contacts
- Templates
- Types/Categories
- Convenience methods (create_and_send)
- Error Handling
"""

import json
import pytest
from unittest.mock import AsyncMock, MagicMock, patch, call

from turbodocx_sdk import TurboQuote
from turbodocx_sdk.http import HttpClient


# ============================================
# CONFIGURATION
# ============================================


class TestTurboQuoteConfigure:
    """Test TurboQuote configuration"""

    @pytest.fixture(autouse=True)
    def setup(self):
        """Reset client before each test"""
        TurboQuote._client = None

    def test_configure_with_api_key_and_org_id(self):
        """Should configure the client with API key and org ID"""
        TurboQuote.configure(api_key="test-api-key", org_id="test-org-id")
        assert TurboQuote._client is not None
        assert TurboQuote._client.api_key == "test-api-key"
        assert TurboQuote._client.org_id == "test-org-id"

    def test_configure_with_custom_base_url(self):
        """Should configure with custom base URL"""
        TurboQuote.configure(
            api_key="test-key",
            org_id="org-1",
            base_url="https://custom.api.com",
        )
        assert TurboQuote._client.base_url == "https://custom.api.com"

    def test_configure_with_access_token(self):
        """Should configure with access token instead of API key"""
        TurboQuote.configure(access_token="oauth-token", org_id="org-1")
        assert TurboQuote._client is not None
        assert TurboQuote._client.access_token == "oauth-token"

    @pytest.mark.asyncio
    async def test_auto_initialize_from_env_vars(self, monkeypatch):
        """Should auto-initialize from env vars when not configured"""
        monkeypatch.setenv("TURBODOCX_API_KEY", "env-key")
        monkeypatch.setenv("TURBODOCX_ORG_ID", "env-org")

        mock_client = AsyncMock()
        mock_client.get = AsyncMock(return_value={"results": [], "totalRecords": 0})

        with patch.object(TurboQuote, "_get_client", return_value=mock_client):
            await TurboQuote.list_quotes()
            mock_client.get.assert_called_once()


# ============================================
# QUOTES -- CRUD
# ============================================


class TestQuotesCrud:
    """Test Quote CRUD operations"""

    @pytest.fixture(autouse=True)
    def setup(self):
        """Set up mock client before each test"""
        TurboQuote._client = None
        self.mock_client = AsyncMock()
        TurboQuote._client = self.mock_client

    @pytest.mark.asyncio
    async def test_list_quotes_with_pagination_and_filters(self):
        """Should list quotes with pagination and filters"""
        mock_response = {
            "results": [{"id": "q-1", "name": "Test Quote", "status": "draft"}],
            "totalRecords": 1,
        }
        self.mock_client.get = AsyncMock(return_value=mock_response)

        result = await TurboQuote.list_quotes({"limit": 10, "statuses": "draft", "query": "test"})

        assert len(result["results"]) == 1
        assert result["totalRecords"] == 1
        self.mock_client.get.assert_called_once_with(
            "/v1/quotes",
            {"limit": "10", "statuses": "draft", "query": "test"},
        )

    @pytest.mark.asyncio
    async def test_pass_array_statuses_as_string_array(self):
        """Should pass array statuses as string array (not comma-joined)"""
        mock_response = {"results": [], "totalRecords": 0}
        self.mock_client.get = AsyncMock(return_value=mock_response)

        await TurboQuote.list_quotes({"statuses": ["draft", "sent"]})

        self.mock_client.get.assert_called_once_with(
            "/v1/quotes",
            {"statuses": ["draft", "sent"]},
        )

    @pytest.mark.asyncio
    async def test_create_quote_and_unwrap_result(self):
        """Should create a quote and unwrap result"""
        mock_quote = {"id": "q-1", "name": "My Quote", "status": "draft", "quoteNumber": "Q-2026-00001"}
        self.mock_client.post = AsyncMock(
            return_value={"result": mock_quote, "message": "Quote created successfully"}
        )

        result = await TurboQuote.create_quote({"name": "My Quote", "companyId": "c-1", "contactId": "ct-1"})

        assert result["id"] == "q-1"
        assert result["status"] == "draft"
        self.mock_client.post.assert_called_once_with(
            "/v1/quotes",
            {"name": "My Quote", "companyId": "c-1", "contactId": "ct-1"},
        )

    @pytest.mark.asyncio
    async def test_create_quote_with_all_optional_fields(self):
        """Should create a quote with all optional fields"""
        mock_quote = {"id": "q-2", "name": "Full Quote", "status": "draft"}
        self.mock_client.post = AsyncMock(
            return_value={"result": mock_quote, "message": "Quote created successfully"}
        )

        await TurboQuote.create_quote({
            "name": "Full Quote",
            "companyId": "comp-1",
            "contactId": "cont-1",
            "currency": "EUR",
            "termDays": 60,
            "taxRate": 8.25,
            "validUntil": "2026-12-31",
            "priceBookId": "pb-1",
        })

        call_args = self.mock_client.post.call_args
        assert call_args[0][0] == "/v1/quotes"
        body = call_args[0][1]
        assert body["name"] == "Full Quote"
        assert body["companyId"] == "comp-1"
        assert body["currency"] == "EUR"
        assert body["termDays"] == 60
        assert body["taxRate"] == 8.25

    @pytest.mark.asyncio
    async def test_get_quote_by_id_with_status_info(self):
        """Should get a quote by ID, unwrap result, and include statusInfo"""
        mock_quote = {"id": "q-1", "name": "Test Quote", "status": "sent", "lineItems": []}
        mock_status_info = {
            "currentStatus": "sent",
            "canSend": False,
            "canAccept": True,
            "canDecline": True,
            "canVoid": True,
            "isTerminal": False,
        }
        self.mock_client.get = AsyncMock(
            return_value={"result": mock_quote, "statusInfo": mock_status_info}
        )

        result = await TurboQuote.get_quote("q-1")

        assert result["id"] == "q-1"
        assert result["statusInfo"] == mock_status_info
        self.mock_client.get.assert_called_once_with("/v1/quotes/q-1")

    @pytest.mark.asyncio
    async def test_update_quote_and_unwrap_result(self):
        """Should update a quote and unwrap result"""
        mock_quote = {"id": "q-1", "name": "Updated Name", "taxRate": 10}
        self.mock_client.patch = AsyncMock(
            return_value={"result": mock_quote, "message": "Quote updated successfully"}
        )

        result = await TurboQuote.update_quote("q-1", {"name": "Updated Name", "taxRate": 10})

        assert result["name"] == "Updated Name"
        self.mock_client.patch.assert_called_once_with(
            "/v1/quotes/q-1",
            {"name": "Updated Name", "taxRate": 10},
        )

    @pytest.mark.asyncio
    async def test_delete_quote(self):
        """Should delete a quote"""
        mock_response = {"message": "Quote deleted successfully"}
        self.mock_client.delete = AsyncMock(return_value=mock_response)

        result = await TurboQuote.delete_quote("q-1")

        assert result["message"] == "Quote deleted successfully"
        self.mock_client.delete.assert_called_once_with("/v1/quotes/q-1")

    @pytest.mark.asyncio
    async def test_duplicate_quote_and_unwrap_result(self):
        """Should duplicate a quote and unwrap result"""
        mock_quote = {"id": "q-2", "name": "Test Quote (Copy)", "status": "draft", "quoteNumber": "Q-2026-00002"}
        self.mock_client.post = AsyncMock(
            return_value={"result": mock_quote, "message": "Quote duplicated successfully"}
        )

        result = await TurboQuote.duplicate_quote("q-1")

        assert result["id"] == "q-2"
        assert result["status"] == "draft"
        self.mock_client.post.assert_called_once_with("/v1/quotes/q-1/duplicate")

    @pytest.mark.asyncio
    async def test_apply_price_book_and_return_full_response(self):
        """Should apply a price book and return full response with counts"""
        mock_quote = {"id": "q-1", "priceBookId": "pb-1"}
        self.mock_client.post = AsyncMock(return_value={
            "result": mock_quote,
            "updatedCount": 3,
            "skippedCount": 1,
            "message": "Pricebook applied: 3 product(s) updated, 1 skipped",
        })

        result = await TurboQuote.apply_price_book("q-1", "pb-1")

        assert result["quote"]["priceBookId"] == "pb-1"
        assert result["updatedCount"] == 3
        assert result["skippedCount"] == 1
        assert result["message"] == "Pricebook applied: 3 product(s) updated, 1 skipped"
        self.mock_client.post.assert_called_once_with(
            "/v1/quotes/q-1/apply-pricebook",
            {"priceBookId": "pb-1"},
        )

    @pytest.mark.asyncio
    async def test_remove_price_book_and_unwrap_result(self):
        """Should remove a price book and unwrap result"""
        mock_quote = {"id": "q-1", "priceBookId": None}
        self.mock_client.post = AsyncMock(
            return_value={"result": mock_quote, "message": "Pricebook removed from quote"}
        )

        result = await TurboQuote.remove_price_book("q-1")

        assert result["priceBookId"] is None
        self.mock_client.post.assert_called_once_with("/v1/quotes/q-1/remove-pricebook")

    @pytest.mark.asyncio
    async def test_download_quote_pdf(self):
        """Should download a quote PDF"""
        mock_pdf = b"\x00" * 1024
        self.mock_client.get_raw = AsyncMock(return_value=mock_pdf)

        result = await TurboQuote.download_quote_pdf("q-1")

        assert result == mock_pdf
        self.mock_client.get_raw.assert_called_once_with("/v1/quotes/q-1/pdf")


# ============================================
# QUOTES -- STATUS TRANSITIONS
# ============================================


class TestQuoteStatus:
    """Test Quote status transitions"""

    @pytest.fixture(autouse=True)
    def setup(self):
        TurboQuote._client = None
        self.mock_client = AsyncMock()
        TurboQuote._client = self.mock_client

    @pytest.mark.asyncio
    async def test_send_quote_and_remap_result(self):
        """Should send a quote and remap result to quote"""
        mock_response = {"result": {"id": "q-1", "status": "sent"}, "message": "Quote sent"}
        self.mock_client.post = AsyncMock(return_value=mock_response)

        result = await TurboQuote.send_quote("q-1", {"ccEmails": ["admin@example.com"]})

        assert result["quote"]["status"] == "sent"
        assert result["message"] == "Quote sent"
        self.mock_client.post.assert_called_once_with(
            "/v1/quotes/q-1/send",
            {"ccEmails": ["admin@example.com"]},
        )

    @pytest.mark.asyncio
    async def test_send_quote_without_options(self):
        """Should send a quote without options"""
        mock_response = {"result": {"id": "q-1", "status": "sent"}, "message": "Quote sent"}
        self.mock_client.post = AsyncMock(return_value=mock_response)

        result = await TurboQuote.send_quote("q-1")

        assert result["quote"]["id"] == "q-1"
        self.mock_client.post.assert_called_once_with("/v1/quotes/q-1/send", None)

    @pytest.mark.asyncio
    async def test_send_quote_with_deliverable(self):
        """Should send a quote with a deliverable and return documentId"""
        mock_response = {
            "result": {"id": "q-1", "status": "sent"},
            "message": "Quote sent with deliverable",
            "documentId": "doc-2",
        }
        self.mock_client.post = AsyncMock(return_value=mock_response)

        result = await TurboQuote.send_quote_with_deliverable("q-1", {
            "deliverableId": "del-1",
            "mergePosition": "end",
        })

        assert result["quote"]["status"] == "sent"
        assert result["documentId"] == "doc-2"
        assert result["message"] == "Quote sent with deliverable"
        self.mock_client.post.assert_called_once_with(
            "/v1/quotes/q-1/send-with-deliverable",
            {"deliverableId": "del-1", "mergePosition": "end"},
        )

    @pytest.mark.asyncio
    async def test_decline_quote_and_unwrap_result(self):
        """Should decline a quote with object param and unwrap result"""
        mock_quote = {"id": "q-1", "status": "declined"}
        self.mock_client.post = AsyncMock(
            return_value={"result": mock_quote, "message": "Quote declined"}
        )

        result = await TurboQuote.decline_quote("q-1", {"reason": "Budget not approved"})

        assert result["status"] == "declined"
        self.mock_client.post.assert_called_once_with(
            "/v1/quotes/q-1/decline",
            {"reason": "Budget not approved"},
        )

    @pytest.mark.asyncio
    async def test_void_quote_and_unwrap_result(self):
        """Should void a quote with object param and unwrap result"""
        mock_quote = {"id": "q-1", "status": "voided"}
        self.mock_client.post = AsyncMock(
            return_value={"result": mock_quote, "message": "Quote voided successfully"}
        )

        result = await TurboQuote.void_quote("q-1", {"reason": "Replaced by new quote"})

        assert result["status"] == "voided"
        self.mock_client.post.assert_called_once_with(
            "/v1/quotes/q-1/void",
            {"reason": "Replaced by new quote"},
        )

    @pytest.mark.asyncio
    async def test_handle_expired_quote_and_unwrap_result(self):
        """Should handle an expired sent quote and unwrap result"""
        mock_quote = {"id": "q-2", "status": "draft", "quoteNumber": "Q-2026-00003"}
        self.mock_client.post = AsyncMock(
            return_value={"result": mock_quote, "message": "Expired quote processed"}
        )

        result = await TurboQuote.handle_expired_quote("q-1", {
            "action": "void",
            "reason": "Expired",
            "newValidUntil": "2026-12-31",
        })

        assert result["status"] == "draft"
        self.mock_client.post.assert_called_once_with(
            "/v1/quotes/q-1/handle-expired-sent",
            {"action": "void", "reason": "Expired", "newValidUntil": "2026-12-31"},
        )


# ============================================
# LINE ITEMS
# ============================================


class TestLineItems:
    """Test Line Item operations"""

    @pytest.fixture(autouse=True)
    def setup(self):
        TurboQuote._client = None
        self.mock_client = AsyncMock()
        TurboQuote._client = self.mock_client

    @pytest.mark.asyncio
    async def test_list_line_items_for_a_quote(self):
        """Should list line items for a quote"""
        mock_response = {"results": [{"id": "li-1", "productName": "Widget"}], "totalRecords": 1}
        self.mock_client.get = AsyncMock(return_value=mock_response)

        result = await TurboQuote.list_line_items("q-1")

        assert len(result["results"]) == 1
        self.mock_client.get.assert_called_once_with("/v1/quotes/q-1/items", None)

    @pytest.mark.asyncio
    async def test_add_single_product_line_item_and_unwrap_results(self):
        """Should add a single product line item and unwrap results"""
        mock_items = [{"id": "li-1", "productId": "prod-1", "quantity": 2}]
        self.mock_client.post = AsyncMock(
            return_value={"results": mock_items, "message": "1 line item(s) added successfully"}
        )

        item = {
            "productId": "prod-1",
            "productName": "Widget",
            "unitPrice": 50,
            "billingFrequency": "monthly",
            "quantity": 2,
        }
        result = await TurboQuote.add_line_items("q-1", item)

        assert len(result) == 1
        self.mock_client.post.assert_called_once_with(
            "/v1/quotes/q-1/items",
            [item],
        )

    @pytest.mark.asyncio
    async def test_add_multiple_product_line_items_as_batch(self):
        """Should add multiple product line items as batch"""
        mock_items = [{"id": "li-1"}, {"id": "li-2"}]
        self.mock_client.post = AsyncMock(
            return_value={"results": mock_items, "message": "2 line item(s) added successfully"}
        )

        items = [
            {"productId": "prod-1", "productName": "Widget A", "unitPrice": 50, "billingFrequency": "monthly", "quantity": 5},
            {"productId": "prod-2", "productName": "Widget B", "unitPrice": 75, "billingFrequency": "monthly", "quantity": 1, "discountPercent": 10},
        ]
        result = await TurboQuote.add_line_items("q-1", items)

        assert len(result) == 2
        self.mock_client.post.assert_called_once_with(
            "/v1/quotes/q-1/items",
            items,
        )

    @pytest.mark.asyncio
    async def test_add_single_bundle_line_item_and_unwrap_results(self):
        """Should add a single bundle line item and unwrap results"""
        mock_items = [{"id": "li-3", "bundleId": "bun-1", "lineItemType": "bundle"}]
        self.mock_client.post = AsyncMock(
            return_value={"results": mock_items, "message": "1 bundle(s) added successfully"}
        )

        result = await TurboQuote.add_bundle_line_items("q-1", {"bundleId": "bun-1", "bundleName": "Starter Pack"})

        assert len(result) == 1
        self.mock_client.post.assert_called_once_with(
            "/v1/quotes/q-1/items/bundle",
            [{"bundleId": "bun-1", "bundleName": "Starter Pack"}],
        )

    @pytest.mark.asyncio
    async def test_update_line_item_and_unwrap_result(self):
        """Should update a line item and unwrap result"""
        mock_item = {"id": "li-1", "quantity": 10, "unitPrice": 50}
        self.mock_client.patch = AsyncMock(
            return_value={"result": mock_item, "message": "Line item updated successfully"}
        )

        result = await TurboQuote.update_line_item("q-1", "li-1", {"quantity": 10, "unitPrice": 50})

        assert result["quantity"] == 10
        self.mock_client.patch.assert_called_once_with(
            "/v1/quotes/q-1/items/li-1",
            {"quantity": 10, "unitPrice": 50},
        )

    @pytest.mark.asyncio
    async def test_remove_line_item(self):
        """Should remove a line item"""
        mock_response = {"message": "Line item removed successfully"}
        self.mock_client.delete = AsyncMock(return_value=mock_response)

        result = await TurboQuote.remove_line_item("q-1", "li-1")

        assert result["message"] == "Line item removed successfully"
        self.mock_client.delete.assert_called_once_with("/v1/quotes/q-1/items/li-1")


# ============================================
# PRODUCTS
# ============================================


class TestProducts:
    """Test Product operations"""

    @pytest.fixture(autouse=True)
    def setup(self):
        TurboQuote._client = None
        self.mock_client = AsyncMock()
        TurboQuote._client = self.mock_client

    @pytest.mark.asyncio
    async def test_list_products_with_filters(self):
        """Should list products with filters"""
        mock_response = {"results": [{"id": "p-1", "name": "Widget"}], "totalRecords": 1}
        self.mock_client.get = AsyncMock(return_value=mock_response)

        result = await TurboQuote.list_products({"billingFrequency": "monthly", "limit": 25})

        assert len(result["results"]) == 1
        self.mock_client.get.assert_called_once_with(
            "/v1/products",
            {"billingFrequency": "monthly", "limit": "25"},
        )

    @pytest.mark.asyncio
    async def test_create_product_without_images_and_unwrap_result(self):
        """Should create a product without images and unwrap result"""
        mock_product = {"id": "p-1", "name": "Widget Pro", "listPrice": 99.99}
        self.mock_client.post = AsyncMock(
            return_value={"result": mock_product, "message": "Product created successfully"}
        )

        result = await TurboQuote.create_product({
            "name": "Widget Pro",
            "listPrice": 99.99,
            "billingFrequency": "monthly",
            "categoryId": "cat-1",
        })

        assert result["name"] == "Widget Pro"
        self.mock_client.post.assert_called_once_with(
            "/v1/products",
            {"name": "Widget Pro", "listPrice": 99.99, "billingFrequency": "monthly", "categoryId": "cat-1"},
        )

    @pytest.mark.asyncio
    async def test_get_product_by_id_and_unwrap_result(self):
        """Should get a product by ID and unwrap result"""
        mock_product = {"id": "p-1", "name": "Widget", "images": []}
        self.mock_client.get = AsyncMock(return_value={"result": mock_product})

        result = await TurboQuote.get_product("p-1")

        assert result["id"] == "p-1"
        self.mock_client.get.assert_called_once_with("/v1/products/p-1")

    @pytest.mark.asyncio
    async def test_update_product_without_images_and_unwrap_result(self):
        """Should update a product without images and unwrap result"""
        mock_product = {"id": "p-1", "name": "Updated Widget", "listPrice": 149.99}
        self.mock_client.patch = AsyncMock(
            return_value={"result": mock_product, "message": "Product updated successfully"}
        )

        result = await TurboQuote.update_product("p-1", {"name": "Updated Widget", "listPrice": 149.99})

        assert result["name"] == "Updated Widget"
        self.mock_client.patch.assert_called_once_with(
            "/v1/products/p-1",
            {"name": "Updated Widget", "listPrice": 149.99},
        )

    @pytest.mark.asyncio
    async def test_delete_product(self):
        """Should delete a product"""
        mock_response = {"message": "Product deleted successfully"}
        self.mock_client.delete = AsyncMock(return_value=mock_response)

        result = await TurboQuote.delete_product("p-1")

        assert result["message"] == "Product deleted successfully"
        self.mock_client.delete.assert_called_once_with("/v1/products/p-1")

    @pytest.mark.asyncio
    async def test_duplicate_product_and_unwrap_result(self):
        """Should duplicate a product and unwrap result"""
        mock_product = {"id": "p-2", "name": "Widget Pro (Copy)"}
        self.mock_client.post = AsyncMock(
            return_value={"result": mock_product, "message": "Product duplicated successfully"}
        )

        result = await TurboQuote.duplicate_product("p-1")

        assert result["id"] == "p-2"
        self.mock_client.post.assert_called_once_with("/v1/products/p-1/duplicate")

    @pytest.mark.asyncio
    async def test_create_product_with_images_uses_form_data(self):
        """Should pack product fields into a 'data' JSON field when creating with images"""
        mock_product = {"id": "p-1", "name": "Widget", "listPrice": 99}
        self.mock_client.post_form_data = AsyncMock(
            return_value={"result": mock_product, "message": "Product created successfully"}
        )

        fake_image = b"fake-image"
        await TurboQuote.create_product({
            "name": "Widget",
            "listPrice": 99,
            "billingFrequency": "monthly",
            "categoryId": "cat-1",
            "images": [fake_image],
        })

        self.mock_client.post_form_data.assert_called_once()
        call_args = self.mock_client.post_form_data.call_args
        path = call_args[0][0]
        data = call_args[0][1]
        files = call_args[0][2]

        assert path == "/v1/products"
        assert "data" in data
        parsed = json.loads(data["data"])
        assert parsed["name"] == "Widget"
        assert parsed["listPrice"] == 99
        assert parsed["billingFrequency"] == "monthly"
        assert parsed["categoryId"] == "cat-1"
        assert len(files) == 1

    @pytest.mark.asyncio
    async def test_update_product_with_images_uses_form_data(self):
        """Should pack product fields into 'data' JSON field on update with images"""
        mock_product = {"id": "p-1", "name": "Updated Widget"}
        self.mock_client.patch_form_data = AsyncMock(
            return_value={"result": mock_product, "message": "Product updated successfully"}
        )

        fake_image = b"fake-image"
        await TurboQuote.update_product("p-1", {
            "name": "Updated Widget",
            "images": [fake_image],
            "imageIdsToKeep": ["img-id-1"],
        })

        self.mock_client.patch_form_data.assert_called_once()
        call_args = self.mock_client.patch_form_data.call_args
        path = call_args[0][0]
        data = call_args[0][1]

        assert path == "/v1/products/p-1"
        assert "data" in data
        parsed = json.loads(data["data"])
        assert parsed["name"] == "Updated Widget"
        assert parsed["imageIdsToKeep"] == ["img-id-1"]

    @pytest.mark.asyncio
    async def test_get_primary_images_and_unwrap_results(self):
        """Should get primary images and unwrap results"""
        mock_image_map = {"p-1": {"id": "img-1", "productId": "p-1"}, "p-2": None}
        self.mock_client.post = AsyncMock(return_value={"results": mock_image_map})

        result = await TurboQuote.get_product_primary_images(["p-1", "p-2"])

        assert result["p-1"] == {"id": "img-1", "productId": "p-1"}
        assert result["p-2"] is None
        self.mock_client.post.assert_called_once_with(
            "/v1/products/primary-images",
            {"productIds": ["p-1", "p-2"]},
        )


# ============================================
# PRICE BOOKS
# ============================================


class TestPriceBooks:
    """Test Price Book operations"""

    @pytest.fixture(autouse=True)
    def setup(self):
        TurboQuote._client = None
        self.mock_client = AsyncMock()
        TurboQuote._client = self.mock_client

    @pytest.mark.asyncio
    async def test_list_price_books(self):
        """Should list price books"""
        mock_response = {"results": [{"id": "pb-1", "name": "Standard"}], "totalRecords": 1}
        self.mock_client.get = AsyncMock(return_value=mock_response)

        result = await TurboQuote.list_price_books()

        assert len(result["results"]) == 1
        self.mock_client.get.assert_called_once_with("/v1/pricebooks", None)

    @pytest.mark.asyncio
    async def test_create_price_book_and_unwrap_result(self):
        """Should create a price book and unwrap result"""
        mock_price_book = {"id": "pb-1", "name": "Partner Pricing", "discountPercent": 15}
        self.mock_client.post = AsyncMock(
            return_value={"result": mock_price_book, "message": "PriceBook created successfully"}
        )

        result = await TurboQuote.create_price_book({
            "name": "Partner Pricing",
            "priceBookTypeId": "pbt-1",
            "validFrom": "2026-01-01",
            "discountPercent": 15,
        })

        assert result["name"] == "Partner Pricing"
        self.mock_client.post.assert_called_once_with(
            "/v1/pricebooks",
            {"name": "Partner Pricing", "priceBookTypeId": "pbt-1", "validFrom": "2026-01-01", "discountPercent": 15},
        )

    @pytest.mark.asyncio
    async def test_get_price_book_by_id_and_unwrap_result(self):
        """Should get a price book by ID and unwrap result"""
        mock_price_book = {"id": "pb-1", "name": "Standard"}
        self.mock_client.get = AsyncMock(return_value={"result": mock_price_book})

        result = await TurboQuote.get_price_book("pb-1")

        assert result["id"] == "pb-1"
        self.mock_client.get.assert_called_once_with("/v1/pricebooks/pb-1")

    @pytest.mark.asyncio
    async def test_update_price_book_and_unwrap_result(self):
        """Should update a price book and unwrap result"""
        mock_price_book = {"id": "pb-1", "name": "Updated", "discountPercent": 20}
        self.mock_client.patch = AsyncMock(
            return_value={"result": mock_price_book, "message": "PriceBook updated successfully"}
        )

        result = await TurboQuote.update_price_book("pb-1", {"discountPercent": 20})

        assert result["discountPercent"] == 20

    @pytest.mark.asyncio
    async def test_delete_price_book(self):
        """Should delete a price book"""
        self.mock_client.delete = AsyncMock(return_value={"message": "PriceBook deleted successfully"})

        result = await TurboQuote.delete_price_book("pb-1")

        assert result["message"] == "PriceBook deleted successfully"

    @pytest.mark.asyncio
    async def test_duplicate_price_book_and_unwrap_result(self):
        """Should duplicate a price book and unwrap result"""
        self.mock_client.post = AsyncMock(
            return_value={"result": {"id": "pb-2", "name": "Standard (Copy)"}, "message": "Pricebook duplicated successfully"}
        )

        result = await TurboQuote.duplicate_price_book("pb-1")

        assert result["id"] == "pb-2"
        self.mock_client.post.assert_called_once_with("/v1/pricebooks/pb-1/duplicate")

    @pytest.mark.asyncio
    async def test_list_products_in_a_price_book(self):
        """Should list products in a price book"""
        mock_response = {"results": [{"productId": "p-1", "discountPercent": 10}], "totalRecords": 1}
        self.mock_client.get = AsyncMock(return_value=mock_response)

        result = await TurboQuote.list_price_book_products("pb-1")

        assert len(result["results"]) == 1
        self.mock_client.get.assert_called_once_with("/v1/pricebooks/pb-1/products", None)


# ============================================
# BUNDLES
# ============================================


class TestBundles:
    """Test Bundle operations"""

    @pytest.fixture(autouse=True)
    def setup(self):
        TurboQuote._client = None
        self.mock_client = AsyncMock()
        TurboQuote._client = self.mock_client

    @pytest.mark.asyncio
    async def test_list_bundles(self):
        """Should list bundles"""
        mock_response = {"results": [{"id": "b-1", "name": "Starter Pack"}], "totalRecords": 1}
        self.mock_client.get = AsyncMock(return_value=mock_response)

        result = await TurboQuote.list_bundles()

        assert len(result["results"]) == 1

    @pytest.mark.asyncio
    async def test_create_bundle_and_unwrap_result(self):
        """Should create a bundle and unwrap result"""
        mock_bundle = {"id": "b-1", "name": "Starter Pack", "items": []}
        self.mock_client.post = AsyncMock(
            return_value={"result": mock_bundle, "message": "Bundle created successfully"}
        )

        result = await TurboQuote.create_bundle({
            "name": "Starter Pack",
            "categoryId": "cat-1",
            "items": [{"productId": "p-1", "unitPrice": 50, "billingFrequency": "monthly"}],
        })

        assert result["name"] == "Starter Pack"
        call_args = self.mock_client.post.call_args
        assert call_args[0][0] == "/v1/bundles"
        body = call_args[0][1]
        assert body["name"] == "Starter Pack"
        assert body["categoryId"] == "cat-1"

    @pytest.mark.asyncio
    async def test_get_bundle_by_id_and_unwrap_result(self):
        """Should get a bundle by ID and unwrap result"""
        self.mock_client.get = AsyncMock(return_value={"result": {"id": "b-1", "items": []}})

        result = await TurboQuote.get_bundle("b-1")

        assert result["id"] == "b-1"
        self.mock_client.get.assert_called_once_with("/v1/bundles/b-1")

    @pytest.mark.asyncio
    async def test_update_bundle_and_unwrap_result(self):
        """Should update a bundle and unwrap result"""
        self.mock_client.patch = AsyncMock(
            return_value={"result": {"id": "b-1", "name": "Pro Pack"}, "message": "Bundle updated successfully"}
        )

        result = await TurboQuote.update_bundle("b-1", {"name": "Pro Pack"})

        assert result["name"] == "Pro Pack"

    @pytest.mark.asyncio
    async def test_delete_bundle(self):
        """Should delete a bundle"""
        self.mock_client.delete = AsyncMock(return_value={"message": "Bundle deleted successfully"})

        result = await TurboQuote.delete_bundle("b-1")

        assert result["message"] == "Bundle deleted successfully"

    @pytest.mark.asyncio
    async def test_duplicate_bundle_and_unwrap_result(self):
        """Should duplicate a bundle and unwrap result"""
        self.mock_client.post = AsyncMock(
            return_value={"result": {"id": "b-2"}, "message": "Bundle duplicated successfully"}
        )

        result = await TurboQuote.duplicate_bundle("b-1")

        assert result["id"] == "b-2"
        self.mock_client.post.assert_called_once_with("/v1/bundles/b-1/duplicate")


# ============================================
# COMPANIES
# ============================================


class TestCompanies:
    """Test Company operations"""

    @pytest.fixture(autouse=True)
    def setup(self):
        TurboQuote._client = None
        self.mock_client = AsyncMock()
        TurboQuote._client = self.mock_client

    @pytest.mark.asyncio
    async def test_list_companies(self):
        """Should list companies"""
        mock_response = {"results": [{"id": "c-1", "name": "Acme Corp"}], "totalRecords": 1}
        self.mock_client.get = AsyncMock(return_value=mock_response)

        result = await TurboQuote.list_companies({"query": "acme"})

        assert len(result["results"]) == 1
        self.mock_client.get.assert_called_once_with(
            "/v1/companies",
            {"query": "acme"},
        )

    @pytest.mark.asyncio
    async def test_create_company_and_unwrap_result(self):
        """Should create a company and unwrap result"""
        mock_company = {"id": "c-1", "name": "Acme Corp"}
        self.mock_client.post = AsyncMock(
            return_value={"result": mock_company, "message": "Company created successfully"}
        )

        result = await TurboQuote.create_company({
            "name": "Acme Corp",
            "contacts": [{"name": "John Doe", "email": "john@acme.com"}],
            "city": "Austin",
            "state": "TX",
        })

        assert result["name"] == "Acme Corp"
        self.mock_client.post.assert_called_once_with(
            "/v1/companies",
            {"name": "Acme Corp", "contacts": [{"name": "John Doe", "email": "john@acme.com"}], "city": "Austin", "state": "TX"},
        )

    @pytest.mark.asyncio
    async def test_get_company_by_id_and_unwrap_result(self):
        """Should get a company by ID and unwrap result"""
        self.mock_client.get = AsyncMock(return_value={"result": {"id": "c-1", "name": "Acme"}})

        result = await TurboQuote.get_company("c-1")

        assert result["id"] == "c-1"
        self.mock_client.get.assert_called_once_with("/v1/companies/c-1")

    @pytest.mark.asyncio
    async def test_update_company_and_unwrap_result(self):
        """Should update a company and unwrap result"""
        self.mock_client.patch = AsyncMock(
            return_value={"result": {"id": "c-1", "name": "Acme Inc"}, "message": "Company updated successfully"}
        )

        result = await TurboQuote.update_company("c-1", {"name": "Acme Inc"})

        assert result["name"] == "Acme Inc"

    @pytest.mark.asyncio
    async def test_delete_company(self):
        """Should delete a company"""
        self.mock_client.delete = AsyncMock(return_value={"message": "Company deleted successfully"})

        result = await TurboQuote.delete_company("c-1")

        assert result["message"] == "Company deleted successfully"

    @pytest.mark.asyncio
    async def test_list_contacts_for_a_company(self):
        """Should list contacts for a company"""
        mock_response = {"results": [{"id": "ct-1", "name": "John Doe"}], "totalRecords": 1}
        self.mock_client.get = AsyncMock(return_value=mock_response)

        result = await TurboQuote.list_company_contacts("c-1")

        assert len(result["results"]) == 1
        self.mock_client.get.assert_called_once_with("/v1/companies/c-1/contacts", None)


# ============================================
# CONTACTS
# ============================================


class TestContacts:
    """Test Contact operations"""

    @pytest.fixture(autouse=True)
    def setup(self):
        TurboQuote._client = None
        self.mock_client = AsyncMock()
        TurboQuote._client = self.mock_client

    @pytest.mark.asyncio
    async def test_list_contacts_with_optional_company_filter(self):
        """Should list contacts with optional company filter"""
        mock_response = {"results": [{"id": "ct-1", "name": "Jane"}], "totalRecords": 1}
        self.mock_client.get = AsyncMock(return_value=mock_response)

        result = await TurboQuote.list_contacts({"companyId": "c-1"})

        assert len(result["results"]) == 1
        self.mock_client.get.assert_called_once_with(
            "/v1/contacts",
            {"companyId": "c-1"},
        )

    @pytest.mark.asyncio
    async def test_create_contact_and_unwrap_result(self):
        """Should create a contact and unwrap result"""
        mock_contact = {"id": "ct-1", "name": "John Doe", "email": "john@example.com"}
        self.mock_client.post = AsyncMock(
            return_value={"result": mock_contact, "message": "Contact created successfully"}
        )

        result = await TurboQuote.create_contact({
            "name": "John Doe",
            "companyId": "c-1",
            "email": "john@example.com",
        })

        assert result["name"] == "John Doe"
        self.mock_client.post.assert_called_once_with(
            "/v1/contacts",
            {"name": "John Doe", "companyId": "c-1", "email": "john@example.com"},
        )

    @pytest.mark.asyncio
    async def test_update_contact_and_unwrap_result(self):
        """Should update a contact and unwrap result"""
        self.mock_client.patch = AsyncMock(
            return_value={"result": {"id": "ct-1", "name": "Jane Doe"}, "message": "Contact updated successfully"}
        )

        result = await TurboQuote.update_contact("ct-1", {"name": "Jane Doe"})

        assert result["name"] == "Jane Doe"

    @pytest.mark.asyncio
    async def test_delete_contact(self):
        """Should delete a contact"""
        self.mock_client.delete = AsyncMock(return_value={"message": "Contact deleted successfully"})

        result = await TurboQuote.delete_contact("ct-1")

        assert result["message"] == "Contact deleted successfully"


# ============================================
# TEMPLATES
# ============================================


class TestTemplates:
    """Test Template operations"""

    @pytest.fixture(autouse=True)
    def setup(self):
        TurboQuote._client = None
        self.mock_client = AsyncMock()
        TurboQuote._client = self.mock_client

    @pytest.mark.asyncio
    async def test_list_all_templates(self):
        """Should list all templates"""
        mock_response = {
            "results": [
                {"id": "t-1", "primaryColor": "#0066FF"},
                {"id": "t-2", "primaryColor": "#FF0000"},
            ],
            "totalRecords": 2,
        }
        self.mock_client.get = AsyncMock(return_value=mock_response)

        result = await TurboQuote.list_templates()

        assert len(result["results"]) == 2
        self.mock_client.get.assert_called_once_with("/v1/quote-templates", None)

    @pytest.mark.asyncio
    async def test_list_templates_with_pagination_and_query(self):
        """Should list templates with pagination and query params"""
        mock_response = {"results": [{"id": "t-1", "primaryColor": "#0066FF"}], "totalRecords": 1}
        self.mock_client.get = AsyncMock(return_value=mock_response)

        result = await TurboQuote.list_templates({"query": "sales", "limit": 10, "offset": 0})

        assert len(result["results"]) == 1
        self.mock_client.get.assert_called_once_with(
            "/v1/quote-templates",
            {"query": "sales", "limit": "10", "offset": "0"},
        )

    @pytest.mark.asyncio
    async def test_get_template_by_id_and_unwrap_result(self):
        """Should get a template by ID and unwrap result"""
        mock_template = {"id": "t-1", "primaryColor": "#0066FF"}
        self.mock_client.get = AsyncMock(return_value={"result": mock_template})

        result = await TurboQuote.get_template_by_id("t-1")

        assert result["id"] == "t-1"
        self.mock_client.get.assert_called_once_with("/v1/quote-templates/t-1")

    @pytest.mark.asyncio
    async def test_get_org_template_and_unwrap_result(self):
        """Should get the org template and unwrap result"""
        mock_template = {"id": "t-1", "primaryColor": "#0066FF"}
        self.mock_client.get = AsyncMock(
            return_value={"result": mock_template, "message": "Template found"}
        )

        result = await TurboQuote.get_template()

        assert result["id"] == "t-1"
        self.mock_client.get.assert_called_once_with("/v1/quote-template")

    @pytest.mark.asyncio
    async def test_create_template_and_unwrap_result(self):
        """Should create a template and unwrap result"""
        mock_template = {"id": "t-1", "primaryColor": "#0066FF"}
        self.mock_client.post = AsyncMock(
            return_value={"result": mock_template, "message": "Template created successfully"}
        )

        result = await TurboQuote.create_template({"primaryColor": "#0066FF", "senderName": "Sales"})

        assert result["id"] == "t-1"
        self.mock_client.post.assert_called_once_with(
            "/v1/quote-templates",
            {"primaryColor": "#0066FF", "senderName": "Sales"},
        )

    @pytest.mark.asyncio
    async def test_update_template_and_unwrap_result(self):
        """Should update a template and unwrap result"""
        self.mock_client.patch = AsyncMock(
            return_value={"result": {"id": "t-1", "primaryColor": "#FF0000"}, "message": "Template updated successfully"}
        )

        result = await TurboQuote.update_template("t-1", {"primaryColor": "#FF0000"})

        assert result["primaryColor"] == "#FF0000"
        self.mock_client.patch.assert_called_once_with(
            "/v1/quote-templates/t-1",
            {"primaryColor": "#FF0000"},
        )

    @pytest.mark.asyncio
    async def test_delete_template(self):
        """Should delete a template"""
        self.mock_client.delete = AsyncMock(return_value={"message": "Template deleted successfully"})

        result = await TurboQuote.delete_template("t-1")

        assert result["message"] == "Template deleted successfully"
        self.mock_client.delete.assert_called_once_with("/v1/quote-templates/t-1")


# ============================================
# TYPES / CATEGORIES
# ============================================


class TestTypesCategories:
    """Test Type/Category operations"""

    @pytest.fixture(autouse=True)
    def setup(self):
        TurboQuote._client = None
        self.mock_client = AsyncMock()
        TurboQuote._client = self.mock_client

    @pytest.mark.asyncio
    async def test_list_types_by_category(self):
        """Should list types by category"""
        mock_response = {"results": [{"id": "type-1", "name": "Technology"}], "totalRecords": 1}
        self.mock_client.get = AsyncMock(return_value=mock_response)

        result = await TurboQuote.list_types({"categoryType": "company_industry"})

        assert len(result["results"]) == 1
        self.mock_client.get.assert_called_once_with(
            "/v1/types",
            {"categoryType": "company_industry"},
        )

    @pytest.mark.asyncio
    async def test_list_types_without_options(self):
        """Should list types without options"""
        mock_response = {"results": [], "totalRecords": 0}
        self.mock_client.get = AsyncMock(return_value=mock_response)

        result = await TurboQuote.list_types()

        assert len(result["results"]) == 0
        self.mock_client.get.assert_called_once_with("/v1/types", None)

    @pytest.mark.asyncio
    async def test_create_type_and_unwrap_result(self):
        """Should create a type and unwrap result"""
        mock_type = {"id": "type-1", "name": "SaaS", "categoryType": "product_category"}
        self.mock_client.post = AsyncMock(
            return_value={"result": mock_type, "message": "Type created successfully"}
        )

        result = await TurboQuote.create_type({"name": "SaaS", "categoryType": "product_category"})

        assert result["name"] == "SaaS"

    @pytest.mark.asyncio
    async def test_update_type_and_unwrap_result(self):
        """Should update a type and unwrap result"""
        self.mock_client.patch = AsyncMock(
            return_value={"result": {"id": "type-1", "name": "Software"}, "message": "Type updated successfully"}
        )

        result = await TurboQuote.update_type("type-1", {"name": "Software"})

        assert result["name"] == "Software"

    @pytest.mark.asyncio
    async def test_delete_type(self):
        """Should delete a type"""
        self.mock_client.delete = AsyncMock(return_value={"message": "Type deleted successfully"})

        result = await TurboQuote.delete_type("type-1")

        assert result["message"] == "Type deleted successfully"


# ============================================
# CONVENIENCE -- create_and_send
# ============================================


class TestCreateAndSend:
    """Test createAndSend convenience method"""

    @pytest.fixture(autouse=True)
    def setup(self):
        TurboQuote._client = None
        self.mock_client = AsyncMock()
        TurboQuote._client = self.mock_client

    @pytest.mark.asyncio
    async def test_create_quote_add_items_and_send(self):
        """Should create a quote, add items, and send in one call"""
        mock_quote = {"id": "q-1", "name": "Enterprise License", "status": "draft"}
        mock_items = {"results": [{"id": "li-1"}], "message": "1 line item(s) added successfully"}
        mock_send_response = {"result": {**mock_quote, "status": "sent"}, "message": "Sent"}

        self.mock_client.post = AsyncMock(
            side_effect=[
                {"result": mock_quote, "message": "Quote created successfully"},
                mock_items,
                mock_send_response,
            ]
        )

        result = await TurboQuote.create_and_send({
            "name": "Enterprise License",
            "companyId": "c-1",
            "contactId": "ct-1",
            "items": [{"productId": "p-1", "productName": "Widget", "unitPrice": 99, "billingFrequency": "monthly", "quantity": 10}],
            "send": {"ccEmails": ["admin@example.com"]},
        })

        assert result["quote"]["status"] == "sent"
        assert "documentId" not in result

        post_calls = self.mock_client.post.call_args_list
        assert post_calls[0][0][0] == "/v1/quotes"
        assert post_calls[1][0][0] == "/v1/quotes/q-1/items"
        assert post_calls[2][0][0] == "/v1/quotes/q-1/send"

    @pytest.mark.asyncio
    async def test_create_and_send_without_items(self):
        """Should create and send without items"""
        mock_quote = {"id": "q-1", "name": "Simple Quote", "status": "draft"}
        mock_send_response = {"result": {**mock_quote, "status": "sent"}, "message": "Sent"}

        self.mock_client.post = AsyncMock(
            side_effect=[
                {"result": mock_quote, "message": "Quote created successfully"},
                mock_send_response,
            ]
        )

        result = await TurboQuote.create_and_send({
            "name": "Simple Quote",
            "companyId": "c-1",
            "contactId": "ct-1",
        })

        assert result["quote"]["status"] == "sent"
        post_calls = self.mock_client.post.call_args_list
        assert len(post_calls) == 2
        assert post_calls[0][0][0] == "/v1/quotes"
        assert post_calls[1][0][0] == "/v1/quotes/q-1/send"

    @pytest.mark.asyncio
    async def test_create_and_send_with_bundle_items(self):
        """Should create and send with bundle items"""
        mock_quote = {"id": "q-1", "name": "Bundle Quote", "status": "draft"}
        mock_bundle_items = {"results": [{"id": "li-1", "lineItemType": "bundle"}], "message": "1 bundle(s) added successfully"}
        mock_send_response = {"result": {**mock_quote, "status": "sent"}, "message": "Sent"}

        self.mock_client.post = AsyncMock(
            side_effect=[
                {"result": mock_quote, "message": "Quote created successfully"},
                mock_bundle_items,
                mock_send_response,
            ]
        )

        result = await TurboQuote.create_and_send({
            "name": "Bundle Quote",
            "companyId": "c-1",
            "contactId": "ct-1",
            "bundleItems": [{"bundleId": "b-1", "bundleName": "Starter Pack"}],
        })

        assert result["quote"]["status"] == "sent"
        post_calls = self.mock_client.post.call_args_list
        assert post_calls[1][0][0] == "/v1/quotes/q-1/items/bundle"


# ============================================
# ERROR HANDLING
# ============================================


class TestErrorHandling:
    """Test error handling"""

    @pytest.fixture(autouse=True)
    def setup(self):
        TurboQuote._client = None
        self.mock_client = AsyncMock()
        TurboQuote._client = self.mock_client

    @pytest.mark.asyncio
    async def test_propagate_api_errors(self):
        """Should propagate API errors from HttpClient"""
        api_error = Exception("Quote not found")
        self.mock_client.get = AsyncMock(side_effect=api_error)

        with pytest.raises(Exception, match="Quote not found"):
            await TurboQuote.get_quote("invalid")

    @pytest.mark.asyncio
    async def test_propagate_validation_errors(self):
        """Should propagate validation errors"""
        validation_error = Exception("Name is required")
        self.mock_client.post = AsyncMock(side_effect=validation_error)

        with pytest.raises(Exception, match="Name is required"):
            await TurboQuote.create_quote({"name": "", "companyId": "c-1", "contactId": "ct-1"})


# ============================================
# INPUT MUTATION
# ============================================


class TestInputMutation:
    """Test that SDK methods do not mutate caller input"""

    def test_build_product_form_data_does_not_mutate_input(self):
        """_build_product_form_data should not modify the caller's dict."""
        from turbodocx_sdk.modules.quote import _build_product_form_data

        request = {
            "name": "Test Product",
            "listPrice": 99.99,
            "images": [b"\x89PNG\r\n\x1a\n" + b"\x00" * 100],
        }
        original_keys = set(request.keys())
        _build_product_form_data(request)
        assert set(request.keys()) == original_keys, "Input dict was mutated — 'images' key was removed"
        assert "images" in request


# ============================================
# TYPEDDICT REQUIRED vs OPTIONAL FIELDS
# ============================================


class TestTypedDictRequiredFields:
    """Test that TypedDicts have correct required/optional field separation"""

    def test_create_quote_request_required_keys(self):
        from turbodocx_sdk.types.quote import CreateQuoteRequest

        assert "name" in CreateQuoteRequest.__required_keys__
        assert "companyId" in CreateQuoteRequest.__required_keys__
        assert "contactId" in CreateQuoteRequest.__required_keys__
        assert "currency" in CreateQuoteRequest.__optional_keys__
        assert "termDays" in CreateQuoteRequest.__optional_keys__

    def test_create_product_request_required_keys(self):
        from turbodocx_sdk.types.product import CreateProductRequest

        assert "name" in CreateProductRequest.__required_keys__
        assert "listPrice" in CreateProductRequest.__required_keys__
        assert "billingFrequency" in CreateProductRequest.__required_keys__
        assert "categoryId" in CreateProductRequest.__required_keys__
        assert "sku" in CreateProductRequest.__optional_keys__
        assert "description" in CreateProductRequest.__optional_keys__

    def test_create_company_request_required_keys(self):
        from turbodocx_sdk.types.company import CreateCompanyRequest

        assert "name" in CreateCompanyRequest.__required_keys__
        assert "contacts" in CreateCompanyRequest.__required_keys__
        assert "phone" in CreateCompanyRequest.__optional_keys__
        assert "city" in CreateCompanyRequest.__optional_keys__

    def test_create_contact_request_required_keys(self):
        from turbodocx_sdk.types.contact import CreateContactRequest

        assert "name" in CreateContactRequest.__required_keys__
        assert "companyId" in CreateContactRequest.__required_keys__
        assert "email" in CreateContactRequest.__optional_keys__
        assert "phone" in CreateContactRequest.__optional_keys__

    def test_create_price_book_request_required_keys(self):
        from turbodocx_sdk.types.pricebook import CreatePriceBookRequest

        assert "name" in CreatePriceBookRequest.__required_keys__
        assert "priceBookTypeId" in CreatePriceBookRequest.__required_keys__
        assert "validFrom" in CreatePriceBookRequest.__required_keys__
        assert "discountPercent" in CreatePriceBookRequest.__optional_keys__
        assert "description" in CreatePriceBookRequest.__optional_keys__

    def test_create_bundle_request_required_keys(self):
        from turbodocx_sdk.types.bundle import CreateBundleRequest

        assert "name" in CreateBundleRequest.__required_keys__
        assert "categoryId" in CreateBundleRequest.__required_keys__
        assert "items" in CreateBundleRequest.__optional_keys__

    def test_add_line_item_request_required_keys(self):
        from turbodocx_sdk.types.quote_line_item import AddLineItemRequest

        assert "productName" in AddLineItemRequest.__required_keys__
        assert "unitPrice" in AddLineItemRequest.__required_keys__
        assert "billingFrequency" in AddLineItemRequest.__required_keys__
        assert "quantity" in AddLineItemRequest.__optional_keys__
        assert "discountType" in AddLineItemRequest.__optional_keys__
        assert "discountPercent" in AddLineItemRequest.__optional_keys__
        assert "discountAmount" in AddLineItemRequest.__optional_keys__

    def test_add_bundle_line_item_request_required_keys(self):
        from turbodocx_sdk.types.quote_line_item import AddBundleLineItemRequest

        assert "bundleId" in AddBundleLineItemRequest.__required_keys__
        assert "bundleName" in AddBundleLineItemRequest.__required_keys__
        assert "quantity" in AddBundleLineItemRequest.__optional_keys__
        assert "discountType" in AddBundleLineItemRequest.__optional_keys__
        assert "discountPercent" in AddBundleLineItemRequest.__optional_keys__
        assert "discountAmount" in AddBundleLineItemRequest.__optional_keys__

    def test_send_quote_with_deliverable_request_required_keys(self):
        from turbodocx_sdk.types.quote import SendQuoteWithDeliverableRequest

        assert "deliverableId" in SendQuoteWithDeliverableRequest.__required_keys__
        assert "mergePosition" in SendQuoteWithDeliverableRequest.__required_keys__
        assert "ccEmails" in SendQuoteWithDeliverableRequest.__optional_keys__

    def test_create_and_send_request_required_keys(self):
        from turbodocx_sdk.types.quote import CreateAndSendRequest

        assert "name" in CreateAndSendRequest.__required_keys__
        assert "companyId" in CreateAndSendRequest.__required_keys__
        assert "contactId" in CreateAndSendRequest.__required_keys__
        assert "currency" in CreateAndSendRequest.__optional_keys__
        assert "items" in CreateAndSendRequest.__optional_keys__

    def test_create_quote_type_request_required_keys(self):
        from turbodocx_sdk.types.quote_type import CreateQuoteTypeRequest

        assert "name" in CreateQuoteTypeRequest.__required_keys__
        assert "categoryType" in CreateQuoteTypeRequest.__required_keys__


# ============================================
# IMAGE MIME TYPE DETECTION
# ============================================


class TestProductImageMimeDetection:
    """Test that product image uploads detect MIME type via magic bytes"""

    def test_png_image_bytes_detected_as_image_png(self):
        """_build_product_form_data should detect PNG bytes and set correct MIME type"""
        from turbodocx_sdk.modules.quote import _build_product_form_data

        png_magic = b"\x89PNG\r\n\x1a\n" + b"\x00" * 100
        request = {"name": "Widget", "listPrice": 99, "images": [png_magic]}

        _, files = _build_product_form_data(request)

        assert len(files) == 1
        field_name, (filename, content, mime_type) = files[0]
        assert mime_type != "application/octet-stream", (
            "Image MIME should be detected from magic bytes, not hardcoded as application/octet-stream"
        )

    def test_jpeg_image_bytes_detected_correctly(self):
        """_build_product_form_data should detect JPEG bytes"""
        from turbodocx_sdk.modules.quote import _build_product_form_data

        jpeg_magic = b"\xff\xd8\xff\xe0" + b"\x00" * 100
        request = {"name": "Widget", "listPrice": 99, "images": [jpeg_magic]}

        _, files = _build_product_form_data(request)

        assert len(files) == 1
        _, (filename, content, mime_type) = files[0]
        assert mime_type != "application/octet-stream"
