"""
TypedDict definitions for TurboQuote -- Quote entity and request/response types.
"""

from typing import Any, Dict, List, Optional
from typing_extensions import Literal, TypedDict


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
    company: Dict[str, Any]  # Company
    contact: Dict[str, Any]  # Contact
    lineItems: List[Dict[str, Any]]  # LineItem[]
    priceBook: Dict[str, Any]  # PriceBook
    creator: Dict[str, Any]
    statusInfo: Dict[str, Any]  # QuoteStatusInfo


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
    quote: Dict[str, Any]  # Quote
    message: str


class SendQuoteWithDeliverableResponse(TypedDict):
    quote: Dict[str, Any]  # Quote
    message: str
    documentId: str


class DeclineQuoteRequest(TypedDict):
    reason: str


class VoidQuoteRequest(TypedDict):
    reason: str


class ApplyPriceBookResponse(TypedDict):
    quote: Dict[str, Any]  # Quote
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
    items: List[Dict[str, Any]]  # AddLineItemRequest[]
    bundleItems: List[Dict[str, Any]]  # AddBundleLineItemRequest[]
    send: Dict[str, Any]  # SendQuoteRequest


class CreateAndSendResponse(TypedDict):
    quote: Dict[str, Any]  # Quote


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
    totalPipeline: List[Dict[str, Any]]  # PipelineEntry[]
    activeQuotes: int
    monthlyRecurringRevenue: List[Dict[str, Any]]  # PipelineEntry[]
    winRate: float
    avgMargin: float
    quotesThisMonth: int


class QuoteListResponse(TypedDict, total=False):
    results: List[Dict[str, Any]]  # Quote[]
    totalRecords: int
    stats: Dict[str, Any]  # QuoteListStats
