"""
TypedDict definitions for TurboQuote -- PriceBook entity.
"""

from __future__ import annotations

from typing import Any, Dict, List, Optional
from typing_extensions import TypedDict

from .product import Product
from .quote_shared import DiscountType


class PriceBookProductPricing(TypedDict, total=False):
    id: str
    priceBookId: str
    productId: str
    discountPercent: float
    finalPrice: float
    orgId: str
    isActive: bool
    createdBy: Optional[str]
    createdOn: str
    updatedOn: str
    product: Product


class PriceBook(TypedDict, total=False):
    id: str
    orgId: str
    name: str
    description: Optional[str]
    priceBookTypeId: str
    discountPercent: float
    validFrom: str
    validTo: Optional[str]
    isDefault: bool
    showInQuoteBuilder: bool
    isActive: bool
    createdBy: Optional[str]
    createdOn: str
    updatedOn: str
    productPricing: List[PriceBookProductPricing]
    priceBookType: Dict[str, Any]
    productCount: int
    # list_price_books only: products with their own price in this book
    overrideCount: int


class PriceBookProductPricingInput(TypedDict, total=False):
    productId: str
    discountType: DiscountType
    discountPercent: float
    discountAmount: float
    finalPrice: float


class _CreatePriceBookRequestRequired(TypedDict):
    name: str
    priceBookTypeId: str
    validFrom: str


class CreatePriceBookRequest(_CreatePriceBookRequestRequired, total=False):
    discountPercent: float
    description: str
    validTo: str
    isDefault: bool
    showInQuoteBuilder: bool
    productPricing: List[PriceBookProductPricingInput]


class UpdatePriceBookRequest(TypedDict, total=False):
    name: str
    priceBookTypeId: str
    description: str
    discountPercent: float
    validFrom: str
    validTo: str
    isDefault: bool
    showInQuoteBuilder: bool
    productPricing: List[PriceBookProductPricingInput]
    # Put every product back on the book's discount (before any productPricing in the request)
    resetProductPricing: bool


class ListPriceBooksOptions(TypedDict, total=False):
    limit: int
    offset: int
    query: str
    priceBookTypeIds: Any  # string | string[]
    showInQuoteBuilder: bool
    # "name" | "discountPercent" | "overrideCount" | "validFrom" | "validTo" | "createdOn"
    sortBy: str
    sortDirection: str  # "asc" | "desc"


class ListPriceBookProductsOptions(TypedDict, total=False):
    limit: int
    offset: int
    query: str
    categoryIds: Any  # string | string[]


class PriceBookListResponse(TypedDict, total=False):
    results: List[PriceBook]
    totalRecords: int
    totalPriceBooks: int
    activeInBuilder: int
    totalProducts: int
    defaultPriceBookName: Optional[str]


class PriceBookProductListResponse(TypedDict):
    results: List[PriceBookProductPricing]
    totalRecords: int
