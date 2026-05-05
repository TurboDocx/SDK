<?php

declare(strict_types=1);

namespace TurboDocx\Types\Requests\Quote;

/**
 * Request for creating a quote template
 */
final class CreateQuoteTemplateRequest
{
    public function __construct(
        public readonly ?string $logoUrl = null,
        public readonly ?string $primaryColor = null,
        public readonly ?string $primaryTextColor = null,
        public readonly ?string $disclaimer = null,
        public readonly ?string $termsAndConditions = null,
        public readonly ?string $closingMessage = null,
        public readonly ?string $senderName = null,
        public readonly ?string $senderPhone = null,
        public readonly ?string $senderEmail = null,
        public readonly ?string $contactEmail = null,
    ) {}

    /**
     * @return array<string, mixed>
     */
    public function toArray(): array
    {
        $data = [];

        if ($this->logoUrl !== null) {
            $data['logoUrl'] = $this->logoUrl;
        }
        if ($this->primaryColor !== null) {
            $data['primaryColor'] = $this->primaryColor;
        }
        if ($this->primaryTextColor !== null) {
            $data['primaryTextColor'] = $this->primaryTextColor;
        }
        if ($this->disclaimer !== null) {
            $data['disclaimer'] = $this->disclaimer;
        }
        if ($this->termsAndConditions !== null) {
            $data['termsAndConditions'] = $this->termsAndConditions;
        }
        if ($this->closingMessage !== null) {
            $data['closingMessage'] = $this->closingMessage;
        }
        if ($this->senderName !== null) {
            $data['senderName'] = $this->senderName;
        }
        if ($this->senderPhone !== null) {
            $data['senderPhone'] = $this->senderPhone;
        }
        if ($this->senderEmail !== null) {
            $data['senderEmail'] = $this->senderEmail;
        }
        if ($this->contactEmail !== null) {
            $data['contactEmail'] = $this->contactEmail;
        }

        return $data;
    }
}
