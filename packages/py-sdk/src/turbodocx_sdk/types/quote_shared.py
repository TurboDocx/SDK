"""
Shared types for the TurboQuote module.

Literal types and base TypedDicts used across all quote-related types.
"""

from __future__ import annotations

from typing import Any, Dict, List, Optional
from typing_extensions import Literal, TypedDict

# Literal union types (used as type hints, not runtime values)
QuoteStatus = Literal["draft", "sent", "accepted", "declined", "voided"]

BillingFrequency = Literal["monthly", "quarterly", "annual", "one-time"]

LineItemType = Literal["product", "bundle"]

RenewalPeriod = Literal["weekly", "monthly", "quarterly", "annually"]

Currency = Literal["USD", "EUR", "GBP", "CAD", "AUD", "INR"]

CategoryType = Literal["product_category", "pricebook_type", "company_industry", "bundle_category"]


class PaginationParams(TypedDict, total=False):
    limit: int
    offset: int
    query: str


class PaginatedResponse(TypedDict):
    results: List[Dict[str, Any]]
    totalRecords: int


class SuccessResponse(TypedDict):
    message: str
