"""
TypedDict definitions for TurboQuote -- Company entity.
"""

from __future__ import annotations

from typing import Any, Dict, List, Optional
from typing_extensions import TypedDict

from .quote_type import QuoteType


class Company(TypedDict, total=False):
    id: str
    orgId: str
    name: str
    phone: Optional[str]
    city: Optional[str]
    state: Optional[str]
    country: Optional[str]
    industryId: Optional[str]
    lastActivityDate: Optional[str]
    isActive: bool
    createdBy: Optional[str]
    createdOn: str
    updatedOn: str
    contactCount: int
    industry: QuoteType


class CreateCompanyContactInput(TypedDict, total=False):
    name: str
    email: str
    phone: Optional[str]
    title: Optional[str]


class _CreateCompanyRequestRequired(TypedDict):
    name: str
    contacts: List[CreateCompanyContactInput]


class CreateCompanyRequest(_CreateCompanyRequestRequired, total=False):
    phone: Optional[str]
    city: Optional[str]
    state: Optional[str]
    country: Optional[str]
    industryId: Optional[str]


class UpdateCompanyRequest(TypedDict, total=False):
    name: str
    phone: Optional[str]
    city: Optional[str]
    state: Optional[str]
    country: Optional[str]
    industryId: Optional[str]


class ListCompaniesOptions(TypedDict, total=False):
    limit: int
    offset: int
    query: str
    industryIds: Any  # string | string[]


class CompanyListResponse(TypedDict):
    results: List[Company]
    totalRecords: int
