"""
TypedDict definitions for TurboQuote -- Product entity.
"""

from typing import Any, Dict, List, Optional, Union
from typing_extensions import TypedDict


class ProductImage(TypedDict, total=False):
    id: str
    productId: str
    fileId: str
    fileName: str
    fileType: str
    displayOrder: int
    imageData: str


class Product(TypedDict, total=False):
    id: str
    orgId: str
    name: str
    sku: Optional[str]
    description: Optional[str]
    detailedSpecification: Optional[str]
    internalNotes: Optional[str]
    categoryId: str
    listPrice: float
    cost: Optional[float]
    minimumOrderQuantity: int
    billingFrequency: str  # BillingFrequency literal
    currency: str  # Currency literal
    showInCatalog: bool
    isActive: bool
    createdBy: Optional[str]
    createdOn: str
    updatedOn: str
    images: List[Dict[str, Any]]  # ProductImage[]
    category: Dict[str, Any]


class CreateProductRequest(TypedDict, total=False):
    name: str
    listPrice: float
    billingFrequency: str  # BillingFrequency literal
    categoryId: str
    sku: str
    description: str
    detailedSpecification: str
    internalNotes: str
    cost: float
    minimumOrderQuantity: int
    currency: str  # Currency literal
    showInCatalog: bool
    images: List[Any]  # Array<string | bytes>


class UpdateProductRequest(TypedDict, total=False):
    name: str
    listPrice: float
    billingFrequency: str  # BillingFrequency literal
    sku: str
    description: str
    detailedSpecification: str
    internalNotes: str
    categoryId: str
    cost: float
    minimumOrderQuantity: int
    currency: str  # Currency literal
    showInCatalog: bool
    images: List[Any]  # Array<string | bytes>
    imageIdsToKeep: List[str]
    imageOrder: List[str]


class ListProductsOptions(TypedDict, total=False):
    limit: int
    offset: int
    query: str
    categoryIds: List[str]
    billingFrequency: str  # BillingFrequency literal
    currency: str  # Currency literal
    showInCatalog: bool


class ProductListResponse(TypedDict, total=False):
    results: List[Dict[str, Any]]
    totalRecords: int
    totalProducts: int
    activeProducts: int
    totalCategories: int
    catalogValue: float


# Dict mapping productId -> ProductImage | None
ProductPrimaryImagesResponse = Dict[str, Any]
