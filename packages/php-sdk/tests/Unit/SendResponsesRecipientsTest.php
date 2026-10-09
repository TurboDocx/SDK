<?php

declare(strict_types=1);

namespace TurboDocx\Tests\Unit;

use PHPUnit\Framework\TestCase;
use TurboDocx\Types\Responses\CreateSignatureReviewLinkResponse;
use TurboDocx\Types\Responses\SendSignatureResponse;

/**
 * `recipients` is always present on a successful sendSignature / createSignatureReviewLink
 * response, so both models expose it as a non-null array (an empty one if the key is ever absent).
 */
final class SendResponsesRecipientsTest extends TestCase
{
    /** @var array<string, mixed> */
    private const RECIPIENT = ['id' => 'rec-1', 'name' => 'John Doe', 'email' => 'john@example.com', 'metadata' => []];

    public function testSendSignatureResponseCarriesRecipients(): void
    {
        $response = SendSignatureResponse::fromArray([
            'success' => true, 'documentId' => 'doc-123', 'status' => 'UNDER_REVIEW',
            'recipients' => [self::RECIPIENT], 'message' => 'sent',
        ]);

        $this->assertSame('rec-1', $response->recipients[0]['id']);
        $this->assertSame('john@example.com', $response->recipients[0]['email']);
    }

    public function testSendSignatureResponseRecipientsIsAnEmptyArrayWhenAbsent(): void
    {
        $response = SendSignatureResponse::fromArray(['success' => true, 'documentId' => 'doc-123']);

        $this->assertSame([], $response->recipients);
    }

    public function testReviewLinkResponseCarriesRecipients(): void
    {
        $response = CreateSignatureReviewLinkResponse::fromArray([
            'success' => true, 'documentId' => 'doc-123', 'status' => 'review_ready',
            'previewUrl' => 'https://preview.example.com/doc-123', 'recipients' => [self::RECIPIENT],
            'message' => 'ready',
        ]);

        $this->assertSame('rec-1', $response->recipients[0]['id']);
        $this->assertSame('john@example.com', $response->recipients[0]['email']);
    }

    public function testReviewLinkResponseRecipientsIsAnEmptyArrayWhenAbsent(): void
    {
        $response = CreateSignatureReviewLinkResponse::fromArray(['success' => true, 'documentId' => 'doc-123']);

        $this->assertSame([], $response->recipients);
    }
}
