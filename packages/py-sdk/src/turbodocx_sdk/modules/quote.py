"""
TurboQuote Module -- Quoting operations

Provides quote lifecycle management:
- Quotes CRUD (list, create, get, update, delete, duplicate)
- Quote status transitions (send, decline, void, handle expired)
- Quote number config (get / update org-wide quote numbering format)
- Line items (list, add product items, add bundle items, update, remove)
- Products (list, create, get, update, delete, duplicate, primary images)
- Price books (list, create, get, update, delete, duplicate, list products)
- Bundles (list, create, get, update, delete, duplicate)
- Companies (list, create, get, update, delete, list contacts)
- Contacts (list, create, update, delete)
- Templates (list, get, get by ID, create, update, delete)
- Types / categories (list, create, update, delete)
- Convenience (createAndSend)
"""

import json
import os
from typing import Any, Dict, List, Optional, Union

from ..http import HttpClient, detect_file_type
from .sign import TurboSign


def _to_query_params(request: Optional[Dict[str, Any]] = None) -> Optional[Dict[str, Any]]:
    """
    Convert request options dict to query parameter dict.

    - Numbers become strings
    - Booleans become 'true' / 'false'
    - Arrays are preserved as string arrays
    - None values are skipped
    """
    if request is None:
        return None

    params: Dict[str, Any] = {}
    for key, value in request.items():
        if value is None:
            continue
        if isinstance(value, bool):
            params[key] = "true" if value else "false"
        elif isinstance(value, list):
            params[key] = [str(v) for v in value]
        else:
            params[key] = str(value)

    return params if params else None


def _build_product_form_data(request: Dict[str, Any]):
    """
    Build multipart form data for product create/update with images.

    Packs non-image fields into a 'data' JSON string field,
    and images into separate 'images' file fields.

    Returns:
        Tuple of (data_dict, files_list) suitable for HttpClient.*_form_data
    """
    data = dict(request)
    images = data.pop("images", None)
    data_json = json.dumps(data)
    data = {"data": data_json}

    files: List[Any] = []
    if images:
        for image in images:
            if isinstance(image, str):
                with open(image, "rb") as f:
                    file_bytes = f.read()
                file_name = os.path.basename(image)
                mime_type, _ = detect_file_type(file_bytes)
                files.append(("images", (file_name, file_bytes, mime_type)))
            elif isinstance(image, bytes):
                mime_type, ext = detect_file_type(image)
                files.append(("images", (f"image.{ext}", image, mime_type)))
            else:
                file_bytes = image.read() if hasattr(image, "read") else image
                mime_type, ext = detect_file_type(file_bytes if isinstance(file_bytes, bytes) else b"")
                files.append(("images", (getattr(image, "name", f"image.{ext}"), file_bytes, mime_type)))

    return data, files


class TurboQuote:
    """TurboQuote module for quoting operations.

    Uses a static class pattern: configure once, then call class methods.

    Example:
        >>> TurboQuote.configure(api_key="...", org_id="...")
        >>> quote = await TurboQuote.create_quote({"name": "Q1", "companyId": "c-1", "contactId": "ct-1"})
    """

    _client: Optional[HttpClient] = None

    @classmethod
    def configure(
        cls,
        api_key: Optional[str] = None,
        access_token: Optional[str] = None,
        org_id: Optional[str] = None,
        base_url: Optional[str] = None,
    ) -> None:
        """
        Configure the TurboQuote module with API credentials.

        Args:
            api_key: TurboDocx API key
            access_token: OAuth2 access token (alternative to API key)
            org_id: Organization ID
            base_url: API base URL (optional)
        """
        cls._client = HttpClient(
            api_key=api_key,
            access_token=access_token,
            org_id=org_id,
            base_url=base_url,
            skip_sender_validation=True,
        )

    @classmethod
    def _get_client(cls) -> HttpClient:
        """
        Get the HTTP client instance.

        Auto-initializes from env vars if not configured (unlike TurboSign
        which raises RuntimeError). Quotes don't need sender email validation.
        """
        if cls._client is None:
            cls._client = HttpClient(skip_sender_validation=True)
        return cls._client

    @classmethod
    def _unwrap(cls, response: Dict[str, Any]) -> Any:
        """
        Unwrap single-entity backend responses.

        Backend returns { result: T, message?: string } after smartUnwrap
        strips the outer { data: ... } wrapper.
        """
        return response["result"]

    @classmethod
    async def _bulk_import(cls, path: str, rows: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Shared bulk-create helper.

        POSTs the rows wrapped in a { rows } envelope and unwraps the
        { results: { imported, failed, adjusted } } response. Rows are
        passed verbatim (camelCase keys); the backend validates per row
        with PARTIAL SUCCESS -- failed rows are reported, not raised.
        """
        client = cls._get_client()
        response = await client.post(path, {"rows": rows})
        return response["results"]

    # ============================================
    # QUOTES -- CRUD
    # ============================================

    @classmethod
    async def list_quotes(cls, options: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """List quotes with optional pagination and filters."""
        client = cls._get_client()
        return await client.get("/v1/quotes", _to_query_params(options))

    @classmethod
    async def create_quote(cls, request: Dict[str, Any]) -> Dict[str, Any]:
        """Create a new quote."""
        client = cls._get_client()
        return cls._unwrap(await client.post("/v1/quotes", request))

    @classmethod
    async def get_quote(cls, id: str) -> Dict[str, Any]:
        """Get a quote by ID, including statusInfo and preparedBy if available."""
        client = cls._get_client()
        response = await client.get(f"/v1/quotes/{id}")
        quote = response["result"]
        if "statusInfo" in response and response["statusInfo"] is not None:
            quote["statusInfo"] = response["statusInfo"]
        # preparedBy is a sibling of "result" — the resolved "Prepared by" identity. Fold it
        # onto the quote (same pattern as statusInfo); prefer it over "creator" for display.
        if "preparedBy" in response and response["preparedBy"] is not None:
            quote["preparedBy"] = response["preparedBy"]
        return quote

    @classmethod
    async def update_quote(cls, id: str, request: Dict[str, Any]) -> Dict[str, Any]:
        """Update a quote."""
        client = cls._get_client()
        return cls._unwrap(await client.patch(f"/v1/quotes/{id}", request))

    @classmethod
    async def delete_quote(cls, id: str) -> Dict[str, Any]:
        """Delete a quote."""
        client = cls._get_client()
        return await client.delete(f"/v1/quotes/{id}")

    @classmethod
    async def duplicate_quote(cls, id: str) -> Dict[str, Any]:
        """Duplicate a quote."""
        client = cls._get_client()
        return cls._unwrap(await client.post(f"/v1/quotes/{id}/duplicate"))

    @classmethod
    async def apply_price_book(cls, quote_id: str, price_book_id: str) -> Dict[str, Any]:
        """
        Apply a price book to a quote.

        Returns dict with keys: quote, message, updatedCount, skippedCount
        """
        client = cls._get_client()
        response = await client.post(
            f"/v1/quotes/{quote_id}/apply-pricebook",
            {"priceBookId": price_book_id},
        )
        return {
            "quote": response["result"],
            "message": response["message"],
            "updatedCount": response["updatedCount"],
            "skippedCount": response["skippedCount"],
        }

    @classmethod
    async def remove_price_book(cls, quote_id: str) -> Dict[str, Any]:
        """Remove price book from a quote."""
        client = cls._get_client()
        return cls._unwrap(await client.post(f"/v1/quotes/{quote_id}/remove-pricebook"))

    @classmethod
    async def download_quote_pdf(cls, id: str) -> bytes:
        """Download a quote as PDF bytes."""
        client = cls._get_client()
        return await client.get_raw(f"/v1/quotes/{id}/pdf")

    # ============================================
    # QUOTE NUMBER CONFIG
    # ============================================

    @classmethod
    async def get_quote_number_config(cls) -> Dict[str, Any]:
        """
        Get the organization's quote numbering configuration (admin only).

        Returns a dict with keys: format (the numbering format) and currentFloor
        (the per-period issued floor). The backend wraps the payload in
        { results: { format, currentFloor } } after smartUnwrap strips { data: ... }.
        """
        client = cls._get_client()
        response = await client.get("/v1/quotes/number-config")
        return response["results"]

    @classmethod
    async def update_quote_number_config(cls, format: Dict[str, Any]) -> Dict[str, Any]:
        """
        Update the organization's quote numbering format (admin only).

        Args:
            format: The quote number format object. All 8 keys are sent verbatim
                in camelCase (prefix, yearToken, monthToken, separator, padWidth,
                suffix, startNumber, resetCadence); padWidth and startNumber are ints.

        Returns a dict with keys: format and currentFloor.
        """
        client = cls._get_client()
        response = await client.patch("/v1/quotes/number-config", format)
        return response["results"]

    # ============================================
    # QUOTES -- STATUS TRANSITIONS
    # ============================================

    @classmethod
    async def send_quote(
        cls,
        id: str,
        request: Optional[Dict[str, Any]] = None,
        *,
        reminders_enabled: Optional[bool] = None,
        reminder_delay: Optional[Dict[str, Any]] = None,
        reminder_interval: Optional[Dict[str, Any]] = None,
        max_reminders: Optional[int] = None,
        expiration_enabled: Optional[bool] = None,
        expire_after: Optional[Dict[str, Any]] = None,
        expiration_warning: Optional[Dict[str, Any]] = None,
        expiration_warning_interval: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        """
        Send a quote. Returns dict with keys: quote, message.

        `request` carries the send options (`ccEmails`, `validUntil`). Reminder/expiration
        scheduling mirrors `TurboSign.send_signature`: pass the optional snake_case kwargs
        `reminders_enabled` / `reminder_delay` / `reminder_interval` / `max_reminders` and
        `expiration_enabled` / `expire_after` / `expiration_warning` /
        `expiration_warning_interval`. Durations are `{"value": n, "unit": "days"}` dicts.
        Presence is null-checked, so `False`/`0` are honored; omitted kwargs fall back to the
        org default. The cadence layers over org defaults.

        Constraint: the backend pins a quote's expiry to `validUntil`, so `expire_after` is
        ignored when expiration is on (`expiration_enabled` still toggles it), and the
        reminder/warning cadence must fit within `validUntil` or the send is rejected.
        """
        client = cls._get_client()
        body: Dict[str, Any] = dict(request) if request else {}
        TurboSign._apply_schedule_overrides(
            body,
            reminders_enabled=reminders_enabled,
            reminder_delay=reminder_delay,
            reminder_interval=reminder_interval,
            max_reminders=max_reminders,
            expiration_enabled=expiration_enabled,
            expire_after=expire_after,
            expiration_warning=expiration_warning,
            expiration_warning_interval=expiration_warning_interval,
            encode_durations=False,
        )
        response = await client.post(f"/v1/quotes/{id}/send", body or None)
        return {
            "quote": response["result"],
            "message": response["message"],
        }

    @classmethod
    async def send_quote_with_deliverable(
        cls,
        id: str,
        request: Dict[str, Any],
        *,
        reminders_enabled: Optional[bool] = None,
        reminder_delay: Optional[Dict[str, Any]] = None,
        reminder_interval: Optional[Dict[str, Any]] = None,
        max_reminders: Optional[int] = None,
        expiration_enabled: Optional[bool] = None,
        expire_after: Optional[Dict[str, Any]] = None,
        expiration_warning: Optional[Dict[str, Any]] = None,
        expiration_warning_interval: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        """
        Send a quote with an attached deliverable document.

        Returns dict with keys: quote, message, documentId.

        Reminder/expiration scheduling mirrors `TurboSign.send_signature`: pass the optional
        snake_case kwargs `reminders_enabled` / `reminder_delay` / `reminder_interval` /
        `max_reminders` and `expiration_enabled` / `expire_after` / `expiration_warning` /
        `expiration_warning_interval`. Durations are `{"value": n, "unit": "days"}` dicts.
        Presence is null-checked, so `False`/`0` are honored; omitted kwargs fall back to the
        org default. The cadence layers over org defaults.

        Constraint: the backend pins a quote's expiry to `validUntil`, so `expire_after` is
        ignored when expiration is on (`expiration_enabled` still toggles it), and the
        reminder/warning cadence must fit within `validUntil` or the send is rejected.
        """
        client = cls._get_client()
        body: Dict[str, Any] = dict(request) if request else {}
        TurboSign._apply_schedule_overrides(
            body,
            reminders_enabled=reminders_enabled,
            reminder_delay=reminder_delay,
            reminder_interval=reminder_interval,
            max_reminders=max_reminders,
            expiration_enabled=expiration_enabled,
            expire_after=expire_after,
            expiration_warning=expiration_warning,
            expiration_warning_interval=expiration_warning_interval,
            encode_durations=False,
        )
        response = await client.post(f"/v1/quotes/{id}/send-with-deliverable", body)
        return {
            "quote": response["result"],
            "message": response["message"],
            "documentId": response["documentId"],
        }

    @classmethod
    async def decline_quote(cls, id: str, request: Dict[str, Any]) -> Dict[str, Any]:
        """Decline a quote. The reason is optional for a draft, still required once sent."""
        client = cls._get_client()
        return cls._unwrap(await client.post(f"/v1/quotes/{id}/decline", request))

    @classmethod
    async def void_quote(cls, id: str, request: Dict[str, Any]) -> Dict[str, Any]:
        """Void a quote with a reason."""
        client = cls._get_client()
        return cls._unwrap(await client.post(f"/v1/quotes/{id}/void", request))

    @classmethod
    async def handle_expired_quote(cls, id: str, request: Dict[str, Any]) -> Dict[str, Any]:
        """Handle an expired sent quote (void or decline with new valid date)."""
        client = cls._get_client()
        return cls._unwrap(await client.post(f"/v1/quotes/{id}/handle-expired-sent", request))

    # ============================================
    # LINE ITEMS
    # ============================================

    @classmethod
    async def list_line_items(cls, quote_id: str, options: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """List line items for a quote."""
        client = cls._get_client()
        return await client.get(f"/v1/quotes/{quote_id}/items", _to_query_params(options))

    @classmethod
    async def add_line_items(
        cls, quote_id: str, items: Union[Dict[str, Any], List[Dict[str, Any]]]
    ) -> List[Dict[str, Any]]:
        """
        Add product line item(s) to a quote.

        Accepts a single item dict or a list of item dicts (max 50 per request).
        Every item must carry a `productId` key -- set it to None for a custom
        line item that isn't backed by a catalog product.
        Returns a list of created line items.
        """
        client = cls._get_client()
        payload = items if isinstance(items, list) else [items]
        response = await client.post(f"/v1/quotes/{quote_id}/items", payload)
        return response["results"]

    @classmethod
    async def add_bundle_line_items(
        cls, quote_id: str, items: Union[Dict[str, Any], List[Dict[str, Any]]]
    ) -> List[Dict[str, Any]]:
        """
        Add bundle line item(s) to a quote.

        Accepts a single item dict or a list of item dicts.
        Returns a list of created line items.
        """
        client = cls._get_client()
        payload = items if isinstance(items, list) else [items]
        response = await client.post(f"/v1/quotes/{quote_id}/items/bundle", payload)
        return response["results"]

    @classmethod
    async def update_line_item(cls, quote_id: str, item_id: str, request: Dict[str, Any]) -> Dict[str, Any]:
        """Update a line item."""
        client = cls._get_client()
        return cls._unwrap(await client.patch(f"/v1/quotes/{quote_id}/items/{item_id}", request))

    @classmethod
    async def remove_line_item(cls, quote_id: str, item_id: str) -> Dict[str, Any]:
        """Remove a line item from a quote."""
        client = cls._get_client()
        return await client.delete(f"/v1/quotes/{quote_id}/items/{item_id}")

    # ============================================
    # PRODUCTS
    # ============================================

    @classmethod
    async def list_products(cls, options: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """List products with optional filters."""
        client = cls._get_client()
        return await client.get("/v1/products", _to_query_params(options))

    @classmethod
    async def create_product(cls, request: Dict[str, Any]) -> Dict[str, Any]:
        """
        Create a new product.

        If images are provided, uses multipart form upload with a 'data' JSON
        field and separate 'images' file fields.
        """
        client = cls._get_client()
        images = request.get("images")
        if images and len(images) > 0:
            req_copy = dict(request)
            data, files = _build_product_form_data(req_copy)
            return cls._unwrap(await client.post_form_data("/v1/products", data, files))
        return cls._unwrap(await client.post("/v1/products", request))

    @classmethod
    async def bulk_create_products(cls, rows: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Bulk create products (partial success).

        Rows are sent verbatim in a { rows } envelope; returns a dict with
        keys imported, failed, adjusted (failed/adjusted carry 1-indexed
        row + reason).
        """
        return await cls._bulk_import("/v1/products/bulk", rows)

    @classmethod
    async def get_product(cls, id: str) -> Dict[str, Any]:
        """Get a product by ID."""
        client = cls._get_client()
        return cls._unwrap(await client.get(f"/v1/products/{id}"))

    @classmethod
    async def update_product(cls, id: str, request: Dict[str, Any]) -> Dict[str, Any]:
        """
        Update a product.

        If images are provided, uses multipart form upload.
        """
        client = cls._get_client()
        images = request.get("images")
        if images and len(images) > 0:
            req_copy = dict(request)
            data, files = _build_product_form_data(req_copy)
            return cls._unwrap(await client.patch_form_data(f"/v1/products/{id}", data, files))
        return cls._unwrap(await client.patch(f"/v1/products/{id}", request))

    @classmethod
    async def delete_product(cls, id: str) -> Dict[str, Any]:
        """Delete a product."""
        client = cls._get_client()
        return await client.delete(f"/v1/products/{id}")

    @classmethod
    async def duplicate_product(cls, id: str) -> Dict[str, Any]:
        """Duplicate a product."""
        client = cls._get_client()
        return cls._unwrap(await client.post(f"/v1/products/{id}/duplicate"))

    @classmethod
    async def get_product_primary_images(cls, product_ids: List[str]) -> Dict[str, Any]:
        """
        Get primary images for a list of product IDs.

        Returns a dict mapping product ID -> ProductImage or None.
        """
        client = cls._get_client()
        response = await client.post("/v1/products/primary-images", {"productIds": product_ids})
        return response["results"]

    # ============================================
    # PRICE BOOKS
    # ============================================

    @classmethod
    async def list_price_books(cls, options: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """List price books with optional filters."""
        client = cls._get_client()
        return await client.get("/v1/pricebooks", _to_query_params(options))

    @classmethod
    async def create_price_book(cls, request: Dict[str, Any]) -> Dict[str, Any]:
        """Create a new price book."""
        client = cls._get_client()
        # Backend requires discountPercent on POST (omitting it 400s) and rejects null; coerce a
        # missing OR explicit-None value to the documented default 0 (matches JS/Go/PHP/Java).
        dp = request.get("discountPercent")
        body = {**request, "discountPercent": 0 if dp is None else dp}
        return cls._unwrap(await client.post("/v1/pricebooks", body))

    @classmethod
    async def bulk_create_price_books(cls, rows: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Bulk create price books (partial success).

        Rows are sent verbatim in a { rows } envelope; returns a dict with
        keys imported, failed, adjusted (failed/adjusted carry 1-indexed
        row + reason).
        """
        return await cls._bulk_import("/v1/pricebooks/bulk", rows)

    @classmethod
    async def get_price_book(cls, id: str) -> Dict[str, Any]:
        """Get a price book by ID."""
        client = cls._get_client()
        return cls._unwrap(await client.get(f"/v1/pricebooks/{id}"))

    @classmethod
    async def update_price_book(cls, id: str, request: Dict[str, Any]) -> Dict[str, Any]:
        """Update a price book."""
        client = cls._get_client()
        return cls._unwrap(await client.patch(f"/v1/pricebooks/{id}", request))

    @classmethod
    async def delete_price_book(cls, id: str) -> Dict[str, Any]:
        """Delete a price book."""
        client = cls._get_client()
        return await client.delete(f"/v1/pricebooks/{id}")

    @classmethod
    async def duplicate_price_book(cls, id: str) -> Dict[str, Any]:
        """Duplicate a price book."""
        client = cls._get_client()
        return cls._unwrap(await client.post(f"/v1/pricebooks/{id}/duplicate"))

    @classmethod
    async def list_price_book_products(cls, id: str, options: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """List products in a price book."""
        client = cls._get_client()
        return await client.get(f"/v1/pricebooks/{id}/products", _to_query_params(options))

    # ============================================
    # BUNDLES
    # ============================================

    @classmethod
    async def list_bundles(cls, options: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """List bundles with optional filters."""
        client = cls._get_client()
        return await client.get("/v1/bundles", _to_query_params(options))

    @classmethod
    async def create_bundle(cls, request: Dict[str, Any]) -> Dict[str, Any]:
        """Create a new bundle."""
        client = cls._get_client()
        return cls._unwrap(await client.post("/v1/bundles", request))

    @classmethod
    async def bulk_create_bundles(cls, rows: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Bulk create bundles (partial success).

        Rows are sent verbatim in a { rows } envelope; returns a dict with
        keys imported, failed, adjusted (failed/adjusted carry 1-indexed
        row + reason, e.g. a bundle item whose product wasn't found).
        """
        return await cls._bulk_import("/v1/bundles/bulk", rows)

    @classmethod
    async def get_bundle(cls, id: str) -> Dict[str, Any]:
        """Get a bundle by ID."""
        client = cls._get_client()
        return cls._unwrap(await client.get(f"/v1/bundles/{id}"))

    @classmethod
    async def update_bundle(cls, id: str, request: Dict[str, Any]) -> Dict[str, Any]:
        """Update a bundle."""
        client = cls._get_client()
        return cls._unwrap(await client.patch(f"/v1/bundles/{id}", request))

    @classmethod
    async def delete_bundle(cls, id: str) -> Dict[str, Any]:
        """Delete a bundle."""
        client = cls._get_client()
        return await client.delete(f"/v1/bundles/{id}")

    @classmethod
    async def duplicate_bundle(cls, id: str) -> Dict[str, Any]:
        """Duplicate a bundle."""
        client = cls._get_client()
        return cls._unwrap(await client.post(f"/v1/bundles/{id}/duplicate"))

    # ============================================
    # COMPANIES
    # ============================================

    @classmethod
    async def list_companies(cls, options: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """List companies with optional filters."""
        client = cls._get_client()
        return await client.get("/v1/companies", _to_query_params(options))

    @classmethod
    async def create_company(cls, request: Dict[str, Any]) -> Dict[str, Any]:
        """Create a new company."""
        client = cls._get_client()
        return cls._unwrap(await client.post("/v1/companies", request))

    @classmethod
    async def bulk_create_companies(cls, rows: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Bulk create companies (partial success).

        Each row requires a contacts array with at least one contact. Rows
        are sent verbatim in a { rows } envelope; returns a dict with keys
        imported, failed, adjusted (failed/adjusted carry 1-indexed
        row + reason).
        """
        return await cls._bulk_import("/v1/companies/bulk", rows)

    @classmethod
    async def get_company(cls, id: str) -> Dict[str, Any]:
        """Get a company by ID."""
        client = cls._get_client()
        return cls._unwrap(await client.get(f"/v1/companies/{id}"))

    @classmethod
    async def update_company(cls, id: str, request: Dict[str, Any]) -> Dict[str, Any]:
        """Update a company."""
        client = cls._get_client()
        return cls._unwrap(await client.patch(f"/v1/companies/{id}", request))

    @classmethod
    async def delete_company(cls, id: str) -> Dict[str, Any]:
        """Delete a company."""
        client = cls._get_client()
        return await client.delete(f"/v1/companies/{id}")

    @classmethod
    async def list_company_contacts(cls, company_id: str, options: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """List contacts for a company."""
        client = cls._get_client()
        return await client.get(f"/v1/companies/{company_id}/contacts", _to_query_params(options))

    # ============================================
    # CONTACTS
    # ============================================

    @classmethod
    async def list_contacts(cls, options: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """List contacts with optional filters."""
        client = cls._get_client()
        return await client.get("/v1/contacts", _to_query_params(options))

    @classmethod
    async def create_contact(cls, request: Dict[str, Any]) -> Dict[str, Any]:
        """Create a new contact."""
        client = cls._get_client()
        return cls._unwrap(await client.post("/v1/contacts", request))

    @classmethod
    async def bulk_create_contacts(cls, rows: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Bulk create contacts (partial success).

        Each row requires a companyId. Rows are sent verbatim in a { rows }
        envelope; returns a dict with keys imported, failed, adjusted
        (failed/adjusted carry 1-indexed row + reason).
        """
        return await cls._bulk_import("/v1/contacts/bulk", rows)

    @classmethod
    async def update_contact(cls, id: str, request: Dict[str, Any]) -> Dict[str, Any]:
        """Update a contact."""
        client = cls._get_client()
        return cls._unwrap(await client.patch(f"/v1/contacts/{id}", request))

    @classmethod
    async def delete_contact(cls, id: str) -> Dict[str, Any]:
        """Delete a contact."""
        client = cls._get_client()
        return await client.delete(f"/v1/contacts/{id}")

    # ============================================
    # TEMPLATES
    # ============================================

    @classmethod
    async def list_templates(cls, options: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """List quote templates."""
        client = cls._get_client()
        return await client.get("/v1/quote-templates", _to_query_params(options))

    @classmethod
    async def get_template(cls) -> Dict[str, Any]:
        """Get the organization's default quote template."""
        client = cls._get_client()
        return cls._unwrap(await client.get("/v1/quote-template"))

    @classmethod
    async def get_template_by_id(cls, id: str) -> Dict[str, Any]:
        """Get a quote template by ID."""
        client = cls._get_client()
        return cls._unwrap(await client.get(f"/v1/quote-templates/{id}"))

    @classmethod
    async def create_template(cls, request: Dict[str, Any]) -> Dict[str, Any]:
        """Create a new quote template."""
        client = cls._get_client()
        return cls._unwrap(await client.post("/v1/quote-templates", request))

    @classmethod
    async def update_template(cls, id: str, request: Dict[str, Any]) -> Dict[str, Any]:
        """Update a quote template."""
        client = cls._get_client()
        return cls._unwrap(await client.patch(f"/v1/quote-templates/{id}", request))

    @classmethod
    async def delete_template(cls, id: str) -> Dict[str, Any]:
        """Delete a quote template."""
        client = cls._get_client()
        return await client.delete(f"/v1/quote-templates/{id}")

    # ============================================
    # TYPES / CATEGORIES
    # ============================================

    @classmethod
    async def list_types(cls, options: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """List types/categories with optional filters."""
        client = cls._get_client()
        return await client.get("/v1/types", _to_query_params(options))

    @classmethod
    async def create_type(cls, request: Dict[str, Any]) -> Dict[str, Any]:
        """Create a new type/category."""
        client = cls._get_client()
        return cls._unwrap(await client.post("/v1/types", request))

    @classmethod
    async def bulk_create_types(cls, rows: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Bulk create types/categories (partial success).

        Rows are sent verbatim in a { rows } envelope; returns a dict with
        keys imported, failed, adjusted (failed/adjusted carry 1-indexed
        row + reason).
        """
        return await cls._bulk_import("/v1/types/bulk", rows)

    @classmethod
    async def update_type(cls, id: str, request: Dict[str, Any]) -> Dict[str, Any]:
        """Update a type/category."""
        client = cls._get_client()
        return cls._unwrap(await client.patch(f"/v1/types/{id}", request))

    @classmethod
    async def delete_type(cls, id: str) -> Dict[str, Any]:
        """Delete a type/category."""
        client = cls._get_client()
        return await client.delete(f"/v1/types/{id}")

    # ============================================
    # CONVENIENCE
    # ============================================

    @classmethod
    async def create_and_send(cls, request: Dict[str, Any]) -> Dict[str, Any]:
        """
        Create a quote, optionally add line items and/or bundle items, then send.

        This is a convenience method that orchestrates multiple API calls.

        Args:
            request: Dict with keys from CreateQuoteRequest plus optional:
                - items: List of AddLineItemRequest dicts
                - bundleItems: List of AddBundleLineItemRequest dicts
                - send: SendQuoteRequest dict (ccEmails, validUntil, and optionally the eight
                  camelCase reminder/expiration schedule keys — remindersEnabled, reminderDelay,
                  reminderInterval, maxReminders, expirationEnabled, expireAfter,
                  expirationWarning, expirationWarningInterval; durations are {"value", "unit"}).
                  Quote expiry is pinned to validUntil, so expireAfter is ignored when expiration
                  is on (expirationEnabled still toggles it); the reminder/warning cadence must
                  fit within validUntil or the send is rejected.

        Returns:
            Dict with key: quote (the sent quote).
        """
        client = cls._get_client()

        # Extract special fields; the rest is the quote creation payload
        quote_fields = {k: v for k, v in request.items() if k not in ("items", "bundleItems", "send")}
        items = request.get("items")
        bundle_items = request.get("bundleItems")
        send_options = request.get("send")

        # 1. Create quote
        quote = cls._unwrap(await client.post("/v1/quotes", quote_fields))

        # 2. Add product line items
        if items and len(items) > 0:
            await client.post(f"/v1/quotes/{quote['id']}/items", items)

        # 3. Add bundle line items
        if bundle_items and len(bundle_items) > 0:
            await client.post(f"/v1/quotes/{quote['id']}/items/bundle", bundle_items)

        # 4. Send quote — delegate to send_quote so the send dict (including any camelCase
        #    reminder/expiration schedule keys) goes through the exact same serialization path as
        #    a standalone send_quote call, instead of re-posting it here.
        send_response = await cls.send_quote(quote["id"], send_options)

        return {
            "quote": send_response["quote"],
        }
