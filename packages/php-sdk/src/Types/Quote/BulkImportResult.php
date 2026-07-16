<?php

declare(strict_types=1);

namespace TurboDocx\Types\Quote;

/**
 * Result of a bulk create operation (partial success).
 *
 * `$imported` counts rows that were created. `$failed` lists rows that did
 * not import; `$adjusted` lists rows that imported with a server-side
 * adjustment. Row numbers are 1-indexed positions in the request payload.
 */
final class BulkImportResult implements \JsonSerializable
{
    /**
     * @param BulkImportRowIssue[] $failed
     * @param BulkImportRowIssue[] $adjusted
     */
    public function __construct(
        public readonly int $imported,
        public readonly array $failed,
        public readonly array $adjusted,
    ) {}

    /**
     * @param array<string, mixed> $data
     * @return self
     */
    public static function fromArray(array $data): self
    {
        return new self(
            imported: (int) ($data['imported'] ?? 0),
            failed: array_map(
                fn(array $issue) => BulkImportRowIssue::fromArray($issue),
                $data['failed'] ?? [],
            ),
            adjusted: array_map(
                fn(array $issue) => BulkImportRowIssue::fromArray($issue),
                $data['adjusted'] ?? [],
            ),
        );
    }

    /**
     * @return array<string, mixed>
     */
    public function toArray(): array
    {
        return [
            'imported' => $this->imported,
            'failed' => array_map(fn(BulkImportRowIssue $issue) => $issue->toArray(), $this->failed),
            'adjusted' => array_map(fn(BulkImportRowIssue $issue) => $issue->toArray(), $this->adjusted),
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
