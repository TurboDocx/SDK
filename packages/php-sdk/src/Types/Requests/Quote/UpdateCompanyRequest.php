<?php

declare(strict_types=1);

namespace TurboDocx\Types\Requests\Quote;

/**
 * Request for updating a company
 *
 * `industryId` and `email` support null-clear semantics: pass `null` + `includeIndustryId: true`
 * (or `includeEmail: true`) to explicitly clear the field on the server. Omitting the field (or
 * not setting its include flag) leaves the server value unchanged.
 */
final class UpdateCompanyRequest
{
    public function __construct(
        public readonly ?string $name = null,
        public readonly ?string $phone = null,
        public readonly ?string $city = null,
        public readonly ?string $state = null,
        public readonly ?string $country = null,
        // industryId is nullable/null-clearable — use includeIndustryId: true to
        // explicitly send null (clears the value on the server).
        public readonly ?string $industryId = null,
        public readonly bool $includeIndustryId = false,
        public readonly ?string $email = null,
        public readonly bool $includeEmail = false,
    ) {}

    /**
     * @return array<string, mixed>
     */
    public function toArray(): array
    {
        $data = [];

        if ($this->name !== null) {
            $data['name'] = $this->name;
        }
        if ($this->includeEmail || $this->email !== null) {
            $data['email'] = $this->email;
        }
        if ($this->phone !== null) {
            $data['phone'] = $this->phone;
        }
        if ($this->city !== null) {
            $data['city'] = $this->city;
        }
        if ($this->state !== null) {
            $data['state'] = $this->state;
        }
        if ($this->country !== null) {
            $data['country'] = $this->country;
        }
        if ($this->includeIndustryId) {
            $data['industryId'] = $this->industryId;
        } elseif ($this->industryId !== null) {
            $data['industryId'] = $this->industryId;
        }

        return $data;
    }
}
