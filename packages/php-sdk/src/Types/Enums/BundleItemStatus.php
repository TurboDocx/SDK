<?php

declare(strict_types=1);

namespace TurboDocx\Types\Enums;

enum BundleItemStatus: string
{
    case ACTIVE = 'active';
    case PRODUCT_DELETED = 'product_deleted';
    case PRODUCT_UNAVAILABLE = 'product_unavailable';
    case CURRENCY_MISMATCH = 'currency_mismatch';
}
