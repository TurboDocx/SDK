"""
Deliverable Module - Document generation and management operations

Provides operations for generating documents from templates,
managing deliverables, and downloading files:
- generate_deliverable
- list_deliverables
- get_deliverable_details
- update_deliverable_info
- delete_deliverable
- download_source_file
- download_pdf
- list_deliverable_items
- get_deliverable_item
"""

from typing import Any, Dict, List, Optional, Union
from urllib.parse import urlencode

from ..http import HttpClient


class Deliverable:
    """Deliverable module for document generation and management"""

    _client: Optional[HttpClient] = None

    @classmethod
    def configure(
        cls,
        api_key: Optional[str] = None,
        access_token: Optional[str] = None,
        base_url: str = "https://api.turbodocx.com",
        org_id: Optional[str] = None
    ) -> None:
        """
        Configure the Deliverable module with API credentials

        Args:
            api_key: TurboDocx API key (required)
            access_token: OAuth2 access token (alternative to API key)
            base_url: Base URL for the API (optional, defaults to https://api.turbodocx.com)
            org_id: Organization ID (required)

        Example:
            >>> Deliverable.configure(
            ...     api_key=os.environ.get("TURBODOCX_API_KEY"),
            ...     org_id=os.environ.get("TURBODOCX_ORG_ID"),
            ... )
        """
        cls._client = HttpClient(
            api_key=api_key,
            access_token=access_token,
            base_url=base_url,
            org_id=org_id,
            skip_sender_validation=True,
        )

    @classmethod
    def _get_client(cls) -> HttpClient:
        """Get the HTTP client instance, raising error if not configured"""
        if cls._client is None:
            raise RuntimeError(
                "Deliverable not configured. Call Deliverable.configure(api_key='...', org_id='...') first."
            )
        return cls._client

    # ============================================
    # DELIVERABLE CRUD
    # ============================================

    @classmethod
    async def list_deliverables(
        cls,
        *,
        limit: Optional[int] = None,
        offset: Optional[int] = None,
        query: Optional[str] = None,
        show_tags: Optional[bool] = None,
    ) -> Dict[str, Any]:
        """
        List deliverables with pagination, search, and filtering

        Args:
            limit: Number of results per page (1-100, default 6)
            offset: Number of results to skip for pagination (default 0)
            query: Search query to filter by name
            show_tags: Include tags in the response

        Returns:
            Dict with 'results' (list of deliverables) and 'totalRecords' (int)

        Example:
            >>> result = await Deliverable.list_deliverables(limit=10, show_tags=True)
            >>> print(f"Found {result['totalRecords']} deliverables")
        """
        client = cls._get_client()
        params: Dict[str, Any] = {}

        if limit is not None:
            params["limit"] = limit
        if offset is not None:
            params["offset"] = offset
        if query is not None:
            params["query"] = query
        if show_tags is not None:
            params["showTags"] = show_tags

        path = "/v1/deliverable"
        if params:
            path += "?" + urlencode(params)

        return await client.get(path)

    @classmethod
    async def generate_deliverable(
        cls,
        *,
        name: str,
        template_id: str,
        variables: List[Dict[str, Any]],
        description: Optional[str] = None,
        tags: Optional[List[str]] = None,
    ) -> Dict[str, Any]:
        """
        Generate a new deliverable document from a template with variable substitution

        Args:
            name: Deliverable name (3-255 characters)
            template_id: Template ID to generate from
            variables: Array of variable dicts for substitution.
                Each variable should have: placeholder, text (or variableStack), mimeType
            description: Description (up to 65,535 characters)
            tags: Array of tag strings to associate

        Returns:
            Dict with 'results' containing the created deliverable

        Example:
            >>> result = await Deliverable.generate_deliverable(
            ...     name="Employee Contract - John Smith",
            ...     template_id="your-template-id",
            ...     variables=[
            ...         {"placeholder": "{EmployeeName}", "text": "John Smith", "mimeType": "text"},
            ...     ],
            ...     tags=["hr", "contract"],
            ... )
            >>> print(f"Generated: {result['results']['deliverable']['id']}")
        """
        client = cls._get_client()

        body: Dict[str, Any] = {
            "name": name,
            "templateId": template_id,
            "variables": variables,
        }
        if description is not None:
            body["description"] = description
        if tags is not None:
            body["tags"] = tags

        return await client.post("/v1/deliverable", data=body)

    @classmethod
    async def get_deliverable_details(
        cls,
        deliverable_id: str,
        *,
        show_tags: Optional[bool] = None,
    ) -> Dict[str, Any]:
        """
        Get full details of a single deliverable, including variables, fonts, and template info

        Args:
            deliverable_id: Deliverable UUID
            show_tags: Include tags in the response

        Returns:
            Dict with full deliverable details (unwrapped from 'results')

        Example:
            >>> details = await Deliverable.get_deliverable_details("deliverable-uuid", show_tags=True)
            >>> print(details["name"], details.get("variables"))
        """
        client = cls._get_client()
        params: Dict[str, Any] = {}
        if show_tags is not None:
            params["showTags"] = show_tags

        path = f"/v1/deliverable/{deliverable_id}"
        if params:
            path += "?" + urlencode(params)

        response = await client.get(path)
        return response["results"]

    @classmethod
    async def update_deliverable_info(
        cls,
        deliverable_id: str,
        *,
        name: Optional[str] = None,
        description: Optional[str] = None,
        tags: Optional[List[str]] = None,
    ) -> Dict[str, Any]:
        """
        Update a deliverable's name, description, or tags

        Note: When providing tags, all existing tags are replaced.
        To add a tag, include the full list. To remove all, pass an empty list.

        Args:
            deliverable_id: Deliverable UUID
            name: Updated name (3-255 characters)
            description: Updated description (up to 65,535 characters)
            tags: Replace all tags (existing tags are removed first)

        Returns:
            Dict with 'message' and 'deliverableId'

        Example:
            >>> result = await Deliverable.update_deliverable_info(
            ...     "deliverable-uuid",
            ...     name="Updated Contract Name",
            ...     tags=["hr", "finalized"],
            ... )
        """
        client = cls._get_client()

        body: Dict[str, Any] = {}
        if name is not None:
            body["name"] = name
        if description is not None:
            body["description"] = description
        if tags is not None:
            body["tags"] = tags

        return await client.patch(f"/v1/deliverable/{deliverable_id}", data=body)

    @classmethod
    async def delete_deliverable(cls, deliverable_id: str) -> Dict[str, Any]:
        """
        Soft-delete a deliverable. The deliverable is marked as inactive
        and will no longer appear in list results, but its data is retained.

        Args:
            deliverable_id: Deliverable UUID

        Returns:
            Dict with 'message' and 'deliverableId'

        Example:
            >>> result = await Deliverable.delete_deliverable("deliverable-uuid")
            >>> print(result["message"])
        """
        client = cls._get_client()
        return await client.delete(f"/v1/deliverable/{deliverable_id}")

    # ============================================
    # FILE DOWNLOADS
    # ============================================

    @classmethod
    async def download_source_file(cls, deliverable_id: str) -> bytes:
        """
        Download the original source file (DOCX or PPTX) of a deliverable

        Requires the hasFileDownload feature to be enabled on your organization's license.

        Args:
            deliverable_id: Deliverable UUID

        Returns:
            Raw file content as bytes

        Example:
            >>> content = await Deliverable.download_source_file("deliverable-uuid")
            >>> with open("contract.docx", "wb") as f:
            ...     f.write(content)
        """
        client = cls._get_client()
        return await client.get_raw(f"/v1/deliverable/file/{deliverable_id}")

    @classmethod
    async def download_pdf(cls, deliverable_id: str) -> bytes:
        """
        Download the PDF version of a deliverable

        Args:
            deliverable_id: Deliverable UUID

        Returns:
            Raw PDF content as bytes

        Example:
            >>> content = await Deliverable.download_pdf("deliverable-uuid")
            >>> with open("contract.pdf", "wb") as f:
            ...     f.write(content)
        """
        client = cls._get_client()
        return await client.get_raw(f"/v1/deliverable/file/pdf/{deliverable_id}")

    # ============================================
    # DELIVERABLE ITEMS
    # ============================================

    @classmethod
    async def list_deliverable_items(
        cls,
        *,
        limit: Optional[int] = None,
        offset: Optional[int] = None,
        query: Optional[str] = None,
        show_tags: Optional[bool] = None,
        selected_tags: Optional[Union[str, List[str]]] = None,
        column0: Optional[str] = None,
        order0: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        List all deliverable items in your library with filtering and pagination

        Args:
            limit: Number of results per page (1-100, default 6)
            offset: Number of results to skip for pagination (default 0)
            query: Search query to filter by name
            show_tags: Include tags in the response
            selected_tags: Filter by tag IDs (all must match - AND logic)
            column0: Sort column (createdOn, email, name, updatedOn)
            order0: Sort direction (asc, desc)

        Returns:
            Dict with 'results' (list of items) and 'totalRecords' (int)

        Example:
            >>> result = await Deliverable.list_deliverable_items(limit=20, show_tags=True)
            >>> print(f"Found {result['totalRecords']} items")
        """
        client = cls._get_client()
        params: Dict[str, Any] = {}

        if limit is not None:
            params["limit"] = limit
        if offset is not None:
            params["offset"] = offset
        if query is not None:
            params["query"] = query
        if show_tags is not None:
            params["showTags"] = show_tags
        if selected_tags is not None:
            if isinstance(selected_tags, list):
                params["selectedTags"] = selected_tags
            else:
                params["selectedTags"] = selected_tags
        if column0 is not None:
            params["column0"] = column0
        if order0 is not None:
            params["order0"] = order0

        path = "/v1/deliverable-item"
        if params:
            path += "?" + urlencode(params, doseq=True)

        return await client.get(path)

    @classmethod
    async def get_deliverable_item(
        cls,
        item_id: str,
        *,
        show_tags: Optional[bool] = None,
    ) -> Dict[str, Any]:
        """
        Get a single deliverable item by ID

        Args:
            item_id: Deliverable item UUID
            show_tags: Include tags in the response

        Returns:
            Dict with 'results' (the item) and 'type' (item type)

        Example:
            >>> item = await Deliverable.get_deliverable_item("item-uuid", show_tags=True)
            >>> print(item["type"], item["results"]["name"])
        """
        client = cls._get_client()
        params: Dict[str, Any] = {}
        if show_tags is not None:
            params["showTags"] = show_tags

        path = f"/v1/deliverable-item/{item_id}"
        if params:
            path += "?" + urlencode(params)

        return await client.get(path)
