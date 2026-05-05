<?php

declare(strict_types=1);

namespace TurboDocx\Types\Requests\Quote;

/**
 * Request for creating a new quote
 */
final class CreateQuoteRequest
{
    public function __construct(
        public readonly string $name,
        public readonly string $companyId,
        public readonly string $contactId,
        public readonly ?string $currency = null,
        public readonly ?int $termDays = null,
        public readonly ?string $renewalPeriod = null,
        public readonly ?string $validUntil = null,
        public readonly ?float $taxRate = null,
        public readonly ?string $priceBookId = null,
    ) {}

    /**
     * @return array<string, mixed>
     */
    public function toArray(): array
    {
        $data = [
            'name' => $this->name,
            'companyId' => $this->companyId,
            'contactId' => $this->contactId,
        ];

        if ($this->currency !== null) {
            $data['currency'] = $this->currency;
        }
        if ($this->termDays !== null) {
            $data['termDays'] = $this->termDays;
        }
        if ($this->renewalPeriod !== null) {
            $data['renewalPeriod'] = $this->renewalPeriod;
        }
        if ($this->validUntil !== null) {
            $data['validUntil'] = $this->validUntil;
        }
        if ($this->taxRate !== null) {
            $data['taxRate'] = $this->taxRate;
        }
        if ($this->priceBookId !== null) {
            $data['priceBookId'] = $this->priceBookId;
        }

        return $data;
    }
}
