<?php

declare(strict_types=1);

namespace TurboDocx\Types\Quote;

/**
 * An open quote (draft, pending approval or sent) for a company or contact
 */
final class OpenQuoteSummary implements \JsonSerializable
{
    public function __construct(
        public readonly string $id,
        public readonly string $quoteNumber,
        public readonly ?string $name = null,
        public readonly string $status = '',
        public readonly ?string $updatedOn = null,
    ) {}

    /**
     * @param array<string, mixed> $data
     * @return self
     */
    public static function fromArray(array $data): self
    {
        return new self(
            id: (string) ($data['id'] ?? ''),
            quoteNumber: (string) ($data['quoteNumber'] ?? ''),
            name: isset($data['name']) ? (string) $data['name'] : null,
            status: (string) ($data['status'] ?? ''),
            updatedOn: isset($data['updatedOn']) ? (string) $data['updatedOn'] : null,
        );
    }

    /**
     * @return array<string, mixed>
     */
    public function toArray(): array
    {
        return [
            'id' => $this->id,
            'quoteNumber' => $this->quoteNumber,
            'name' => $this->name,
            'status' => $this->status,
            'updatedOn' => $this->updatedOn,
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
