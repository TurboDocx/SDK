<?php

declare(strict_types=1);

namespace TurboDocx\Types\Enums;

/**
 * Category type values for types/categories
 */
enum CategoryType: string
{
    case PRODUCT_CATEGORY = 'product_category';
    case PRICEBOOK_TYPE = 'pricebook_type';
    case COMPANY_INDUSTRY = 'company_industry';
    case BUNDLE_CATEGORY = 'bundle_category';
}
