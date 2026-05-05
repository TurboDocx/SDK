<?php

declare(strict_types=1);

namespace TurboDocx\Types\Responses\Quote;

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
        );
    }

    /**
     * @return array<string, mixed>
     */
    public function toArray(): array
    {
        return [
            'results' => array_map(fn(Contact $c) => $c->toArray(), $this->results),
            'totalRecords' => $this->totalRecords,
        ];
    }

    /**
     * @return array<string, mixed>
     */
    public function jsonSerialize(): array
    {
        return $this->toArray();
    }
}
