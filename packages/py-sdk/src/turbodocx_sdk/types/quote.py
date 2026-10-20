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


class QuotePreparedBy(TypedDict, total=False):
    """The resolved "Prepared by" identity shown on the quote PDF and preview, returned by
    get_quote alongside the quote.

    Resolved server-side, not derived from ``creator``: it applies the org quote template
    first, then the creator, and for a quote created by an API key it yields the API key's
    label with no email (an API key has no mailbox). Prefer this over ``creator`` for any
    customer-facing display — ``creator`` may be the internal API service account.

    Both keys are optional: a quote can have no resolvable sender email (e.g. an API-created
    quote whose org template has no sender email). Render a placeholder for an absent key.
    """

    name: str
    email: str


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
    # Folded on by get_quote from the response's sibling "preparedBy". See QuotePreparedBy.
    preparedBy: QuotePreparedBy
    # list_quotes only: how many line items the quote has
    lineItemCount: int
    # list_quotes only: the quote's signature request has expired
    isSignatureExpired: bool
    # list_quotes only: a draft or sent quote past its Valid until day (UTC), or whose
    # signature expired. The same rule as the "expired" status filter.
    isExpired: bool


# ============================================
# REQUEST TYPES
# ============================================

class _CreateQuoteRequestRequired(TypedDict):
    name: str
    companyId: str
    contactId: str


class CreateQuoteRequest(_CreateQuoteRequestRequired, total=False):
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


# A quote list status filter: a stored status, or "expired" (a draft or sent quote past its
# Valid until day, or whose signature expired). "expired" is not a stored status.
QuoteListStatusFilter = Literal["draft", "sent", "accepted", "declined", "voided", "expired"]

QuoteSortBy = Literal["updatedOn", "createdOn", "total", "validUntil", "quoteNumber"]

# thisWeek = today through today + 6, thisMonth = the current calendar month, past = before today (UTC)
QuoteValidUntilWindow = Literal["thisWeek", "thisMonth", "past"]


class QuoteSummaryOptions(TypedDict, total=False):
    """The filters shared by list_quotes and get_quote_summary. Multi-value keys take a str or a list."""

    query: str
    statuses: Any  # QuoteListStatusFilter | List[QuoteListStatusFilter]
    companyId: str
    companyIds: Any  # str | List[str]
    contactId: str
    currency: Any  # Currency | List[Currency]
    currencies: Any  # Currency | List[Currency]
    createdBy: Any  # user id(s) -- see list_quote_creators
    createdByApiKeys: bool
    validUntilWindow: str  # QuoteValidUntilWindow literal
    validUntilFrom: str  # YYYY-MM-DD, inclusive
    validUntilTo: str  # YYYY-MM-DD, inclusive
    summaryCurrency: str  # Currency literal


class ListQuotesOptions(QuoteSummaryOptions, total=False):
    limit: int
    offset: int
    sortBy: str  # QuoteSortBy literal; default createdOn newest first
    sortDirection: str  # SortDirection literal


class SendQuoteRequest(TypedDict, total=False):
    ccEmails: List[str]
    validUntil: str


class _SendQuoteWithDeliverableRequestRequired(TypedDict):
    deliverableId: str
    mergePosition: str  # 'beginning' | 'end'


class SendQuoteWithDeliverableRequest(_SendQuoteWithDeliverableRequestRequired, total=False):
    ccEmails: List[str]


class SendQuoteResponse(TypedDict):
    quote: Quote
    message: str


class SendQuoteWithDeliverableResponse(TypedDict):
    quote: Quote
    message: str
    documentId: str


class DeclineQuoteRequest(TypedDict, total=False):
    # Optional because a draft quote never reached the customer; a sent quote still needs one.
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


class _CreateAndSendRequestRequired(TypedDict):
    name: str
    companyId: str
    contactId: str


class CreateAndSendRequest(_CreateAndSendRequestRequired, total=False):
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


class QuoteStatusCounts(TypedDict):
    """Quotes per list tab: every filter applies except statuses. expired overlaps draft and sent."""

    all: int
    draft: int
    sent: int
    accepted: int
    declined: int
    voided: int
    expired: int


class QuoteSummary(TypedDict, total=False):
    """The quote list's summary cards, in one currency."""

    currency: str
    openPipeline: Dict[str, Any]  # {total, count}: draft + sent quotes that aren't expired
    completed: Dict[str, Any]  # {accepted, declined}
    createdThisMonth: Dict[str, Any]  # {count}
    waitingToSign: Dict[str, Any]  # {count}: sent quotes that aren't expired
    wonThisMonth: Dict[str, Any]  # {count}
    currencies: List[str]
    winRate: Dict[str, Any]  # {percent (None when none decided), accepted, declined, windowDays}
    monthlyRecurring: Dict[str, Any]  # {total, count}


class QuoteCreator(TypedDict):
    """Someone who created quotes in the org: a person, or an API key."""

    id: str  # the value for the createdBy filter
    name: str
    email: Optional[str]  # None for an API key
    isAPIKey: bool
    apiKeyDeleted: bool


class NextQuoteNumber(TypedDict):
    nextNumber: str
    sequence: int
    canEdit: bool  # whether the caller can change numbering (administrators)


class OpenQuoteSummary(TypedDict):
    id: str
    quoteNumber: str
    name: Optional[str]
    status: str
    updatedOn: str


class OpenQuotesResponse(TypedDict):
    """The open quotes that block deleting a company or contact: the newest 50, and how many in all."""

    results: List[OpenQuoteSummary]
    totalRecords: int


class LineItemImage(TypedDict, total=False):
    """An image on a custom line item (a line with no catalog product)."""

    id: str
    lineItemId: str
    fileId: str
    displayOrder: int
    fileName: str
    fileType: str
    imageData: str  # base64 data URL


# Dict mapping lineItemId -> List[LineItemImage]
QuoteLineItemImagesResponse = Dict[str, List[LineItemImage]]


class QuoteListResponse(TypedDict, total=False):
    results: List[Quote]
    totalRecords: int
    stats: QuoteListStats
    statusCounts: QuoteStatusCounts
    summary: QuoteSummary


# ============================================
# QUOTE NUMBER CONFIG
# ============================================

class QuoteNumberFormat(TypedDict):
    prefix: str
    yearToken: Literal["none", "two", "four"]
    monthToken: Literal["off", "two"]
    separator: str
    padWidth: int  # 0-12
    suffix: str
    startNumber: int  # >= 0
    resetCadence: Literal["never", "yearly", "monthly"]


class QuoteNumberConfig(TypedDict):
    format: QuoteNumberFormat
    currentFloor: int  # per-period issued floor
