<?php

declare(strict_types=1);

namespace TurboDocx;

use GuzzleHttp\Client as GuzzleClient;
use TurboDocx\Config\HttpClientConfig;
use TurboDocx\Types\Requests\CreateSignatureReviewLinkRequest;
use TurboDocx\Types\Requests\SendSignatureRequest;
use TurboDocx\Types\Responses\AuditTrailResponse;
use TurboDocx\Types\Responses\CreateSignatureReviewLinkResponse;
use TurboDocx\Types\Responses\DocumentStatusResponse;
use TurboDocx\Types\Responses\ResendEmailResponse;
use TurboDocx\Types\Responses\SendSignatureResponse;
use TurboDocx\Types\Responses\VoidDocumentResponse;

/**
 * TurboSign - Digital signature operations
 *
 * Static class matching TypeScript SDK API
 */
final class TurboSign
{
    private static ?HttpClient $client = null;

    /**
     * Configure TurboSign with API credentials
     *
     * @param HttpClientConfig $config Configuration object
     * @return void
     *
     * @example
     * ```php
     * TurboSign::configure(new HttpClientConfig(
     *     apiKey: $_ENV['TURBODOCX_API_KEY'],
     *     orgId: $_ENV['TURBODOCX_ORG_ID'],
     *     senderEmail: 'support@yourcompany.com',
     *     senderName: 'Your Company Name'  // Strongly recommended
     * ));
     * ```
     */
    public static function configure(HttpClientConfig $config): void
    {
        self::$client = new HttpClient($config);
    }

    /**
     * Get client instance, auto-initialize from environment if needed
     *
     * @return HttpClient
     */
    private static function getClient(): HttpClient
    {
        if (self::$client === null) {
            // Auto-initialize from environment variables
            self::$client = new HttpClient(
                HttpClientConfig::fromEnvironment()
            );
        }
        return self::$client;
    }

    /**
     * Create signature review link without sending emails
     *
     * This method uploads a document with signature fields and recipients,
     * but does NOT send signature request emails. Use this to preview
     * field placement before sending.
     *
     * @param CreateSignatureReviewLinkRequest $request Document, recipients, and fields configuration
     * @return CreateSignatureReviewLinkResponse
     *
     * @example
     * ```php
     * $result = TurboSign::createSignatureReviewLink(
     *     new CreateSignatureReviewLinkRequest(
     *         recipients: [new Recipient('John Doe', 'john@example.com', 1)],
     *         fields: [new Field(SignatureFieldType::SIGNATURE, 'john@example.com', page: 1, x: 100, y: 500, width: 200, height: 50)],
     *         file: file_get_contents('contract.pdf')
     *     )
     * );
     * ```
     */
    public static function createSignatureReviewLink(
        CreateSignatureReviewLinkRequest $request
    ): CreateSignatureReviewLinkResponse {
        $client = self::getClient();
        $senderConfig = $client->getSenderConfig();

        // Serialize recipients and fields to JSON strings (as backend expects)
        $recipientsJson = json_encode(array_map(fn($r) => $r->toArray(), $request->recipients));
        $fieldsJson = json_encode(array_map(fn($f) => $f->toArray(), $request->fields));

        // Build form data
        $formData = [
            'recipients' => $recipientsJson,
            'fields' => $fieldsJson,
        ];

        // Add optional fields
        if ($request->documentName !== null) {
            $formData['documentName'] = $request->documentName;
        }
        if ($request->documentDescription !== null) {
            $formData['documentDescription'] = $request->documentDescription;
        }

        // Use request senderEmail/senderName if provided, otherwise fall back to configured values
        $formData['senderEmail'] = $request->senderEmail ?? $senderConfig['sender_email'];
        if ($request->senderName !== null || $senderConfig['sender_name'] !== null) {
            $formData['senderName'] = $request->senderName ?? $senderConfig['sender_name'];
        }

        if ($request->ccEmails !== null) {
            $formData['ccEmails'] = json_encode($request->ccEmails);
        }

        // Handle different file input methods
        if ($request->file !== null) {
            // File upload - use multipart form
            $response = $client->uploadFile(
                '/turbosign/single/prepare-for-review',
                $request->file,
                'file',
                $formData
            );
            return CreateSignatureReviewLinkResponse::fromArray($response);
        } else {
            // URL, deliverable, or template - use JSON body
            if ($request->fileLink !== null) {
                $formData['fileLink'] = $request->fileLink;
            }
            if ($request->deliverableId !== null) {
                $formData['deliverableId'] = $request->deliverableId;
            }
            if ($request->templateId !== null) {
                $formData['templateId'] = $request->templateId;
            }

            $response = $client->post(
                '/turbosign/single/prepare-for-review',
                $formData
            );
            return CreateSignatureReviewLinkResponse::fromArray($response);
        }
    }

    /**
     * Send signature request and immediately send emails
     *
     * This method uploads a document with signature fields and recipients,
     * then immediately sends signature request emails to all recipients.
     *
     * @param SendSignatureRequest $request Document, recipients, and fields configuration
     * @return SendSignatureResponse
     *
     * @example
     * ```php
     * $result = TurboSign::sendSignature(
     *     new SendSignatureRequest(
     *         recipients: [new Recipient('John Doe', 'john@example.com', 1)],
     *         fields: [new Field(SignatureFieldType::SIGNATURE, 'john@example.com', page: 1, x: 100, y: 500, width: 200, height: 50)],
     *         file: file_get_contents('contract.pdf')
     *     )
     * );
     * ```
     */
    public static function sendSignature(
        SendSignatureRequest $request
    ): SendSignatureResponse {
        $client = self::getClient();
        $senderConfig = $client->getSenderConfig();

        // Serialize recipients and fields to JSON strings (as backend expects)
        $recipientsJson = json_encode(array_map(fn($r) => $r->toArray(), $request->recipients));
        $fieldsJson = json_encode(array_map(fn($f) => $f->toArray(), $request->fields));

        // Build form data
        $formData = [
            'recipients' => $recipientsJson,
            'fields' => $fieldsJson,
        ];

        // Add optional fields
        if ($request->documentName !== null) {
            $formData['documentName'] = $request->documentName;
        }
        if ($request->documentDescription !== null) {
            $formData['documentDescription'] = $request->documentDescription;
        }

        // Use request senderEmail/senderName if provided, otherwise fall back to configured values
        $formData['senderEmail'] = $request->senderEmail ?? $senderConfig['sender_email'];
        if ($request->senderName !== null || $senderConfig['sender_name'] !== null) {
            $formData['senderName'] = $request->senderName ?? $senderConfig['sender_name'];
        }

        if ($request->ccEmails !== null) {
            $formData['ccEmails'] = json_encode($request->ccEmails);
        }

        // Handle different file input methods
        if ($request->file !== null) {
            // File upload - use multipart form
            $response = $client->uploadFile(
                '/turbosign/single/prepare-for-signing',
                $request->file,
                'file',
                $formData
            );
            return SendSignatureResponse::fromArray($response);
        } else {
            // URL, deliverable, or template - use JSON body
            if ($request->fileLink !== null) {
                $formData['fileLink'] = $request->fileLink;
            }
            if ($request->deliverableId !== null) {
                $formData['deliverableId'] = $request->deliverableId;
            }
            if ($request->templateId !== null) {
                $formData['templateId'] = $request->templateId;
            }

            $response = $client->post(
                '/turbosign/single/prepare-for-signing',
                $formData
            );
            return SendSignatureResponse::fromArray($response);
        }
    }

    /**
     * Get the status of a document
     *
     * @param string $documentId ID of the document
     * @return DocumentStatusResponse
     *
     * @example
     * ```php
     * $status = TurboSign::getStatus($documentId);
     * echo $status->status->value; // 'completed', 'pending', etc.
     * ```
     */
    public static function getStatus(string $documentId): DocumentStatusResponse
    {
        $client = self::getClient();
        $response = $client->get("/turbosign/documents/{$documentId}/status");
        return DocumentStatusResponse::fromArray($response);
    }

    /**
     * Download the signed document
     *
     * The backend returns a presigned S3 URL. This method fetches
     * that URL and then downloads the actual file from S3.
     *
     * @param string $documentId ID of the document
     * @return string PDF file content as bytes
     *
     * @example
     * ```php
     * $pdfContent = TurboSign::download($documentId);
     * file_put_contents('signed.pdf', $pdfContent);
     * ```
     */
    public static function download(string $documentId): string
    {
        $client = self::getClient();

        // Step 1: Get the presigned URL from the API
        $response = $client->get("/turbosign/documents/{$documentId}/download");

        // Step 2: Fetch the actual file from S3
        $downloadUrl = $response['downloadUrl'] ?? null;
        if ($downloadUrl === null) {
            throw new \RuntimeException('No download URL in response');
        }

        // Use Guzzle to download the file
        $guzzle = new GuzzleClient();
        $fileResponse = $guzzle->get($downloadUrl);

        return $fileResponse->getBody()->getContents();
    }

    /**
     * Void a document (cancel signature request)
     *
     * @param string $documentId ID of the document to void
     * @param string $reason Reason for voiding the document
     * @return VoidDocumentResponse
     *
     * @example
     * ```php
     * TurboSign::void($documentId, 'Document needs to be revised');
     * ```
     */
    public static function void(string $documentId, string $reason): VoidDocumentResponse
    {
        $client = self::getClient();
        // Backend returns empty data on success, so we just make the call
        // and return a success response if no exception is thrown
        $client->post(
            "/turbosign/documents/{$documentId}/void",
            ['reason' => $reason]
        );

        // If we get here without exception, the void was successful
        return new VoidDocumentResponse(
            success: true,
            message: 'Document has been voided successfully'
        );
    }

    /**
     * Resend signature request email to recipients
     *
     * @param string $documentId ID of the document
     * @param array<string> $recipientIds Array of recipient IDs to resend emails to (empty array = all recipients)
     * @return ResendEmailResponse
     *
     * @example
     * ```php
     * // Resend to specific recipients
     * TurboSign::resend($documentId, [$recipientId1, $recipientId2]);
     *
     * // Resend to all recipients
     * TurboSign::resend($documentId, []);
     * ```
     */
    public static function resend(
        string $documentId,
        array $recipientIds
    ): ResendEmailResponse {
        $client = self::getClient();
        $response = $client->post(
            "/turbosign/documents/{$documentId}/resend-email",
            ['recipientIds' => $recipientIds]
        );
        return ResendEmailResponse::fromArray($response);
    }

    /**
     * Get audit trail for a document
     *
     * @param string $documentId ID of the document
     * @return AuditTrailResponse
     *
     * @example
     * ```php
     * $audit = TurboSign::getAuditTrail($documentId);
     * foreach ($audit->entries as $entry) {
     *     echo "{$entry->event} - {$entry->actor} - {$entry->timestamp}\n";
     * }
     * ```
     */
    public static function getAuditTrail(string $documentId): AuditTrailResponse
    {
        $client = self::getClient();
        $response = $client->get("/turbosign/documents/{$documentId}/audit-trail");
        return AuditTrailResponse::fromArray($response);
    }
}
