"""
TypedDict definitions for TurboQuote -- Bundle entity.
"""

from __future__ import annotations

from typing import Any, Dict, List, Optional
from typing_extensions import Literal, TypedDict

from .product import Product

BundleItemStatus = Literal["active", "product_deleted", "product_unavailable", "currency_mismatch"]


class BundleItem(TypedDict, total=False):
    id: str
    orgId: str
    bundleId: str
    productId: str
    quantity: int
    unitPrice: float
    discountPercent: float
    finalPrice: float
    cost: Optional[float]
    billingFrequency: str  # BillingFrequency literal
    itemStatus: str  # BundleItemStatus literal
    isActive: bool
    createdBy: Optional[str]
    createdOn: str
    updatedOn: str
    product: Product


class Bundle(TypedDict, total=False):
    id: str
    orgId: str
    name: str
    description: Optional[str]
    sku: Optional[str]
    categoryId: Optional[str]
    bundleDiscountPercent: float
    totalListPrice: float
    totalFinalPrice: float
    totalCost: float
    currency: str  # Currency literal
    showItemsToEndUser: bool
    showInCatalog: bool
    syncWithProducts: bool
    isActive: bool
    createdBy: Optional[str]
    createdOn: str
    updatedOn: str
    items: List[BundleItem]
    category: Dict[str, Any]


class BundleItemInput(TypedDict, total=False):
    productId: str
    unitPrice: float
    billingFrequency: str  # BillingFrequency literal
    quantity: int
    discountPercent: float
    finalPrice: float
    cost: Optional[float]


class _CreateBundleRequestRequired(TypedDict):
    name: str


class CreateBundleRequest(_CreateBundleRequestRequired, total=False):
    categoryId: str
    items: List[BundleItemInput]
    description: Optional[str]
    sku: Optional[str]
    bundleDiscountPercent: float
    currency: str  # Currency literal
    showItemsToEndUser: bool
    showInCatalog: bool
    syncWithProducts: bool


class UpdateBundleRequest(TypedDict, total=False):
    name: str
    items: List[BundleItemInput]
    description: Optional[str]
    sku: Optional[str]
    categoryId: str
    bundleDiscountPercent: float
    currency: str  # Currency literal
    showItemsToEndUser: bool
    showInCatalog: bool
    syncWithProducts: bool


class ListBundlesOptions(TypedDict, total=False):
    limit: int
    offset: int
    query: str
    categoryIds: Any  # string | string[]
    currency: str  # Currency literal
    showInCatalog: bool


class BundleListResponse(TypedDict, total=False):
    results: List[Bundle]
    totalRecords: int
    totalBundles: int
    activeBundles: int
    totalCategories: int
    catalogValue: float
