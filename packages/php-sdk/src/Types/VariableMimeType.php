<?php

declare(strict_types=1);

namespace TurboDocx\Types;

/**
 * Enum for template variable MIME types
 */
enum VariableMimeType: string
{
    case TEXT = 'text';
    case HTML = 'html';
    case JSON = 'json';
    case IMAGE = 'image';
    case MARKDOWN = 'markdown';
}
