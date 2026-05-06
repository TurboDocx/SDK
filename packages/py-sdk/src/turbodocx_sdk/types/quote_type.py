"""
TypedDict definitions for TurboQuote -- Type/Category entity.
"""

from __future__ import annotations

from typing import Any, Dict, List, Optional
from typing_extensions import TypedDict


class QuoteTypeUsage(TypedDict, total=False):
    inUse: bool
    usageCount: int
    usedIn: List[str]


class QuoteType(TypedDict, total=False):
    id: str
    orgId: str
    name: str
    categoryType: str  # CategoryType literal
    isDefault: bool
    isActive: bool
    createdBy: Optional[str]
    createdOn: str
    updatedOn: str
    usage: QuoteTypeUsage


class _CreateQuoteTypeRequestRequired(TypedDict):
    name: str
    categoryType: str  # CategoryType literal


class CreateQuoteTypeRequest(_CreateQuoteTypeRequestRequired, total=False):
    pass


class UpdateQuoteTypeRequest(TypedDict, total=False):
    name: str


class ListTypesOptions(TypedDict, total=False):
    limit: int
    offset: int
    query: str
    categoryType: str  # CategoryType literal
    includeUsage: bool


class QuoteTypeListResponse(TypedDict):
    results: List[QuoteType]
    totalRecords: int
