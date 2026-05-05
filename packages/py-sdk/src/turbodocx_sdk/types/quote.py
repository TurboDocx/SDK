"""
TypedDict definitions for TurboQuote -- Quote entity and request/response types.
"""

from __future__ import annotations

from typing import Any, Dict, List, Optional
from typing_extensions import Literal, TypedDict

from .company import Company
from .contact import Contact
from .quote_line_item import LineItem, AddLineItemRequest, AddBundleLineItemRequest
from .pricebook import PriceBook


class QuoteStatusInfo(TypedDict):
    currentStatus: str
    canSend: bool
    canAccept: bool
    canDecline: bool
    canVoid: bool
    isTerminal: bool


class Quote(TypedDict, total=False):
    id: str
    orgId: str
    quoteNumber: str
    name: str
    status: str  # QuoteStatus literal
    companyId: str
    contactId: str
    priceBookId: Optional[str]
    termDays: int
    renewalPeriod: Optional[str]  # RenewalPeriod literal
    sentAt: Optional[str]
    validUntil: Optional[str]
    taxRate: Optional[float]
    currency: str  # Currency literal
    subtotalMonthly: float
    subtotalQuarterly: float
    subtotalAnnual: float
    subtotalOneTime: float
    taxAmount: float
    grandTotal: float
    isActive: bool
    createdBy: Optional[str]
    createdOn: str
    updatedOn: str
    company: Company
    contact: Contact
    lineItems: List[LineItem]
    priceBook: PriceBook
    creator: Dict[str, Any]
    statusInfo: QuoteStatusInfo


# ============================================
# REQUEST TYPES
# ============================================

class CreateQuoteRequest(TypedDict, total=False):
    name: str
    companyId: str
    contactId: str
    currency: str  # Currency literal
    termDays: int
    renewalPeriod: Optional[str]  # RenewalPeriod literal
    validUntil: Optional[str]
    taxRate: Optional[float]
    priceBookId: Optional[str]


class UpdateQuoteRequest(TypedDict, total=False):
    name: str
    companyId: str
    contactId: str
    termDays: int
    renewalPeriod: Optional[str]
    validUntil: Optional[str]
    taxRate: Optional[float]
    currency: str
    priceBookId: Optional[str]


class ListQuotesOptions(TypedDict, total=False):
    limit: int
    offset: int
    query: str
    statuses: Any  # QuoteStatus | List[QuoteStatus]
    companyId: str
    contactId: str
    currency: str


class SendQuoteRequest(TypedDict, total=False):
    ccEmails: List[str]
    validUntil: str


class SendQuoteWithDeliverableRequest(TypedDict, total=False):
    deliverableId: str
    mergePosition: str  # 'beginning' | 'end'
    ccEmails: List[str]


class SendQuoteResponse(TypedDict):
    quote: Quote
    message: str


class SendQuoteWithDeliverableResponse(TypedDict):
    quote: Quote
    message: str
    documentId: str


class DeclineQuoteRequest(TypedDict):
    reason: str


class VoidQuoteRequest(TypedDict):
    reason: str


class ApplyPriceBookResponse(TypedDict):
    quote: Quote
    message: str
    updatedCount: int
    skippedCount: int


class HandleExpiredQuoteRequest(TypedDict):
    action: str  # 'void' | 'decline'
    reason: str
    newValidUntil: str


class CreateAndSendRequest(TypedDict, total=False):
    name: str
    companyId: str
    contactId: str
    currency: str
    termDays: int
    renewalPeriod: Optional[str]
    validUntil: Optional[str]
    taxRate: Optional[float]
    priceBookId: Optional[str]
    items: List[AddLineItemRequest]
    bundleItems: List[AddBundleLineItemRequest]
    send: SendQuoteRequest


class CreateAndSendResponse(TypedDict):
    quote: Quote


# ============================================
# RESPONSE TYPES
# ============================================

class PipelineEntry(TypedDict):
    currency: str
    total: float


class QuoteListStats(TypedDict, total=False):
    total: int
    draft: int
    sent: int
    accepted: int
    declined: int
    voided: int
    totalPipeline: List[PipelineEntry]
    activeQuotes: int
    monthlyRecurringRevenue: List[PipelineEntry]
    winRate: float
    avgMargin: float
    quotesThisMonth: int


class QuoteListResponse(TypedDict, total=False):
    results: List[Quote]
    totalRecords: int
    stats: QuoteListStats
