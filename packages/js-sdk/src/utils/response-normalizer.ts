/**
 * Response normalizer for MySQL type coercion.
 *
 * MySQL returns tinyint(1) as 0/1 and decimal columns as strings.
 * This normalizer converts them to proper JS types so SDK consumers
 * get the types declared in the TypeScript interfaces.
 */

const BOOLEAN_FIELDS = new Set([
  'isActive',
  'isDefault',
  'showInCatalog',
  'showInQuoteBuilder',
  'showItemsToEndUser',
  'syncWithProducts',
  'isPrimaryAdmin',
  'canManageOrgs',
  'canManageOrgUsers',
  'canManagePartnerUsers',
  'canManageOrgAPIKeys',
  'canManagePartnerAPIKeys',
  'canUpdateEntitlements',
  'canViewAuditLogs',
  'hasFileDownload',
  'hasGDrive',
  'hasWrike',
  'hasSalesforce',
  'hasConnectWise',
  'rdWatermark',
  'hasKnowledgeBase',
  'hasAI',
  'hasTurboSign',
  'hasTurboQuote',
]);

const DECIMAL_FIELDS = new Set([
  'listPrice',
  'cost',
  'unitPrice',
  'discountPercent',
  'subtotal',
  'grandTotal',
  'subtotalMonthly',
  'subtotalQuarterly',
  'subtotalAnnual',
  'subtotalOneTime',
  'taxAmount',
  'taxRate',
  'bundleDiscountPercent',
  'totalListPrice',
  'totalFinalPrice',
  'totalCost',
  'finalPrice',
  'marginPercent',
]);

export function normalizeResponse<T>(data: T): T {
  if (data === null || data === undefined) return data;
  if (typeof data !== 'object') return data;

  if (Array.isArray(data)) {
    return data.map(item => normalizeResponse(item)) as T;
  }

  const result: Record<string, any> = {};
  for (const [key, value] of Object.entries(data as Record<string, any>)) {
    if (BOOLEAN_FIELDS.has(key) && (value === 0 || value === 1)) {
      result[key] = value === 1;
    } else if (DECIMAL_FIELDS.has(key) && typeof value === 'string') {
      const parsed = parseFloat(value);
      result[key] = isNaN(parsed) ? value : parsed;
    } else if (value !== null && typeof value === 'object') {
      result[key] = normalizeResponse(value);
    } else {
      result[key] = value;
    }
  }
  return result as T;
}
