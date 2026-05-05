<?php

declare(strict_types=1);

namespace TurboDocx\Types\Requests\Quote;

/**
 * Request for creating a company
 */
final class CreateCompanyRequest
{
    /**
     * @param array<array<string, mixed>> $contacts
     */
    public function __construct(
        public readonly string $name,
        public readonly array $contacts,
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
        $data = [
            'name' => $this->name,
            'contacts' => $this->contacts,
        ];

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
