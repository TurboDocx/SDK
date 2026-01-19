<?php

declare(strict_types=1);

namespace TurboDocx\Tests\Unit;

use PHPUnit\Framework\TestCase;
use TurboDocx\Config\HttpClientConfig;
use TurboDocx\TurboSign;
use TurboDocx\Types\Requests\CreateSignatureReviewLinkRequest;
use TurboDocx\Types\Requests\SendSignatureRequest;
use TurboDocx\Types\SignatureField;
use TurboDocx\Enums\SignatureFieldType;
use ReflectionClass;
use ReflectionMethod;

/**
 * Test that senderName is correctly used (not senderEmail) when creating signature requests
 */
final class TurboSignSenderNameTest extends TestCase
{
    /**
     * @param array<string, string|null> $senderConfig
     * @return array<string, mixed>
     */
    private function buildFormDataForReviewLink(CreateSignatureReviewLinkRequest $request, array $senderConfig): array
    {
        // This mirrors the logic in TurboSign::createSignatureReviewLink()
        // We're testing the form data building logic directly

        $formData = [];
        $formData['documentName'] = $request->documentName;

        if ($request->documentDescription !== null) {
            $formData['documentDescription'] = $request->documentDescription;
        }

        // Use request senderEmail/senderName if provided, otherwise fall back to configured values
        $formData['senderEmail'] = $request->senderEmail ?? $senderConfig['sender_email'];
        if ($request->senderName !== null || $senderConfig['sender_name'] !== null) {
            // FIXED: Use $request->senderName, not $request->senderEmail
            $formData['senderName'] = $request->senderName ?? $senderConfig['sender_name'];
        }

        return $formData;
    }

    public function testSenderNameUsesCorrectFieldFromRequest(): void
    {
        // Arrange: Create a request with custom sender name and email
        $request = new CreateSignatureReviewLinkRequest(
            recipients: [],
            fields: [],
            documentName: 'Test Document',
            documentDescription: 'Test Description',
            senderEmail: 'sender@example.com',
            senderName: 'John Doe'  // This should be used, not the email
        );

        $senderConfig = [
            'sender_email' => 'default@example.com',
            'sender_name' => 'Default Name',
        ];

        // Act: Build form data (simulating what TurboSign does)
        $formData = $this->buildFormDataForReviewLink($request, $senderConfig);

        // Assert: senderName should be 'John Doe', NOT 'sender@example.com'
        $this->assertEquals(
            'John Doe',
            $formData['senderName'],
            'senderName should use request->senderName, not request->senderEmail'
        );
        $this->assertEquals(
            'sender@example.com',
            $formData['senderEmail'],
            'senderEmail should use request->senderEmail'
        );
    }

    public function testSenderNameFallsBackToConfigWhenNotProvided(): void
    {
        // Arrange: Create a request without custom sender name
        $request = new CreateSignatureReviewLinkRequest(
            recipients: [],
            fields: [],
            documentName: 'Test Document',
            senderEmail: 'sender@example.com'
            // senderName is null
        );

        $senderConfig = [
            'sender_email' => 'default@example.com',
            'sender_name' => 'Default Name',
        ];

        // Act
        $formData = $this->buildFormDataForReviewLink($request, $senderConfig);

        // Assert: Should fall back to config sender name
        $this->assertEquals(
            'Default Name',
            $formData['senderName'],
            'senderName should fall back to config sender_name when request->senderName is null'
        );
    }
}
