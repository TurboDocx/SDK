<?php

declare(strict_types=1);

namespace TurboDocx\Types\Responses\Quote;

use TurboDocx\Types\Quote\Company;
use TurboDocx\Types\Quote\Contact;

/**
 * Response from listing contacts
 */
final class ContactListResponse implements \JsonSerializable
{
    /**
     * @param array<Contact> $results
     */
    public function __construct(
        public readonly array $results,
        public readonly int $totalRecords,
        // The company, when the list is for one company. Its contactCount is the company's active
        // contacts whatever the search (a company can't lose its last contact).
        public readonly ?Company $company = null,
    ) {}

    /**
     * @param array<string, mixed> $data
     * @return self
     */
    public static function fromArray(array $data): self
    {
        return new self(
            results: array_map(
                fn(array $c) => Contact::fromArray($c),
                $data['results'] ?? []
            ),
            totalRecords: (int) ($data['totalRecords'] ?? 0),
            company: isset($data['company']) && is_array($data['company']) ? Company::fromArray($data['company']) : null,
        );
    }

    /**
     * @return array<string, mixed>
     */
    public function toArray(): array
    {
        $data = [
            'results' => array_map(fn(Contact $c) => $c->toArray(), $this->results),
            'totalRecords' => $this->totalRecords,
        ];
        if ($this->company !== null) {
            $data['company'] = $this->company->toArray();
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
