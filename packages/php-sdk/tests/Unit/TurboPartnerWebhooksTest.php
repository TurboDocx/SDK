<?php

declare(strict_types=1);

namespace TurboDocx\Tests\Unit;

use PHPUnit\Framework\TestCase;
use TurboDocx\Exceptions\ValidationException;
use TurboDocx\Types\Requests\Partner\CreateWebhookRequest;
use TurboDocx\Types\Requests\Partner\UpdateWebhookRequest;
use TurboDocx\Types\Requests\Partner\ListWebhooksRequest;
use TurboDocx\Types\Requests\Partner\TestWebhookRequest;
use TurboDocx\Types\Requests\Partner\ListWebhookDeliveriesRequest;
use TurboDocx\Types\Responses\Partner\WebhookResponse;
use TurboDocx\Types\Responses\Partner\WebhookListResponse;
use TurboDocx\Types\Responses\Partner\WebhookDeliveryListResponse;
use TurboDocx\Types\Responses\Partner\TestWebhookResponse;
use TurboDocx\Types\Responses\Partner\SuccessResponse;

final class TurboPartnerWebhooksTest extends TestCase
{
    // =============================================
    // CreateWebhookRequest Tests
    // =============================================

    public function testCreateWebhookRequestToArray(): void
    {
        $request = new CreateWebhookRequest(
            name: 'my-signing-webhook',
            urls: ['https://example.com/hook'],
            events: ['signature.document.completed']
        );

        $array = $request->toArray();

        $this->assertEquals('my-signing-webhook', $array['name']);
        $this->assertEquals(['https://example.com/hook'], $array['urls']);
        $this->assertEquals(['signature.document.completed'], $array['events']);
    }

    public function testCreateWebhookRequestWithMetadata(): void
    {
        $request = new CreateWebhookRequest(
            name: 'my-webhook',
            urls: ['https://example.com/hook'],
            events: ['signature.document.completed'],
            metadata: ['env' => 'production']
        );

        $array = $request->toArray();
        $this->assertEquals(['env' => 'production'], $array['metadata']);
    }

    public function testCreateWebhookRequestEmptyNameThrows(): void
    {
        $this->expectException(ValidationException::class);
        new CreateWebhookRequest(name: '', urls: ['https://example.com'], events: ['signature.document.completed']);
    }

    public function testCreateWebhookRequestEmptyUrlsThrows(): void
    {
        $this->expectException(ValidationException::class);
        new CreateWebhookRequest(name: 'my-webhook', urls: [], events: ['signature.document.completed']);
    }

    public function testCreateWebhookRequestNonHttpsUrlThrows(): void
    {
        $this->expectException(ValidationException::class);
        new CreateWebhookRequest(name: 'my-webhook', urls: ['http://insecure.example.com'], events: ['signature.document.completed']);
    }

    public function testCreateWebhookRequestEmptyEventsThrows(): void
    {
        $this->expectException(ValidationException::class);
        new CreateWebhookRequest(name: 'my-webhook', urls: ['https://example.com'], events: []);
    }

    // =============================================
    // UpdateWebhookRequest Tests
    // =============================================

    public function testUpdateWebhookRequestPartialFields(): void
    {
        $request = new UpdateWebhookRequest(isActive: false);
        $array = $request->toArray();

        $this->assertFalse($array['isActive']);
        $this->assertArrayNotHasKey('urls', $array);
        $this->assertArrayNotHasKey('events', $array);
    }

    public function testUpdateWebhookRequestAllFields(): void
    {
        $request = new UpdateWebhookRequest(
            urls: ['https://new.example.com/hook'],
            events: ['signature.document.voided'],
            isActive: true
        );

        $array = $request->toArray();
        $this->assertEquals(['https://new.example.com/hook'], $array['urls']);
        $this->assertEquals(['signature.document.voided'], $array['events']);
        $this->assertTrue($array['isActive']);
    }

    // =============================================
    // ListWebhooksRequest Tests
    // =============================================

    public function testListWebhooksRequestToQueryString(): void
    {
        $request = new ListWebhooksRequest(limit: 10, offset: 20, isActive: true);
        $params = $request->toQueryParams();

        $this->assertEquals(10, $params['limit']);
        $this->assertEquals(20, $params['offset']);
        $this->assertTrue($params['isActive']);
    }

    public function testListWebhooksRequestEmptyWhenNoParams(): void
    {
        $request = new ListWebhooksRequest();
        $this->assertEmpty($request->toQueryParams());
    }

    // =============================================
    // TestWebhookRequest Tests
    // =============================================

    public function testTestWebhookRequestEmpty(): void
    {
        $request = new TestWebhookRequest();
        $this->assertEmpty($request->toArray());
    }

    public function testTestWebhookRequestWithEvent(): void
    {
        $request = new TestWebhookRequest(event: 'signature.document.voided');
        $array = $request->toArray();
        $this->assertEquals('signature.document.voided', $array['event']);
    }

    public function testTestWebhookRequestWithData(): void
    {
        $request = new TestWebhookRequest(data: ['documentId' => 'doc-1']);
        $array = $request->toArray();
        $this->assertEquals(['documentId' => 'doc-1'], $array['data']);
    }

    // =============================================
    // ListWebhookDeliveriesRequest Tests
    // =============================================

    public function testListWebhookDeliveriesRequestToQueryParams(): void
    {
        $request = new ListWebhookDeliveriesRequest(limit: 5, offset: 10);
        $params = $request->toQueryParams();

        $this->assertEquals(5, $params['limit']);
        $this->assertEquals(10, $params['offset']);
    }

    // =============================================
    // WebhookResponse Tests
    // =============================================

    public function testWebhookResponseFromArray(): void
    {
        $data = [
            'success' => true,
            'data' => [
                'id' => 'webhook-uuid-789',
                'name' => 'my-signing-webhook',
                'urls' => ['https://example.com/hook'],
                'events' => ['signature.document.completed'],
                'isActive' => true,
                'secret' => 'whsec_abc123',
                'createdOn' => '2025-01-01T00:00:00.000Z',
                'updatedOn' => '2025-01-01T00:00:00.000Z',
            ],
        ];

        $response = WebhookResponse::fromArray($data);

        $this->assertTrue($response->success);
        $this->assertEquals('webhook-uuid-789', $response->data->id);
        $this->assertEquals('my-signing-webhook', $response->data->name);
        $this->assertEquals('whsec_abc123', $response->data->secret);
        $this->assertTrue($response->data->isActive);
    }

    // =============================================
    // WebhookListResponse Tests
    // =============================================

    public function testWebhookListResponseFromArray(): void
    {
        $data = [
            'success' => true,
            'data' => [
                'results' => [
                    ['id' => 'wh-1', 'name' => 'webhook-one', 'urls' => [], 'events' => [], 'isActive' => true],
                    ['id' => 'wh-2', 'name' => 'webhook-two', 'urls' => [], 'events' => [], 'isActive' => false],
                ],
                'totalRecords' => 2,
                'limit' => 50,
                'offset' => 0,
            ],
        ];

        $response = WebhookListResponse::fromArray($data);

        $this->assertTrue($response->success);
        $this->assertCount(2, $response->data->results);
        $this->assertEquals(2, $response->data->totalRecords);
        $this->assertEquals('webhook-one', $response->data->results[0]->name);
    }

    // =============================================
    // WebhookDeliveryListResponse Tests
    // =============================================

    public function testWebhookDeliveryListResponseFromArray(): void
    {
        $data = [
            'success' => true,
            'data' => [
                'results' => [
                    [
                        'id' => 'del-1',
                        'webhookId' => 'webhook-uuid-789',
                        'event' => 'signature.document.completed',
                        'statusCode' => 200,
                        'success' => true,
                        'attemptCount' => 1,
                        'createdOn' => '2025-01-01T00:00:00.000Z',
                    ],
                ],
                'totalRecords' => 1,
                'limit' => 50,
                'offset' => 0,
            ],
        ];

        $response = WebhookDeliveryListResponse::fromArray($data);

        $this->assertTrue($response->success);
        $this->assertCount(1, $response->data->results);
        $this->assertEquals('signature.document.completed', $response->data->results[0]->event);
    }

    // =============================================
    // TestWebhookResponse Tests
    // =============================================

    public function testTestWebhookResponseFromArray(): void
    {
        $data = [
            'success' => true,
            'data' => [
                'deliveries' => [],
                'summary' => [
                    'total' => 1,
                    'successful' => 1,
                    'failed' => 0,
                    'errors' => [],
                ],
            ],
        ];

        $response = TestWebhookResponse::fromArray($data);

        $this->assertTrue($response->success);
        $this->assertEquals(1, $response->data->summary->total);
        $this->assertEquals(1, $response->data->summary->successful);
        $this->assertEquals(0, $response->data->summary->failed);
    }
}
