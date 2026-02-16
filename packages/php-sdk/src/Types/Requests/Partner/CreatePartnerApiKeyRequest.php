<?php

declare(strict_types=1);

namespace TurboDocx\Types\Requests\Partner;

use TurboDocx\Exceptions\ValidationException;
use TurboDocx\Types\Enums\PartnerScope;

/**
 * Request for creating a partner API key
 */
final class CreatePartnerApiKeyRequest
{
    /**
     * @param string $name API key name (1-255 chars)
     * @param array<PartnerScope> $scopes Required scopes (at least one)
     * @param string|null $description Optional description
     */
    public function __construct(
        public readonly string $name,
        public readonly array $scopes,
        public readonly ?string $description = null,
    ) {
        $nameLength = mb_strlen($this->name);
        if ($nameLength < 1 || $nameLength > 255) {
            throw new ValidationException(
                'API key name must be between 1 and 255 characters'
            );
        }

        if (empty($this->scopes)) {
            throw new ValidationException('At least one scope is required');
        }

        foreach ($this->scopes as $scope) {
            if (!$scope instanceof PartnerScope) {
                throw new ValidationException('All scopes must be PartnerScope enum values');
            }
        }

    }

    /**
     * @return array<string, mixed>
     */
    public function toArray(): array
    {
        $data = [
            'name' => $this->name,
            'scopes' => array_map(fn(PartnerScope $s) => $s->value, $this->scopes),
        ];

        if ($this->description !== null) {
            $data['description'] = $this->description;
        }

        return $data;
    }
}
