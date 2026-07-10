<?php

declare(strict_types=1);

namespace TurboDocx\Types\Quote;

/**
 * A per-row issue from a bulk create operation.
 *
 * `$row` is the 1-indexed position of the row in the request payload.
 */
final class BulkImportRowIssue implements \JsonSerializable
{
    public function __construct(
        public readonly int $row,
        public readonly string $reason,
    ) {}

    /**
     * @param array<string, mixed> $data
     * @return self
     */
    public static function fromArray(array $data): self
    {
        return new self(
            row: (int) ($data['row'] ?? 0),
            reason: $data['reason'] ?? '',
        );
    }

    /**
     * @return array<string, mixed>
     */
    public function toArray(): array
    {
        return [
            'row' => $this->row,
            'reason' => $this->reason,
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
