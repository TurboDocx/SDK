"""
TypedDict definitions for TurboQuote -- Contact entity.
"""

from __future__ import annotations

from typing import Any, Dict, List, Optional
from typing_extensions import TypedDict

from .company import Company


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
    company: Company


class _CreateContactRequestRequired(TypedDict):
    name: str
    companyId: str


class CreateContactRequest(_CreateContactRequestRequired, total=False):
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
    results: List[Contact]
    totalRecords: int
