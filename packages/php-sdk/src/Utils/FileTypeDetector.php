<?php

declare(strict_types=1);

namespace TurboDocx\Utils;

/**
 * Detect file type from content using magic bytes
 */
final class FileTypeDetector
{
    /**
     * Detect file type from content using magic bytes
     *
     * @param string $content File content
     * @return array{mimetype: string, extension: string}
     */
    public static function detect(string $content): array
    {
        // PDF: %PDF (0x25 0x50 0x44 0x46)
        if (str_starts_with($content, '%PDF')) {
            return [
                'mimetype' => 'application/pdf',
                'extension' => 'pdf',
            ];
        }

        // ZIP-based formats (DOCX, PPTX): starts with PK
        if (str_starts_with($content, 'PK')) {
            // Check first 2000 bytes for format markers
            $first2000 = substr($content, 0, min(strlen($content), 2000));

            // PPTX contains 'ppt/' in ZIP structure
            if (str_contains($first2000, 'ppt/')) {
                return [
                    'mimetype' => 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
                    'extension' => 'pptx',
                ];
            }

            // DOCX contains 'word/' in ZIP structure
            if (str_contains($first2000, 'word/')) {
                return [
                    'mimetype' => 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                    'extension' => 'docx',
                ];
            }

            // Default to DOCX if it's a ZIP but can't determine type
            return [
                'mimetype' => 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                'extension' => 'docx',
            ];
        }

        // Unknown file type
        return [
            'mimetype' => 'application/octet-stream',
            'extension' => 'bin',
        ];
    }
}
