<?php

declare(strict_types=1);

namespace TurboDocx\Types\Quote;

/**
 * Quote domain type
 */
final class Quote implements \JsonSerializable
{
    /**
     * @param array<LineItem>|null $lineItems
     * @param array<string, mixed>|null $creator
     */
    public function __construct(
        public readonly string $id,
        public readonly string $orgId,
        public readonly string $quoteNumber,
        public readonly string $name,
        public readonly string $status,
        public readonly string $companyId,
        public readonly string $contactId,
        public readonly ?string $priceBookId = null,
        public readonly int $termDays = 60,
        public readonly ?string $renewalPeriod = null,
        public readonly ?string $sentAt = null,
        public readonly ?string $validUntil = null,
        public readonly ?float $taxRate = null,
        public readonly string $currency = 'USD',
        public readonly float $subtotalMonthly = 0,
        public readonly float $subtotalQuarterly = 0,
        public readonly float $subtotalAnnual = 0,
        public readonly float $subtotalOneTime = 0,
        public readonly float $taxAmount = 0,
        public readonly float $grandTotal = 0,
        public readonly bool $isActive = true,
        public readonly ?string $createdBy = null,
        public readonly ?string $createdOn = null,
        public readonly ?string $updatedOn = null,
        public readonly ?Company $company = null,
        public readonly ?Contact $contact = null,
        public readonly ?array $lineItems = null,
        public readonly ?PriceBook $priceBook = null,
        public readonly ?array $creator = null,
        public readonly ?QuoteStatusInfo $statusInfo = null,
        /**
         * Resolved "Prepared by" identity (`['name' => ?, 'email' => ?]`) shown on the quote
         * PDF and preview. Resolved server-side from the org template then the creator; for an
         * API-key-created quote it is the API key's label with no email. Prefer over `creator`
         * for customer-facing display.
         * @var array<string, string>|null
         */
        public readonly ?array $preparedBy = null,
    ) {}

    /**
     * @param array<string, mixed> $data
     * @return self
     */
    public static function fromArray(array $data): self
    {
        return new self(
            id: $data['id'] ?? '',
            orgId: $data['orgId'] ?? '',
            quoteNumber: $data['quoteNumber'] ?? '',
            name: $data['name'] ?? '',
            status: $data['status'] ?? '',
            companyId: $data['companyId'] ?? '',
            contactId: $data['contactId'] ?? '',
            priceBookId: $data['priceBookId'] ?? null,
            termDays: (int) ($data['termDays'] ?? 60),
            renewalPeriod: $data['renewalPeriod'] ?? null,
            sentAt: $data['sentAt'] ?? null,
            validUntil: $data['validUntil'] ?? null,
            taxRate: isset($data['taxRate']) ? (float) $data['taxRate'] : null,
            currency: $data['currency'] ?? 'USD',
            subtotalMonthly: (float) ($data['subtotalMonthly'] ?? 0),
            subtotalQuarterly: (float) ($data['subtotalQuarterly'] ?? 0),
            subtotalAnnual: (float) ($data['subtotalAnnual'] ?? 0),
            subtotalOneTime: (float) ($data['subtotalOneTime'] ?? 0),
            taxAmount: (float) ($data['taxAmount'] ?? 0),
            grandTotal: (float) ($data['grandTotal'] ?? 0),
            isActive: (bool) ($data['isActive'] ?? true),
            createdBy: $data['createdBy'] ?? null,
            createdOn: $data['createdOn'] ?? null,
            updatedOn: $data['updatedOn'] ?? null,
            company: isset($data['company']) ? Company::fromArray($data['company']) : null,
            contact: isset($data['contact']) ? Contact::fromArray($data['contact']) : null,
            lineItems: isset($data['lineItems']) ? array_map(
                fn(array $item) => LineItem::fromArray($item),
                $data['lineItems']
            ) : null,
            priceBook: isset($data['priceBook']) ? PriceBook::fromArray($data['priceBook']) : null,
            creator: $data['creator'] ?? null,
            statusInfo: isset($data['statusInfo']) ? QuoteStatusInfo::fromArray($data['statusInfo']) : null,
            preparedBy: $data['preparedBy'] ?? null,
        );
    }

    /**
     * @return array<string, mixed>
     */
    public function toArray(): array
    {
        $data = [
            'id' => $this->id,
            'orgId' => $this->orgId,
            'quoteNumber' => $this->quoteNumber,
            'name' => $this->name,
            'status' => $this->status,
            'companyId' => $this->companyId,
            'contactId' => $this->contactId,
            'priceBookId' => $this->priceBookId,
            'termDays' => $this->termDays,
            'renewalPeriod' => $this->renewalPeriod,
            'sentAt' => $this->sentAt,
            'validUntil' => $this->validUntil,
            'taxRate' => $this->taxRate,
            'currency' => $this->currency,
            'subtotalMonthly' => $this->subtotalMonthly,
            'subtotalQuarterly' => $this->subtotalQuarterly,
            'subtotalAnnual' => $this->subtotalAnnual,
            'subtotalOneTime' => $this->subtotalOneTime,
            'taxAmount' => $this->taxAmount,
            'grandTotal' => $this->grandTotal,
            'isActive' => $this->isActive,
            'createdBy' => $this->createdBy,
            'createdOn' => $this->createdOn,
            'updatedOn' => $this->updatedOn,
        ];

        if ($this->company !== null) {
            $data['company'] = $this->company->toArray();
        }
        if ($this->contact !== null) {
            $data['contact'] = $this->contact->toArray();
        }
        if ($this->lineItems !== null) {
            $data['lineItems'] = array_map(fn(LineItem $item) => $item->toArray(), $this->lineItems);
        }
        if ($this->priceBook !== null) {
            $data['priceBook'] = $this->priceBook->toArray();
        }
        if ($this->creator !== null) {
            $data['creator'] = $this->creator;
        }
        if ($this->statusInfo !== null) {
            $data['statusInfo'] = $this->statusInfo->toArray();
        }
        if ($this->preparedBy !== null) {
            $data['preparedBy'] = $this->preparedBy;
        }

        return $data;
    }

    /**
     * @return array<string, mixed>
     */
    public function jsonSerialize(): array
    {
        return $this->toArray();
    }
}
