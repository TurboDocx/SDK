<?php

declare(strict_types=1);

namespace TurboDocx\Utils;

/**
 * Response normalizer for MySQL type coercion.
 *
 * MySQL returns tinyint(1) as 0/1 and decimal columns as strings.
 * This normalizer converts them to proper PHP types so SDK consumers
 * get the types declared in the PHPDoc annotations.
 */
final class ResponseNormalizer
{
    /**
     * Fields that should be coerced from 0/1 to boolean.
     *
     * @var array<string, true>
     */
    private const BOOLEAN_FIELDS = [
        'isActive' => true,
        'isDefault' => true,
        'showInCatalog' => true,
        'showInQuoteBuilder' => true,
        'showItemsToEndUser' => true,
        'syncWithProducts' => true,
        'isPrimaryAdmin' => true,
        'canManageOrgs' => true,
        'canManageUsers' => true,
        'canManageBilling' => true,
        'canViewAuditLog' => true,
        'canManageApiKeys' => true,
        'canManageEntitlements' => true,
        'hasFileDownload' => true,
        'hasGDrive' => true,
        'hasWrike' => true,
        'hasSalesforce' => true,
        'hasConnectWise' => true,
        'rdWatermark' => true,
        'hasKnowledgeBase' => true,
        'hasAI' => true,
        'hasTurboSign' => true,
        'hasTurboQuote' => true,
    ];

    /**
     * Fields that should be coerced from string to float.
     *
     * @var array<string, true>
     */
    private const DECIMAL_FIELDS = [
        'listPrice' => true,
        'cost' => true,
        'unitPrice' => true,
        'discountPercent' => true,
        'subtotal' => true,
        'grandTotal' => true,
        'subtotalMonthly' => true,
        'subtotalQuarterly' => true,
        'subtotalAnnual' => true,
        'subtotalOneTime' => true,
        'taxAmount' => true,
        'taxRate' => true,
        'bundleDiscountPercent' => true,
        'totalListPrice' => true,
        'totalFinalPrice' => true,
        'totalCost' => true,
        'finalPrice' => true,
        'marginPercent' => true,
    ];

    /**
     * Normalize a response value recursively.
     *
     * Handles arrays, associative arrays (objects), and scalar passthrough.
     *
     * @param mixed $data
     * @return mixed
     */
    public static function normalizeResponse(mixed $data): mixed
    {
        if ($data === null) {
            return null;
        }

        if (!is_array($data)) {
            return $data;
        }

        // Sequential (list) array — normalize each element
        if (array_is_list($data)) {
            return array_map([self::class, 'normalizeResponse'], $data);
        }

        // Associative array — normalize keys
        $result = [];
        foreach ($data as $key => $value) {
            if (isset(self::BOOLEAN_FIELDS[$key]) && ($value === 0 || $value === 1)) {
                $result[$key] = $value === 1;
            } elseif (isset(self::DECIMAL_FIELDS[$key]) && is_string($value)) {
                $parsed = (float) $value;
                // Check for NaN-like strings: if the string doesn't parse to a
                // meaningful number, keep the original string.
                $result[$key] = ($parsed === 0.0 && !in_array($value, ['0', '0.0', '0.00'], true) && !is_numeric($value))
                    ? $value
                    : $parsed;
            } elseif ($value !== null && is_array($value)) {
                $result[$key] = self::normalizeResponse($value);
            } else {
                $result[$key] = $value;
            }
        }

        return $result;
    }
}
