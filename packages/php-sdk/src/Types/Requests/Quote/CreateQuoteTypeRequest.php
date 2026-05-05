<?php

declare(strict_types=1);

namespace TurboDocx\Types\Requests\Quote;

/**
 * Request for creating a type/category
 */
final class CreateQuoteTypeRequest
{
    public function __construct(
        public readonly string $name,
        public readonly string $categoryType,
    ) {}

    /**
     * @return array<string, string>
     */
    public function toArray(): array
    {
        return [
            'name' => $this->name,
            'categoryType' => $this->categoryType,
        ];
    }
}
