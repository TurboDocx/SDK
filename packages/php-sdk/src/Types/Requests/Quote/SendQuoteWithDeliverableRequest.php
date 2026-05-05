<?php

declare(strict_types=1);

namespace TurboDocx\Types\Requests\Quote;

/**
 * Request for sending a quote with a deliverable document
 */
final class SendQuoteWithDeliverableRequest
{
    /**
     * @param string[]|null $ccEmails
     */
    public function __construct(
        public readonly string $deliverableId,
        public readonly string $mergePosition,
        public readonly ?array $ccEmails = null,
    ) {}

    /**
     * @return array<string, mixed>
     */
    public function toArray(): array
    {
        $data = [
            'deliverableId' => $this->deliverableId,
            'mergePosition' => $this->mergePosition,
        ];

        if ($this->ccEmails !== null) {
            $data['ccEmails'] = $this->ccEmails;
        }

        return $data;
    }
}
