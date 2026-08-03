<?php

declare(strict_types=1);

namespace TurboDocx\Types\Responses;

/**
 * Where a single recipient is in the signing process.
 */
final class RecipientSignatureStatus
{
    /**
     * @param string $status Raw database status — only ever 'pending', 'viewed' or 'completed'.
     * @param string $effectiveStatus Raw status with the document's terminal state layered on:
     *   'pending', 'viewed', 'completed', 'voided' or 'expired'. Use this for display — a signer
     *   on a voided document reads 'voided' here but still 'pending' in $status. A completed
     *   signature is never revoked.
     * @param string|null $signedOn When this recipient signed; null while pending or viewed.
     */
    public function __construct(
        public string $id,
        public string $name,
        public string $email,
        public string $status,
        public string $effectiveStatus,
        public ?string $signedOn,
        public int $signingOrder,
        public RecipientDelivery $delivery,
    ) {}

    /**
     * Create from array
     *
     * @param array<string, mixed> $data
     * @return self
     */
    public static function fromArray(array $data): self
    {
        return new self(
            id: $data['id'] ?? '',
            name: $data['name'] ?? '',
            email: $data['email'] ?? '',
            status: $data['status'] ?? '',
            effectiveStatus: $data['effectiveStatus'] ?? ($data['status'] ?? ''),
            signedOn: $data['signedOn'] ?? null,
            signingOrder: (int) ($data['signingOrder'] ?? 0),
            delivery: RecipientDelivery::fromArray($data['delivery'] ?? []),
        );
    }
}
