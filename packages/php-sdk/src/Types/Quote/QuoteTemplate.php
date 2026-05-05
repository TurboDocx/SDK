<?php

declare(strict_types=1);

namespace TurboDocx\Types\Quote;

/**
 * Quote template domain type
 */
final class QuoteTemplate implements \JsonSerializable
{
    public function __construct(
        public readonly string $id,
        public readonly string $orgId,
        public readonly ?string $logoUrl = null,
        public readonly string $primaryColor = '#000000',
        public readonly string $primaryTextColor = '#FFFFFF',
        public readonly ?string $disclaimer = null,
        public readonly ?string $termsAndConditions = null,
        public readonly ?string $closingMessage = null,
        public readonly ?string $senderName = null,
        public readonly ?string $senderPhone = null,
        public readonly ?string $senderEmail = null,
        public readonly ?string $contactEmail = null,
        public readonly bool $isActive = true,
        public readonly ?string $createdBy = null,
        public readonly ?string $createdOn = null,
        public readonly ?string $updatedOn = null,
    ) {}

    /**
     * @param array<string, mixed> $data
     * @return self
     */
    public static function fromArray(array $data): self
    {
        return new self(
            id: $data['id'] ?? '',
            orgId: $data['orgId'] ?? '',
            logoUrl: $data['logoUrl'] ?? null,
            primaryColor: $data['primaryColor'] ?? '#000000',
            primaryTextColor: $data['primaryTextColor'] ?? '#FFFFFF',
            disclaimer: $data['disclaimer'] ?? null,
            termsAndConditions: $data['termsAndConditions'] ?? null,
            closingMessage: $data['closingMessage'] ?? null,
            senderName: $data['senderName'] ?? null,
            senderPhone: $data['senderPhone'] ?? null,
            senderEmail: $data['senderEmail'] ?? null,
            contactEmail: $data['contactEmail'] ?? null,
            isActive: (bool) ($data['isActive'] ?? true),
            createdBy: $data['createdBy'] ?? null,
            createdOn: $data['createdOn'] ?? null,
            updatedOn: $data['updatedOn'] ?? null,
        );
    }

    /**
     * @return array<string, mixed>
     */
    public function toArray(): array
    {
        return [
            'id' => $this->id,
            'orgId' => $this->orgId,
            'logoUrl' => $this->logoUrl,
            'primaryColor' => $this->primaryColor,
            'primaryTextColor' => $this->primaryTextColor,
            'disclaimer' => $this->disclaimer,
            'termsAndConditions' => $this->termsAndConditions,
            'closingMessage' => $this->closingMessage,
            'senderName' => $this->senderName,
            'senderPhone' => $this->senderPhone,
            'senderEmail' => $this->senderEmail,
            'contactEmail' => $this->contactEmail,
            'isActive' => $this->isActive,
            'createdBy' => $this->createdBy,
            'createdOn' => $this->createdOn,
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
