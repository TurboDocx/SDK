"""
Response normalizer for MySQL type coercion.

MySQL returns tinyint(1) as 0/1 and decimal columns as strings.
This normalizer converts them to proper Python types so SDK consumers
get the types declared in the TypedDict definitions.
"""

from typing import Any, TypeVar

T = TypeVar("T")

BOOLEAN_FIELDS = {
    "isActive",
    "isDefault",
    "showInCatalog",
    "showInQuoteBuilder",
    "showItemsToEndUser",
    "syncWithProducts",
    "isPrimaryAdmin",
    # Partner user permissions -- these are the only 7 the API returns.
    "canManageOrgs",
    "canManageOrgUsers",
    "canManagePartnerUsers",
    "canManageOrgAPIKeys",
    "canManagePartnerAPIKeys",
    "canUpdateEntitlements",
    "canViewAuditLogs",
    "hasFileDownload",
    "hasGDrive",
    "hasWrike",
    "hasSalesforce",
    "hasConnectWise",
    "rdWatermark",
    "hasKnowledgeBase",
    "hasAI",
    "hasTurboSign",
    "hasTurboQuote",
}

DECIMAL_FIELDS = {
    "listPrice",
    "cost",
    "unitPrice",
    "discountPercent",
    "subtotal",
    "grandTotal",
    "subtotalMonthly",
    "subtotalQuarterly",
    "subtotalAnnual",
    "subtotalOneTime",
    "taxAmount",
    "taxRate",
    "bundleDiscountPercent",
    "totalListPrice",
    "totalFinalPrice",
    "totalCost",
    "finalPrice",
    "marginPercent",
}


def normalize_response(data: Any) -> Any:
    """
    Recursively normalize API response data.

    - Converts known boolean fields from 0/1 (MySQL tinyint) to bool.
    - Converts known decimal fields from string (MySQL decimal) to float.
    - Recurses into nested dicts and lists.
    - Does not mutate the original data.

    Args:
        data: The response data to normalize.

    Returns:
        Normalized copy of the data.
    """
    if data is None:
        return data

    if not isinstance(data, (dict, list)):
        return data

    if isinstance(data, list):
        return [normalize_response(item) for item in data]

    result = {}
    for key, value in data.items():
        if key in BOOLEAN_FIELDS and (value == 0 or value == 1) and isinstance(value, int) and not isinstance(value, bool):
            result[key] = value == 1
        elif key in DECIMAL_FIELDS and isinstance(value, str):
            try:
                parsed = float(value)
                result[key] = parsed
            except (ValueError, TypeError):
                result[key] = value
        elif isinstance(value, (dict, list)):
            result[key] = normalize_response(value)
        else:
            result[key] = value
    return result
