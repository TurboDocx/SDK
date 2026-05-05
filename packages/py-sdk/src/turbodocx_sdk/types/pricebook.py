"""
TypedDict definitions for TurboQuote -- PriceBook entity.
"""

from typing import Any, Dict, List, Optional
from typing_extensions import TypedDict


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
    product: Dict[str, Any]  # Product


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
    productPricing: List[Dict[str, Any]]  # PriceBookProductPricing[]
    priceBookType: Dict[str, Any]
    productCount: int


class PriceBookProductPricingInput(TypedDict, total=False):
    productId: str
    discountPercent: float
    finalPrice: float


class CreatePriceBookRequest(TypedDict, total=False):
    name: str
    priceBookTypeId: str
    validFrom: str
    discountPercent: float
    description: str
    validTo: str
    isDefault: bool
    showInQuoteBuilder: bool
    productPricing: List[Dict[str, Any]]  # PriceBookProductPricingInput[]


class UpdatePriceBookRequest(TypedDict, total=False):
    name: str
    priceBookTypeId: str
    description: str
    discountPercent: float
    validFrom: str
    validTo: str
    isDefault: bool
    showInQuoteBuilder: bool
    productPricing: List[Dict[str, Any]]  # PriceBookProductPricingInput[]


class ListPriceBooksOptions(TypedDict, total=False):
    limit: int
    offset: int
    query: str
    priceBookTypeIds: Any  # string | string[]
    showInQuoteBuilder: bool


class ListPriceBookProductsOptions(TypedDict, total=False):
    limit: int
    offset: int
    query: str
    categoryIds: Any  # string | string[]


class PriceBookListResponse(TypedDict, total=False):
    results: List[Dict[str, Any]]
    totalRecords: int
    totalPriceBooks: int
    activeInBuilder: int
    totalProducts: int
    defaultPriceBookName: Optional[str]


class PriceBookProductListResponse(TypedDict):
    results: List[Dict[str, Any]]
    totalRecords: int
