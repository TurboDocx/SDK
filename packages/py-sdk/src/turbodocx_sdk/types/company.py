"""
TypedDict definitions for TurboQuote -- Company entity.
"""

from typing import Any, Dict, List, Optional
from typing_extensions import TypedDict


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
    industry: Dict[str, Any]  # QuoteType


class CreateCompanyContactInput(TypedDict, total=False):
    name: str
    email: str
    phone: Optional[str]
    title: Optional[str]


class CreateCompanyRequest(TypedDict, total=False):
    name: str
    contacts: List[Dict[str, Any]]  # CreateCompanyContactInput[]
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
    results: List[Dict[str, Any]]
    totalRecords: int
