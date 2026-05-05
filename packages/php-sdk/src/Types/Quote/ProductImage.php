<?php

declare(strict_types=1);

namespace TurboDocx\Types\Quote;

/**
 * Product image domain type
 */
final class ProductImage implements \JsonSerializable
{
    public function __construct(
        public readonly string $id,
        public readonly string $productId,
        public readonly string $fileId,
        public readonly string $fileName,
        public readonly string $fileType,
        public readonly int $displayOrder,
        public readonly ?string $imageData = null,
    ) {}

    /**
     * @param array<string, mixed> $data
     * @return self
     */
    public static function fromArray(array $data): self
    {
        return new self(
            id: $data['id'] ?? '',
            productId: $data['productId'] ?? '',
            fileId: $data['fileId'] ?? '',
            fileName: $data['fileName'] ?? '',
            fileType: $data['fileType'] ?? '',
            displayOrder: (int) ($data['displayOrder'] ?? 0),
            imageData: $data['imageData'] ?? null,
        );
    }

    /**
     * @return array<string, mixed>
     */
    public function toArray(): array
    {
        $data = [
            'id' => $this->id,
            'productId' => $this->productId,
            'fileId' => $this->fileId,
            'fileName' => $this->fileName,
            'fileType' => $this->fileType,
            'displayOrder' => $this->displayOrder,
        ];

        if ($this->imageData !== null) {
            $data['imageData'] = $this->imageData;
        }

        return $data;
    }

    /**
     * @return array<string, mixed>
     */
    public function jsonSerialize(): array
    {
        return $this->toArray();
    }
}
