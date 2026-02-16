<?php

declare(strict_types=1);

namespace TurboDocx\Types\Requests\Partner;

use TurboDocx\Exceptions\ValidationException;
use TurboDocx\Types\Enums\PartnerScope;

/**
 * Request for updating a partner API key
 */
final class UpdatePartnerApiKeyRequest
{
    /**
     * @param string|null $name New name (1-255 chars)
     * @param string|null $description New description
     * @param array<PartnerScope>|null $scopes New scopes (at least one if provided)
     */
    public function __construct(
        public readonly ?string $name = null,
        public readonly ?string $description = null,
        public readonly ?array $scopes = null,
    ) {
        if ($this->name !== null) {
            $nameLength = mb_strlen($this->name);
            if ($nameLength < 1 || $nameLength > 255) {
                throw new ValidationException(
                    'API key name must be between 1 and 255 characters'
                );
            }
        }

        if ($this->scopes !== null) {
            if (empty($this->scopes)) {
                throw new ValidationException('At least one scope is required when updating scopes');
            }
            foreach ($this->scopes as $scope) {
                if (!$scope instanceof PartnerScope) {
                    throw new ValidationException('All scopes must be PartnerScope enum values');
                }
            }
        }

    }

    /**
     * @return array<string, mixed>
     */
    public function toArray(): array
    {
        $data = [];

        if ($this->name !== null) {
            $data['name'] = $this->name;
        }
        if ($this->description !== null) {
            $data['description'] = $this->description;
        }
        if ($this->scopes !== null) {
            $data['scopes'] = array_map(fn(PartnerScope $s) => $s->value, $this->scopes);
        }

        return $data;
    }
}
