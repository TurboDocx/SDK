"""
TurboQuote: list sorting and filters, the quote summary / creators / next number reads,
open quotes, product quote images, custom line item images, named duplicates, company
email and price book reset.
"""

import pytest
from unittest.mock import AsyncMock

from turbodocx_sdk import TurboQuote

PNG = bytes([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 0x00])
JPEG = bytes([0xFF, 0xD8, 0xFF, 0xE0, 0x00])


class TestListsReadsAndImages:
    @pytest.fixture(autouse=True)
    def setup(self):
        TurboQuote._client = None
        self.mock_client = AsyncMock()
        TurboQuote._client = self.mock_client

    # ============================================
    # SORTING AND FILTERS
    # ============================================

    @pytest.mark.asyncio
    async def test_list_quotes_sends_sort_new_filters_and_summary_currency(self):
        self.mock_client.get = AsyncMock(return_value={"results": [], "totalRecords": 0})

        await TurboQuote.list_quotes({
            "sortBy": "total",
            "sortDirection": "asc",
            "statuses": ["sent", "expired"],
            "companyIds": ["c-1", "c-2"],
            "currencies": ["USD", "EUR"],
            "createdBy": ["u-1"],
            "createdByApiKeys": True,
            "validUntilWindow": "thisMonth",
            "validUntilFrom": "2026-10-01",
            "validUntilTo": "2026-10-31",
            "summaryCurrency": "EUR",
        })

        self.mock_client.get.assert_called_once_with("/v1/quotes", {
            "sortBy": "total",
            "sortDirection": "asc",
            "statuses": ["sent", "expired"],
            "companyIds": ["c-1", "c-2"],
            "currencies": ["USD", "EUR"],
            "createdBy": ["u-1"],
            "createdByApiKeys": "true",
            "validUntilWindow": "thisMonth",
            "validUntilFrom": "2026-10-01",
            "validUntilTo": "2026-10-31",
            "summaryCurrency": "EUR",
        })

    @pytest.mark.asyncio
    async def test_list_quotes_still_takes_one_currency(self):
        self.mock_client.get = AsyncMock(return_value={"results": [], "totalRecords": 0})

        await TurboQuote.list_quotes({"currency": "GBP", "companyId": "c-1"})

        self.mock_client.get.assert_called_once_with("/v1/quotes", {"currency": "GBP", "companyId": "c-1"})

    @pytest.mark.asyncio
    async def test_list_quotes_returns_tab_counts_summary_and_expiry_flag(self):
        self.mock_client.get = AsyncMock(return_value={
            "results": [{"id": "q-1", "status": "sent", "isExpired": True, "lineItemCount": 3}],
            "totalRecords": 1,
            "statusCounts": {"all": 1, "sent": 1, "expired": 1},
            "summary": {"currency": "USD", "winRate": {"percent": None, "accepted": 0, "declined": 0, "windowDays": 90}},
        })

        result = await TurboQuote.list_quotes()

        assert result["statusCounts"]["expired"] == 1
        assert result["summary"]["winRate"]["percent"] is None
        assert result["results"][0]["isExpired"] is True
        assert result["results"][0]["lineItemCount"] == 3

    @pytest.mark.asyncio
    async def test_list_products_sends_several_billing_frequencies_currencies_and_sort(self):
        self.mock_client.get = AsyncMock(return_value={"results": [], "totalRecords": 0})

        await TurboQuote.list_products({
            "billingFrequency": ["monthly", "annual"],
            "currency": ["USD", "INR"],
            "sortBy": "listPrice",
            "sortDirection": "desc",
        })

        self.mock_client.get.assert_called_once_with("/v1/products", {
            "billingFrequency": ["monthly", "annual"],
            "currency": ["USD", "INR"],
            "sortBy": "listPrice",
            "sortDirection": "desc",
        })

    @pytest.mark.asyncio
    async def test_list_price_books_sends_sort(self):
        self.mock_client.get = AsyncMock(return_value={"results": [{"id": "pb-1", "overrideCount": 2}], "totalRecords": 1})

        result = await TurboQuote.list_price_books({"sortBy": "overrideCount", "sortDirection": "desc"})

        self.mock_client.get.assert_called_once_with("/v1/pricebooks", {"sortBy": "overrideCount", "sortDirection": "desc"})
        assert result["results"][0]["overrideCount"] == 2

    @pytest.mark.asyncio
    async def test_list_bundles_sends_several_currencies_and_sort(self):
        self.mock_client.get = AsyncMock(return_value={
            "results": [{"id": "b-1", "itemCount": 2, "billingTotals": {"monthly": 100, "one-time": 500}}],
            "totalRecords": 1,
        })

        result = await TurboQuote.list_bundles({"currency": ["USD", "EUR"], "sortBy": "itemCount", "sortDirection": "asc"})

        self.mock_client.get.assert_called_once_with("/v1/bundles", {
            "currency": ["USD", "EUR"],
            "sortBy": "itemCount",
            "sortDirection": "asc",
        })
        assert result["results"][0]["billingTotals"]["one-time"] == 500

    @pytest.mark.asyncio
    async def test_list_companies_sends_sort(self):
        self.mock_client.get = AsyncMock(return_value={"results": [{"id": "c-1", "email": "ap@acme.test"}], "totalRecords": 1})

        result = await TurboQuote.list_companies({"sortBy": "contactCount", "sortDirection": "desc"})

        self.mock_client.get.assert_called_once_with("/v1/companies", {"sortBy": "contactCount", "sortDirection": "desc"})
        assert result["results"][0]["email"] == "ap@acme.test"

    @pytest.mark.asyncio
    async def test_list_contacts_sends_several_companies_and_sort(self):
        self.mock_client.get = AsyncMock(return_value={"results": [], "totalRecords": 0})

        await TurboQuote.list_contacts({"companyIds": ["c-1", "c-2"], "sortBy": "name", "sortDirection": "asc"})

        self.mock_client.get.assert_called_once_with("/v1/contacts", {
            "companyIds": ["c-1", "c-2"],
            "sortBy": "name",
            "sortDirection": "asc",
        })

    @pytest.mark.asyncio
    async def test_list_company_contacts_sends_sort_and_returns_contact_count(self):
        self.mock_client.get = AsyncMock(return_value={
            "results": [], "totalRecords": 0, "company": {"id": "c-1", "contactCount": 1},
        })

        result = await TurboQuote.list_company_contacts("c-1", {"sortBy": "createdOn", "sortDirection": "desc"})

        self.mock_client.get.assert_called_once_with(
            "/v1/companies/c-1/contacts", {"sortBy": "createdOn", "sortDirection": "desc"}
        )
        assert result["company"]["contactCount"] == 1

    @pytest.mark.asyncio
    async def test_list_types_sends_sort(self):
        self.mock_client.get = AsyncMock(return_value={"results": [], "totalRecords": 0})

        await TurboQuote.list_types({"categoryType": "product_category", "sortBy": "usageCount", "sortDirection": "desc"})

        self.mock_client.get.assert_called_once_with("/v1/types", {
            "categoryType": "product_category",
            "sortBy": "usageCount",
            "sortDirection": "desc",
        })

    # ============================================
    # QUOTE READS
    # ============================================

    @pytest.mark.asyncio
    async def test_get_quote_summary_unwraps_the_summary(self):
        summary = {"currency": "EUR", "openPipeline": {"total": 10, "count": 1}}
        self.mock_client.get = AsyncMock(return_value={"summary": summary})

        result = await TurboQuote.get_quote_summary({"currencies": ["EUR", "USD"], "summaryCurrency": "EUR"})

        self.mock_client.get.assert_called_once_with(
            "/v1/quotes/summary", {"currencies": ["EUR", "USD"], "summaryCurrency": "EUR"}
        )
        assert result == summary

    @pytest.mark.asyncio
    async def test_get_quote_summary_without_options_sends_no_params(self):
        self.mock_client.get = AsyncMock(return_value={"summary": {"currency": "USD"}})

        await TurboQuote.get_quote_summary()

        self.mock_client.get.assert_called_once_with("/v1/quotes/summary", None)

    @pytest.mark.asyncio
    async def test_list_quote_creators(self):
        creators = [
            {"id": "u-1", "name": "Ana Lee", "email": "ana@acme.test", "isAPIKey": False, "apiKeyDeleted": False},
            {"id": "u-2", "name": "Zapier key", "email": None, "isAPIKey": True, "apiKeyDeleted": True},
        ]
        self.mock_client.get = AsyncMock(return_value={"results": creators})

        result = await TurboQuote.list_quote_creators()

        self.mock_client.get.assert_called_once_with("/v1/quotes/creators")
        assert result == creators

    @pytest.mark.asyncio
    async def test_get_next_quote_number(self):
        self.mock_client.get = AsyncMock(
            return_value={"results": {"nextNumber": "Q-2026-0042", "sequence": 42, "canEdit": True}}
        )

        result = await TurboQuote.get_next_quote_number()

        self.mock_client.get.assert_called_once_with("/v1/quotes/number-config/next")
        assert result == {"nextNumber": "Q-2026-0042", "sequence": 42, "canEdit": True}

    # ============================================
    # OPEN QUOTES
    # ============================================

    @pytest.mark.asyncio
    async def test_get_company_open_quotes(self):
        response = {
            "results": [{"id": "q-1", "quoteNumber": "Q-1", "name": "Renewal", "status": "sent", "updatedOn": "2026-10-01"}],
            "totalRecords": 1,
        }
        self.mock_client.get = AsyncMock(return_value=response)

        result = await TurboQuote.get_company_open_quotes("c-1")

        self.mock_client.get.assert_called_once_with("/v1/companies/c-1/open-quotes")
        assert result == response

    @pytest.mark.asyncio
    async def test_get_contact_open_quotes(self):
        self.mock_client.get = AsyncMock(return_value={"results": [], "totalRecords": 0})

        result = await TurboQuote.get_contact_open_quotes("ct-1")

        self.mock_client.get.assert_called_once_with("/v1/contacts/ct-1/open-quotes")
        assert result["totalRecords"] == 0

    # ============================================
    # IMAGES
    # ============================================

    @pytest.mark.asyncio
    async def test_get_product_quote_images(self):
        images = {"p-1": [{"id": "i-1", "productId": "p-1", "displayOrder": 0}], "p-2": []}
        self.mock_client.post = AsyncMock(return_value={"results": images})

        result = await TurboQuote.get_product_quote_images(["p-1", "p-2"])

        self.mock_client.post.assert_called_once_with("/v1/products/quote-images", {"productIds": ["p-1", "p-2"]})
        assert result == images

    @pytest.mark.asyncio
    async def test_get_quote_line_item_images(self):
        by_item = {"li-1": [{"id": "img-1", "lineItemId": "li-1", "displayOrder": 0}]}
        self.mock_client.get = AsyncMock(return_value={"results": by_item})

        result = await TurboQuote.get_quote_line_item_images("q-1")

        self.mock_client.get.assert_called_once_with("/v1/quotes/q-1/items/images")
        assert result == by_item

    @pytest.mark.asyncio
    async def test_get_line_item_images(self):
        images = [{"id": "img-1", "lineItemId": "li-1", "displayOrder": 0}]
        self.mock_client.get = AsyncMock(return_value={"results": images})

        result = await TurboQuote.get_line_item_images("q-1", "li-1")

        self.mock_client.get.assert_called_once_with("/v1/quotes/q-1/items/li-1/images")
        assert result == images

    @pytest.mark.asyncio
    async def test_add_line_item_images_uploads_images_parts_with_detected_types(self):
        self.mock_client.post_form_data = AsyncMock(
            return_value={"results": [{"id": "img-1"}, {"id": "img-2"}], "message": "Images added"}
        )

        result = await TurboQuote.add_line_item_images("q-1", "li-1", [PNG, JPEG])

        path, data, files = self.mock_client.post_form_data.call_args[0]
        assert path == "/v1/quotes/q-1/items/li-1/images"
        # Images only: no JSON "data" part
        assert data == {}
        assert [field for field, _ in files] == ["images", "images"]
        assert files[0][1][2] == "image/png"
        assert files[1][1][2] == "image/jpeg"
        assert result == [{"id": "img-1"}, {"id": "img-2"}]

    @pytest.mark.asyncio
    async def test_reorder_line_item_images(self):
        self.mock_client.put = AsyncMock(return_value={"results": [{"id": "img-2"}, {"id": "img-1"}]})

        result = await TurboQuote.reorder_line_item_images("q-1", "li-1", ["img-2", "img-1"])

        self.mock_client.put.assert_called_once_with(
            "/v1/quotes/q-1/items/li-1/images/order", {"imageIds": ["img-2", "img-1"]}
        )
        assert result == [{"id": "img-2"}, {"id": "img-1"}]

    @pytest.mark.asyncio
    async def test_remove_line_item_image(self):
        self.mock_client.delete = AsyncMock(return_value={"results": [{"id": "img-2"}], "message": "Image removed"})

        result = await TurboQuote.remove_line_item_image("q-1", "li-1", "img-1")

        self.mock_client.delete.assert_called_once_with("/v1/quotes/q-1/items/li-1/images/img-1")
        assert result == [{"id": "img-2"}]

    # ============================================
    # NAMED DUPLICATES
    # ============================================

    DUPLICATES = [
        ("duplicate_quote", "/v1/quotes/x-1/duplicate"),
        ("duplicate_product", "/v1/products/x-1/duplicate"),
        ("duplicate_price_book", "/v1/pricebooks/x-1/duplicate"),
        ("duplicate_bundle", "/v1/bundles/x-1/duplicate"),
    ]

    @pytest.mark.asyncio
    @pytest.mark.parametrize("method,path", DUPLICATES)
    async def test_duplicate_sends_the_name_for_the_copy(self, method, path):
        self.mock_client.post = AsyncMock(return_value={"result": {"id": "x-2", "name": "Q4 copy"}})

        result = await getattr(TurboQuote, method)("x-1", name="Q4 copy")

        self.mock_client.post.assert_called_once_with(path, {"name": "Q4 copy"})
        assert result == {"id": "x-2", "name": "Q4 copy"}

    @pytest.mark.asyncio
    @pytest.mark.parametrize("method,path", DUPLICATES)
    async def test_duplicate_without_a_name_sends_no_body(self, method, path):
        self.mock_client.post = AsyncMock(return_value={"result": {"id": "x-2"}})

        await getattr(TurboQuote, method)("x-1")

        self.mock_client.post.assert_called_once_with(path)

    # ============================================
    # REQUEST FIELDS
    # ============================================

    @pytest.mark.asyncio
    async def test_create_company_sends_the_company_email(self):
        self.mock_client.post = AsyncMock(return_value={"result": {"id": "c-1"}})

        await TurboQuote.create_company({
            "name": "Acme",
            "email": "ap@acme.test",
            "contacts": [{"name": "Ana", "email": "ana@acme.test"}],
        })

        body = self.mock_client.post.call_args[0][1]
        assert body["email"] == "ap@acme.test"

    @pytest.mark.asyncio
    async def test_update_company_sends_an_explicit_null_email(self):
        self.mock_client.patch = AsyncMock(return_value={"result": {"id": "c-1"}})

        await TurboQuote.update_company("c-1", {"email": None})

        self.mock_client.patch.assert_called_once_with("/v1/companies/c-1", {"email": None})

    @pytest.mark.asyncio
    async def test_update_price_book_sends_reset_product_pricing(self):
        self.mock_client.patch = AsyncMock(return_value={"result": {"id": "pb-1"}})

        await TurboQuote.update_price_book("pb-1", {"resetProductPricing": True})

        self.mock_client.patch.assert_called_once_with("/v1/pricebooks/pb-1", {"resetProductPricing": True})
