<?php

declare(strict_types=1);

namespace TurboDocx\Types\Requests\Quote;

/**
 * Request for updating a company
 */
final class UpdateCompanyRequest
{
    public function __construct(
        public readonly ?string $name = null,
        public readonly ?string $phone = null,
        public readonly ?string $city = null,
        public readonly ?string $state = null,
        public readonly ?string $country = null,
        public readonly ?string $industryId = null,
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
        if ($this->industryId !== null) {
            $data['industryId'] = $this->industryId;
        }

        return $data;
    }
}
