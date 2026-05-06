"""
TypedDict definitions for TurboQuote -- Line Item entity.
"""

from __future__ import annotations

from typing import Any, Dict, List, Optional
from typing_extensions import TypedDict

from .product import Product


class LineItem(TypedDict, total=False):
    id: str
    orgId: str
    quoteId: str
    lineItemType: str  # LineItemType literal
    parentLineItemId: Optional[str]
    productId: Optional[str]
    productName: Optional[str]
    productSku: Optional[str]
    productDescription: Optional[str]
    bundleId: Optional[str]
    bundleName: Optional[str]
    bundleDescription: Optional[str]
    quantity: int
    unitPrice: float
    discountPercent: float
    subtotal: float
    cost: Optional[float]
    marginPercent: Optional[float]
    categoryId: Optional[str]
    categoryName: Optional[str]
    billingFrequency: Optional[str]  # BillingFrequency literal
    showItemsToEndUser: bool
    isActive: bool
    createdBy: Optional[str]
    createdOn: str
    updatedOn: str
    product: Product
    childLineItems: List[LineItem]


class _AddLineItemRequestRequired(TypedDict):
    productName: str
    unitPrice: float
    billingFrequency: str  # BillingFrequency literal


class AddLineItemRequest(_AddLineItemRequestRequired, total=False):
    productId: Optional[str]
    quantity: int
    discountPercent: float
    categoryId: Optional[str]
    categoryName: Optional[str]
    cost: Optional[float]
    productSku: Optional[str]
    productDescription: Optional[str]


class _AddBundleLineItemRequestRequired(TypedDict):
    bundleId: str
    bundleName: str


class AddBundleLineItemRequest(_AddBundleLineItemRequestRequired, total=False):
    quantity: int
    discountPercent: float
    bundleDescription: Optional[str]
    showItemsToEndUser: bool


class UpdateLineItemRequest(TypedDict, total=False):
    quantity: int
    unitPrice: float
    discountPercent: float
    billingFrequency: str  # BillingFrequency literal
    categoryId: Optional[str]
    categoryName: Optional[str]
    cost: Optional[float]
    showItemsToEndUser: bool
    productName: str
    productSku: Optional[str]
    productDescription: Optional[str]


class ListLineItemsOptions(TypedDict, total=False):
    limit: int
    offset: int
    lineItemType: str  # LineItemType literal
    billingFrequency: str  # BillingFrequency literal
    parentLineItemId: str


class LineItemListResponse(TypedDict):
    results: List[LineItem]
    totalRecords: int
