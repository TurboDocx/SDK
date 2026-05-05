"""
TypedDict definitions for TurboQuote -- Line Item entity.
"""

from typing import Any, Dict, List, Optional
from typing_extensions import TypedDict


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
    product: Dict[str, Any]  # Product
    childLineItems: List[Dict[str, Any]]  # LineItem[]


class AddLineItemRequest(TypedDict, total=False):
    productId: Optional[str]
    productName: str
    unitPrice: float
    billingFrequency: str  # BillingFrequency literal
    quantity: int
    discountPercent: float
    categoryId: Optional[str]
    categoryName: Optional[str]
    cost: Optional[float]
    productSku: Optional[str]
    productDescription: Optional[str]


class AddBundleLineItemRequest(TypedDict, total=False):
    bundleId: str
    bundleName: str
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
    results: List[Dict[str, Any]]
    totalRecords: int
