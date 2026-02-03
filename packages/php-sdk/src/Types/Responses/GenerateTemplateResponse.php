<?php

declare(strict_types=1);

namespace TurboDocx\Types\Responses;

/**
 * Response from generating a template
 */
class GenerateTemplateResponse
{
    /**
     * @param string|null $id Deliverable ID
     * @param string|null $name Document name
     * @param string|null $description Document description
     * @param string|null $templateId Template ID used
     * @param string|null $projectspaceId Projectspace ID
     * @param string|null $deliverableFolderId Folder ID
     * @param array<string, mixed>|null $metadata Additional metadata
     * @param string|null $createdBy User who created the deliverable
     * @param string|null $orgId Organization ID
     * @param string|null $defaultFont Default font used
     * @param string|null $createdOn Creation timestamp
     * @param string|null $updatedOn Last update timestamp
     * @param int|null $isActive Active status flag
     * @param mixed $fonts Font information
     * @param string|null $downloadUrl Download URL
     * @param string|null $message Response message
     * @param string|null $error Error message (if any)
     */
    public function __construct(
        public ?string $id = null,
        public ?string $name = null,
        public ?string $description = null,
        public ?string $templateId = null,
        public ?string $projectspaceId = null,
        public ?string $deliverableFolderId = null,
        public ?array $metadata = null,
        public ?string $createdBy = null,
        public ?string $orgId = null,
        public ?string $defaultFont = null,
        public ?string $createdOn = null,
        public ?string $updatedOn = null,
        public ?int $isActive = null,
        public mixed $fonts = null,
        public ?string $downloadUrl = null,
        public ?string $message = null,
        public ?string $error = null
    ) {}

    /**
     * Legacy compatibility - get deliverableId (alias for id)
     */
    public function getDeliverableId(): ?string
    {
        return $this->id;
    }

    /**
     * Create from API response array
     *
     * @param array<string, mixed> $data
     * @return self
     */
    public static function fromArray(array $data): self
    {
        return new self(
            id: $data['id'] ?? null,
            name: $data['name'] ?? null,
            description: $data['description'] ?? null,
            templateId: $data['templateId'] ?? null,
            projectspaceId: $data['projectspaceId'] ?? null,
            deliverableFolderId: $data['deliverableFolderId'] ?? null,
            metadata: $data['metadata'] ?? null,
            createdBy: $data['createdBy'] ?? null,
            orgId: $data['orgId'] ?? null,
            defaultFont: $data['defaultFont'] ?? null,
            createdOn: $data['createdOn'] ?? null,
            updatedOn: $data['updatedOn'] ?? null,
            isActive: $data['isActive'] ?? null,
            fonts: $data['fonts'] ?? null,
            downloadUrl: $data['downloadUrl'] ?? null,
            message: $data['message'] ?? null,
            error: $data['error'] ?? null
        );
    }
}
