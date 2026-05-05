"""
TypedDict definitions for TurboQuote -- Quote Template entity.
"""

from __future__ import annotations

from typing import Any, Dict, List, Optional
from typing_extensions import TypedDict


class QuoteTemplate(TypedDict, total=False):
    id: str
    orgId: str
    logoUrl: Optional[str]
    primaryColor: str
    primaryTextColor: str
    disclaimer: Optional[str]
    termsAndConditions: Optional[str]
    closingMessage: Optional[str]
    senderName: Optional[str]
    senderPhone: Optional[str]
    senderEmail: Optional[str]
    contactEmail: Optional[str]
    isActive: bool
    createdBy: Optional[str]
    createdOn: str
    updatedOn: str


class CreateQuoteTemplateRequest(TypedDict, total=False):
    logoUrl: str
    primaryColor: str
    primaryTextColor: str
    disclaimer: str
    termsAndConditions: str
    closingMessage: str
    senderName: str
    senderPhone: str
    senderEmail: str
    contactEmail: str


# Same shape as create
UpdateQuoteTemplateRequest = CreateQuoteTemplateRequest


class QuoteTemplateListResponse(TypedDict):
    results: List[QuoteTemplate]
    totalRecords: int
