<?php

declare(strict_types=1);

namespace TurboDocx\Types\Requests\Quote;

/**
 * Request for sending a quote
 */
final class SendQuoteRequest
{
    /**
     * @param string[]|null $ccEmails
     */
    public function __construct(
        public readonly ?array $ccEmails = null,
        public readonly ?string $validUntil = null,
    ) {}

    /**
     * @return array<string, mixed>
     */
    public function toArray(): array
    {
        $data = [];

        if ($this->ccEmails !== null) {
            $data['ccEmails'] = $this->ccEmails;
        }
        if ($this->validUntil !== null) {
            $data['validUntil'] = $this->validUntil;
        }

        return $data;
    }
}
