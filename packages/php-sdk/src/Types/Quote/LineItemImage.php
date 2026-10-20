<?php

declare(strict_types=1);

namespace TurboDocx\Types\Quote;

/**
 * An image on a custom line item (a quote line with no catalog product)
 */
final class LineItemImage implements \JsonSerializable
{
    public function __construct(
        public readonly string $id,
        public readonly string $lineItemId = '',
        public readonly string $fileId = '',
        public readonly int $displayOrder = 0,
        public readonly string $fileName = '',
        public readonly string $fileType = '',
        // Base64 data URL: "data:image/png;base64,..."
        public readonly ?string $imageData = null,
    ) {}

    /**
     * @param array<string, mixed> $data
     * @return self
     */
    public static function fromArray(array $data): self
    {
        return new self(
            id: (string) ($data['id'] ?? ''),
            lineItemId: (string) ($data['lineItemId'] ?? ''),
            fileId: (string) ($data['fileId'] ?? ''),
            displayOrder: (int) ($data['displayOrder'] ?? 0),
            fileName: (string) ($data['fileName'] ?? ''),
            fileType: (string) ($data['fileType'] ?? ''),
            imageData: isset($data['imageData']) ? (string) $data['imageData'] : null,
        );
    }

    /**
     * @param array<int, array<string, mixed>> $list
     * @return LineItemImage[]
     */
    public static function listFromArray(array $list): array
    {
        return array_map(fn(array $image) => self::fromArray($image), $list);
    }

    /**
     * @return array<string, mixed>
     */
    public function toArray(): array
    {
        $data = [
            'id' => $this->id,
            'lineItemId' => $this->lineItemId,
            'fileId' => $this->fileId,
            'displayOrder' => $this->displayOrder,
            'fileName' => $this->fileName,
            'fileType' => $this->fileType,
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
