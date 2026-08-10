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
                'sentOn' => '2026-01-02T08:59:00.000Z',
                'expiresAt' => null,
                'sentBy' => ['name' => 'Jane Sender', 'email' => 'jane@acme.com'],
            ],
            'recipients' => [
                [
                    'id' => 'rec-1',
                    'name' => 'John Signer',
                    'email' => 'john@example.com',
                    'status' => 'completed',
                    'effectiveStatus' => 'completed',
                    'signedOn' => '2026-02-01T10:00:00.000Z',
                    'signingOrder' => 1,
                    'delivery' => [
                        'firstSentOn' => '2026-01-02T09:00:00.000Z',
                        'lastSentOn' => '2026-01-09T09:00:00.000Z',
                        'totalSent' => 3,
                        'reminderCount' => 1,
                        'lastRemindedAt' => '2026-01-09T09:00:00.000Z',
                        'warningCount' => 0,
                        'lastWarningAt' => null,
                    ],
                ],
                [
                    'id' => 'rec-2',
                    'name' => 'Ada Signer',
                    'email' => 'ada@example.com',
                    'status' => 'pending',
                    'effectiveStatus' => 'pending',
                    'signedOn' => null,
                    'signingOrder' => 2,
                    'delivery' => [
                        'firstSentOn' => '2026-01-02T09:00:00.000Z',
                        'lastSentOn' => '2026-01-02T09:00:00.000Z',
                        'totalSent' => 1,
                        'reminderCount' => 0,
                        // Stamped by the initial send — NOT evidence of a reminder.
                        'lastRemindedAt' => '2026-01-02T09:00:00.000Z',
                        'warningCount' => 0,
                        'lastWarningAt' => null,
                    ],
                ],
            ],
            'summary' => [
                'total' => 2, 'pending' => 1, 'viewed' => 0, 'completed' => 1,
                'voided' => 0, 'expired' => 0, 'waitingOn' => 1,
            ],
        ];
    }

    public function testMapsEachRecipientsEmailHistory(): void
    {
        $result = DocumentRecipientsResponse::fromArray($this->wirePayload());

        $chased = $result->recipients[0]->delivery;
        $this->assertSame(3, $chased->totalSent);
        $this->assertSame('2026-01-02T09:00:00.000Z', $chased->firstSentOn);
        $this->assertSame('2026-01-09T09:00:00.000Z', $chased->lastSentOn);
        $this->assertSame(1, $chased->reminderCount);
        // Emailed once and never reminded: reminderCount stays 0, but lastRemindedAt is
        // NOT null — the initial send stamps it as the reminder cadence clock.
        $once = $result->recipients[1]->delivery;
        $this->assertSame(1, $once->totalSent);
        $this->assertSame(0, $once->reminderCount);
        $this->assertSame($once->firstSentOn, $once->lastRemindedAt);
    }

    public function testSurfacesVoidedEffectiveStatusWithoutRevokingASignature(): void
    {
        $payload = $this->wirePayload();
        $payload['document']['status'] = 'voided';
        $payload['recipients'][1]['effectiveStatus'] = 'voided';
        $payload['summary'] = [
            'total' => 2, 'pending' => 0, 'viewed' => 0, 'completed' => 1,
            'voided' => 1, 'expired' => 0, 'waitingOn' => 0,
        ];

        $result = DocumentRecipientsResponse::fromArray($payload);

        // Someone who signed still signed — voiding the document does not undo it
        $this->assertSame('completed', $result->recipients[0]->effectiveStatus);
        // The unsigned signer is stranded, though the raw DB status is still 'pending'
        $this->assertSame('pending', $result->recipients[1]->status);
        $this->assertSame('voided', $result->recipients[1]->effectiveStatus);
        $this->assertSame(1, $result->summary->voided);
        $this->assertSame(0, $result->summary->waitingOn);
    }

    public function testDocumentReportsWhenItWasSent(): void
    {
        $result = DocumentRecipientsResponse::fromArray($this->wirePayload());

        $this->assertSame('2026-01-02T08:59:00.000Z', $result->document->sentOn);
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
        $this->assertSame(0, $result->summary->voided);
        $this->assertSame(0, $result->summary->expired);
        $this->assertSame(1, $result->summary->waitingOn);
    }

    public function testHandlesADocumentWithNoRecipients(): void
    {
        $payload = $this->wirePayload();
        $payload['recipients'] = [];
        $payload['summary'] = [
            'total' => 0, 'pending' => 0, 'viewed' => 0, 'completed' => 0,
            'voided' => 0, 'expired' => 0, 'waitingOn' => 0,
        ];

        $result = DocumentRecipientsResponse::fromArray($payload);

        $this->assertSame([], $result->recipients);
        $this->assertSame(0, $result->summary->total);
    }
}
