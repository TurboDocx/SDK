<?php

declare(strict_types=1);

namespace TurboDocx\Types\Requests\Quote;

/**
 * Request for updating a quote.
 *
 * Only fields that are explicitly passed to the constructor are included in the
 * serialised payload.  Nullable fields (renewalPeriod, validUntil, taxRate,
 * priceBookId) can be set to `null` to clear them on the server — they are
 * tracked separately so we can distinguish "not provided" from "set to null".
 */
final class UpdateQuoteRequest
{
    /** @var array<string, true> fields that were explicitly provided */
    private array $provided = [];

    private ?string $renewalPeriod;
    private ?string $validUntil;
    private ?float $taxRate;
    private ?string $priceBookId;

    /**
     * @param int|null $termDays Quote term in days (max 3650). Use -1 for auto-renewal, which makes
     *                           $renewalPeriod required.
     * @param string|null $renewalPeriod Required when $termDays is -1, and must be null otherwise
     *                                   (sending it with any other term is a 400). To clear it when
     *                                   moving off auto-renewal, pass null with $includeRenewalPeriod: true.
     *                                   One of: weekly, monthly, quarterly, annually.
     */
    public function __construct(
        public readonly ?string $name = null,
        public readonly ?string $companyId = null,
        public readonly ?string $contactId = null,
        public readonly ?int $termDays = null,
        ?string $renewalPeriod = null,
        ?string $validUntil = null,
        ?float $taxRate = null,
        public readonly ?string $currency = null,
        ?string $priceBookId = null,
        bool $includeRenewalPeriod = false,
        bool $includeValidUntil = false,
        bool $includeTaxRate = false,
        bool $includePriceBookId = false,
    ) {
        $this->renewalPeriod = $renewalPeriod;
        $this->validUntil = $validUntil;
        $this->taxRate = $taxRate;
        $this->priceBookId = $priceBookId;

        // Track which nullable fields were explicitly provided.
        // A non-null value always counts as "provided".
        // To explicitly set to null, pass includeXxx: true.
        if ($renewalPeriod !== null || $includeRenewalPeriod) {
            $this->provided['renewalPeriod'] = true;
        }
        if ($validUntil !== null || $includeValidUntil) {
            $this->provided['validUntil'] = true;
        }
        if ($taxRate !== null || $includeTaxRate) {
            $this->provided['taxRate'] = true;
        }
        if ($priceBookId !== null || $includePriceBookId) {
            $this->provided['priceBookId'] = true;
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
        if ($this->companyId !== null) {
            $data['companyId'] = $this->companyId;
        }
        if ($this->contactId !== null) {
            $data['contactId'] = $this->contactId;
        }
        if ($this->termDays !== null) {
            $data['termDays'] = $this->termDays;
        }
        if (isset($this->provided['renewalPeriod'])) {
            $data['renewalPeriod'] = $this->renewalPeriod;
        }
        if (isset($this->provided['validUntil'])) {
            $data['validUntil'] = $this->validUntil;
        }
        if (isset($this->provided['taxRate'])) {
            $data['taxRate'] = $this->taxRate;
        }
        if ($this->currency !== null) {
            $data['currency'] = $this->currency;
        }
        if (isset($this->provided['priceBookId'])) {
            $data['priceBookId'] = $this->priceBookId;
        }

        return $data;
    }
}
