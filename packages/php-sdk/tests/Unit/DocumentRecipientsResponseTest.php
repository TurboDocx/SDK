<?php

declare(strict_types=1);

namespace TurboDocx\Tests\Unit;

use PHPUnit\Framework\TestCase;
use TurboDocx\Types\Responses\DocumentRecipientsResponse;

/**
 * Tests for the getRecipients response types.
 *
 * The PHP SDK convention (per existing tests) is to cover config + types rather than
 * full HTTP mocking, so these exercise fromArray() against the exact wire shape the
 * backend returns after the HTTP client unwraps the {data: ...} envelope.
 */
final class DocumentRecipientsResponseTest extends TestCase
{
    /**
     * @return array<string, mixed>
     */
    private function wirePayload(): array
    {
        return [
            'document' => [
                'id' => 'doc-123',
                'name' => 'Mutual NDA',
                'status' => 'under_review',
                'createdOn' => '2026-01-01T00:00:00.000Z',
                'expiresAt' => null,
                'sentBy' => ['name' => 'Jane Sender', 'email' => 'jane@acme.com'],
            ],
            'recipients' => [
                [
                    'id' => 'rec-1',
                    'name' => 'John Signer',
                    'email' => 'john@example.com',
                    'status' => 'completed',
                    'signedOn' => '2026-02-01T10:00:00.000Z',
                    'signingOrder' => 1,
                ],
                [
                    'id' => 'rec-2',
                    'name' => 'Ada Signer',
                    'email' => 'ada@example.com',
                    'status' => 'pending',
                    'signedOn' => null,
                    'signingOrder' => 2,
                ],
            ],
            'summary' => ['total' => 2, 'pending' => 1, 'viewed' => 0, 'completed' => 1],
        ];
    }

    public function testMapsEveryRecipientWithTheirSigningStatus(): void
    {
        $result = DocumentRecipientsResponse::fromArray($this->wirePayload());

        $this->assertCount(2, $result->recipients);
        $this->assertSame('completed', $result->recipients[0]->status);
        $this->assertSame('john@example.com', $result->recipients[0]->email);
        $this->assertSame('2026-02-01T10:00:00.000Z', $result->recipients[0]->signedOn);
        $this->assertSame(1, $result->recipients[0]->signingOrder);
        // A pending signer has no signedOn timestamp
        $this->assertSame('pending', $result->recipients[1]->status);
        $this->assertNull($result->recipients[1]->signedOn);
    }

    public function testExposesSenderAndSummary(): void
    {
        $result = DocumentRecipientsResponse::fromArray($this->wirePayload());

        $this->assertSame('Jane Sender', $result->document->sentBy->name);
        $this->assertSame('jane@acme.com', $result->document->sentBy->email);
        // Document status distinguishes a voided/expired doc from one still waiting
        $this->assertSame('under_review', $result->document->status);
        $this->assertSame(2, $result->summary->total);
        $this->assertSame(1, $result->summary->pending);
        $this->assertSame(0, $result->summary->viewed);
        $this->assertSame(1, $result->summary->completed);
    }

    public function testHandlesADocumentWithNoRecipients(): void
    {
        $payload = $this->wirePayload();
        $payload['recipients'] = [];
        $payload['summary'] = ['total' => 0, 'pending' => 0, 'viewed' => 0, 'completed' => 0];

        $result = DocumentRecipientsResponse::fromArray($payload);

        $this->assertSame([], $result->recipients);
        $this->assertSame(0, $result->summary->total);
    }
}
