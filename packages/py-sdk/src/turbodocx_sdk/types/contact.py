"""
TypedDict definitions for TurboQuote -- Contact entity.
"""

from typing import Any, Dict, List, Optional
from typing_extensions import TypedDict


class Contact(TypedDict, total=False):
    id: str
    orgId: str
    companyId: str
    name: str
    email: Optional[str]
    phone: Optional[str]
    title: Optional[str]
    isActive: bool
    createdBy: Optional[str]
    createdOn: str
    updatedOn: str
    company: Dict[str, Any]  # Company


class CreateContactRequest(TypedDict, total=False):
    name: str
    companyId: str
    email: Optional[str]
    phone: Optional[str]
    title: Optional[str]


class UpdateContactRequest(TypedDict, total=False):
    name: str
    email: Optional[str]
    phone: Optional[str]
    title: Optional[str]


class ListContactsOptions(TypedDict, total=False):
    limit: int
    offset: int
    query: str
    companyId: str


class ContactListResponse(TypedDict):
    results: List[Dict[str, Any]]
    totalRecords: int
