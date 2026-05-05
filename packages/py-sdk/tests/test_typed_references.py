"""
TypedDict Typed References Tests

Verify that TypedDict fields reference actual typed classes instead of Dict[str, Any],
matching the JS SDK's typed references for parity.
"""

from __future__ import annotations

import sys
from typing import Any, Dict, List, Optional, get_type_hints

import pytest


class TestQuoteTypedReferences:
    """Quote TypedDict should reference typed classes for nested objects"""

    def test_quote_company_references_company_class(self):
        """Quote.company should be Optional[Company], not Dict[str, Any]"""
        from turbodocx_sdk.types.quote import Quote
        from turbodocx_sdk.types.company import Company
        hints = get_type_hints(Quote)
        assert hints["company"] is Company

    def test_quote_contact_references_contact_class(self):
        """Quote.contact should be Optional[Contact], not Dict[str, Any]"""
        from turbodocx_sdk.types.quote import Quote
        from turbodocx_sdk.types.contact import Contact
        hints = get_type_hints(Quote)
        assert hints["contact"] is Contact

    def test_quote_line_items_references_line_item_list(self):
        """Quote.lineItems should be List[LineItem], not List[Dict[str, Any]]"""
        from turbodocx_sdk.types.quote import Quote
        from turbodocx_sdk.types.quote_line_item import LineItem
        hints = get_type_hints(Quote)
        assert hints["lineItems"] == List[LineItem]

    def test_quote_price_book_references_pricebook_class(self):
        """Quote.priceBook should be PriceBook, not Dict[str, Any]"""
        from turbodocx_sdk.types.quote import Quote
        from turbodocx_sdk.types.pricebook import PriceBook
        hints = get_type_hints(Quote)
        assert hints["priceBook"] is PriceBook

    def test_quote_status_info_references_quote_status_info_class(self):
        """Quote.statusInfo should be QuoteStatusInfo, not Dict[str, Any]"""
        from turbodocx_sdk.types.quote import Quote, QuoteStatusInfo
        hints = get_type_hints(Quote)
        assert hints["statusInfo"] is QuoteStatusInfo


class TestLineItemTypedReferences:
    """LineItem TypedDict should reference typed classes for nested objects"""

    def test_line_item_product_references_product_class(self):
        """LineItem.product should be Product, not Dict[str, Any]"""
        from turbodocx_sdk.types.quote_line_item import LineItem
        from turbodocx_sdk.types.product import Product
        hints = get_type_hints(LineItem)
        assert hints["product"] is Product

    def test_line_item_child_line_items_is_self_referencing(self):
        """LineItem.childLineItems should be List[LineItem], not List[Dict[str, Any]]"""
        from turbodocx_sdk.types.quote_line_item import LineItem
        hints = get_type_hints(LineItem)
        assert hints["childLineItems"] == List[LineItem]


class TestContactTypedReferences:
    """Contact TypedDict should reference typed classes for nested objects"""

    def test_contact_company_references_company_class(self):
        """Contact.company should be Company, not Dict[str, Any]"""
        from turbodocx_sdk.types.contact import Contact
        from turbodocx_sdk.types.company import Company
        hints = get_type_hints(Contact)
        assert hints["company"] is Company


class TestCompanyTypedReferences:
    """Company TypedDict should reference typed classes for nested objects"""

    def test_company_industry_references_quote_type_class(self):
        """Company.industry should be QuoteType, not Dict[str, Any]"""
        from turbodocx_sdk.types.company import Company
        from turbodocx_sdk.types.quote_type import QuoteType
        hints = get_type_hints(Company)
        assert hints["industry"] is QuoteType


class TestProductTypedReferences:
    """Product TypedDict should reference typed classes for nested objects"""

    def test_product_images_references_product_image_list(self):
        """Product.images should be List[ProductImage], not List[Dict[str, Any]]"""
        from turbodocx_sdk.types.product import Product, ProductImage
        hints = get_type_hints(Product)
        assert hints["images"] == List[ProductImage]


class TestBundleTypedReferences:
    """Bundle TypedDicts should reference typed classes for nested objects"""

    def test_bundle_item_product_references_product_class(self):
        """BundleItem.product should be Product, not Dict[str, Any]"""
        from turbodocx_sdk.types.bundle import BundleItem
        from turbodocx_sdk.types.product import Product
        hints = get_type_hints(BundleItem)
        assert hints["product"] is Product

    def test_bundle_items_references_bundle_item_list(self):
        """Bundle.items should be List[BundleItem], not List[Dict[str, Any]]"""
        from turbodocx_sdk.types.bundle import Bundle, BundleItem
        hints = get_type_hints(Bundle)
        assert hints["items"] == List[BundleItem]


class TestPriceBookTypedReferences:
    """PriceBook TypedDicts should reference typed classes for nested objects"""

    def test_pricebook_product_pricing_product_references_product_class(self):
        """PriceBookProductPricing.product should be Product, not Dict[str, Any]"""
        from turbodocx_sdk.types.pricebook import PriceBookProductPricing
        from turbodocx_sdk.types.product import Product
        hints = get_type_hints(PriceBookProductPricing)
        assert hints["product"] is Product

    def test_pricebook_product_pricing_references_typed_list(self):
        """PriceBook.productPricing should be List[PriceBookProductPricing], not List[Dict[str, Any]]"""
        from turbodocx_sdk.types.pricebook import PriceBook, PriceBookProductPricing
        hints = get_type_hints(PriceBook)
        assert hints["productPricing"] == List[PriceBookProductPricing]


class TestRequestTypeReferences:
    """Request TypedDicts should also use typed references where applicable"""

    def test_create_company_contacts_references_typed_list(self):
        """CreateCompanyRequest.contacts should be List[CreateCompanyContactInput]"""
        from turbodocx_sdk.types.company import CreateCompanyRequest, CreateCompanyContactInput
        hints = get_type_hints(CreateCompanyRequest)
        assert hints["contacts"] == List[CreateCompanyContactInput]

    def test_create_pricebook_product_pricing_references_typed_list(self):
        """CreatePriceBookRequest.productPricing should be List[PriceBookProductPricingInput]"""
        from turbodocx_sdk.types.pricebook import CreatePriceBookRequest, PriceBookProductPricingInput
        hints = get_type_hints(CreatePriceBookRequest)
        assert hints["productPricing"] == List[PriceBookProductPricingInput]

    def test_update_pricebook_product_pricing_references_typed_list(self):
        """UpdatePriceBookRequest.productPricing should be List[PriceBookProductPricingInput]"""
        from turbodocx_sdk.types.pricebook import UpdatePriceBookRequest, PriceBookProductPricingInput
        hints = get_type_hints(UpdatePriceBookRequest)
        assert hints["productPricing"] == List[PriceBookProductPricingInput]

    def test_create_bundle_items_references_typed_list(self):
        """CreateBundleRequest.items should be List[BundleItemInput]"""
        from turbodocx_sdk.types.bundle import CreateBundleRequest, BundleItemInput
        hints = get_type_hints(CreateBundleRequest)
        assert hints["items"] == List[BundleItemInput]

    def test_update_bundle_items_references_typed_list(self):
        """UpdateBundleRequest.items should be List[BundleItemInput]"""
        from turbodocx_sdk.types.bundle import UpdateBundleRequest, BundleItemInput
        hints = get_type_hints(UpdateBundleRequest)
        assert hints["items"] == List[BundleItemInput]
