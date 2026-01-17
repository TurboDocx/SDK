<?php

declare(strict_types=1);

namespace TurboDocx\Types;

/**
 * Signature field types supported by TurboSign
 */
enum SignatureFieldType: string
{
    case SIGNATURE = 'signature';
    case INITIAL = 'initial';
    case DATE = 'date';
    case TEXT = 'text';
    case FULL_NAME = 'full_name';
    case TITLE = 'title';
    case COMPANY = 'company';
    case FIRST_NAME = 'first_name';
    case LAST_NAME = 'last_name';
    case EMAIL = 'email';
    case CHECKBOX = 'checkbox';
}
