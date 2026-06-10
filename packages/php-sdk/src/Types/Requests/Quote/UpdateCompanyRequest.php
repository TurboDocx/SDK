<?php

declare(strict_types=1);

namespace TurboDocx\Types\Requests\Quote;

/**
 * Request for updating a company
 *
 * `industryId` supports null-clear semantics: pass `null` + `includeIndustryId: true`
 * to explicitly clear the field on the server. Omitting `industryId` (or not setting
 * `includeIndustryId`) leaves the server value unchanged.
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
