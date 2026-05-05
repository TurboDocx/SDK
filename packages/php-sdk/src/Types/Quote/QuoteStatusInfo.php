<?php

declare(strict_types=1);

namespace TurboDocx\Types\Quote;

/**
 * Status information for a quote, indicating available transitions
 */
final class QuoteStatusInfo implements \JsonSerializable
{
    public function __construct(
        public readonly string $currentStatus,
        public readonly bool $canSend,
        public readonly bool $canAccept,
        public readonly bool $canDecline,
        public readonly bool $canVoid,
        public readonly bool $isTerminal,
    ) {}

    /**
     * @param array<string, mixed> $data
     * @return self
     */
    public static function fromArray(array $data): self
    {
        return new self(
            currentStatus: $data['currentStatus'] ?? '',
            canSend: (bool) ($data['canSend'] ?? false),
            canAccept: (bool) ($data['canAccept'] ?? false),
            canDecline: (bool) ($data['canDecline'] ?? false),
            canVoid: (bool) ($data['canVoid'] ?? false),
            isTerminal: (bool) ($data['isTerminal'] ?? false),
        );
    }

    /**
     * @return array<string, mixed>
     */
    public function toArray(): array
    {
        return [
            'currentStatus' => $this->currentStatus,
            'canSend' => $this->canSend,
            'canAccept' => $this->canAccept,
            'canDecline' => $this->canDecline,
            'canVoid' => $this->canVoid,
            'isTerminal' => $this->isTerminal,
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
