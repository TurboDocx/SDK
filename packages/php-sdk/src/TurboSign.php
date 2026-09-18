<?php

declare(strict_types=1);

namespace TurboDocx;

use GuzzleHttp\Client as GuzzleClient;
use TurboDocx\Config\HttpClientConfig;
use TurboDocx\Exceptions\TurboDocxException;
use TurboDocx\Exceptions\ValidationException;
use TurboDocx\Types\Field;
use TurboDocx\Types\FieldPlacement;
use TurboDocx\Types\IdentityVerification;
use TurboDocx\Types\Recipient;
use TurboDocx\Types\SignatureFieldType;
use TurboDocx\Types\TemplateConfig;
use TurboDocx\Types\Requests\CreateEmbeddedSignatureRequest;
use TurboDocx\Types\Requests\CreateSignatureReviewLinkRequest;
use TurboDocx\Types\Requests\CreateSigningUrlRequest;
use TurboDocx\Types\Requests\EmbeddedSignatureRecipient;
use TurboDocx\Types\Requests\SendSignatureRequest;
use TurboDocx\Types\Responses\AuditTrailResponse;
use TurboDocx\Types\Responses\CreateEmbeddedSignatureResponse;
use TurboDocx\Types\Responses\CreateSignatureReviewLinkResponse;
use TurboDocx\Types\Responses\CreateSigningUrlResponse;
use TurboDocx\Types\Responses\DocumentRecipientsResponse;
use TurboDocx\Types\Responses\DocumentStatusResponse;
use TurboDocx\Types\Responses\EmbeddedSignatureRecipientResult;
use TurboDocx\Types\Responses\EmbeddedSigningSettings;
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

        // Per-document reminder + expiration overrides; omitted fields inherit the org defaults.
        self::applyScheduleOverrides($formData, $request);

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

        // Forward email suppression when explicitly set. Tested with `!== null` (never truthiness),
        // exactly like the schedule overrides: `false` (do not email) is a meaningful value and a
        // truthiness check would drop it and silently let the backend email the recipients.
        if ($request->sendEmail !== null) {
            $formData['sendEmail'] = $request->sendEmail;
        }

        // Per-document reminder + expiration overrides; omitted fields inherit the org defaults.
        self::applyScheduleOverrides($formData, $request);

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
     * Get every recipient on a document with their signing status
     *
     * Answers "who has signed and who are we still waiting on" in one call, and reports
     * who sent the document. The summary carries the pending/viewed/completed counts.
     *
     * @param string $documentId ID of the document
     * @return DocumentRecipientsResponse
     *
     * @example
     * ```php
     * $result = TurboSign::getRecipients($documentId);
     * echo "{$result->summary->completed}/{$result->summary->total} signed";
     * echo "sent by {$result->document->sentBy->name}";
     * ```
     */
    public static function getRecipients(string $documentId): DocumentRecipientsResponse
    {
        $client = self::getClient();
        $response = $client->get("/turbosign/documents/{$documentId}/recipients");
        return DocumentRecipientsResponse::fromArray($response);
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
        $response = $client->post(
            "/turbosign/documents/{$documentId}/void",
            ['reason' => $reason]
        );
        return VoidDocumentResponse::fromArray($response);
    }

    /**
     * Mint a single-use embedded signing URL for one recipient — request it the moment the signer
     * is ready (never store it). The counterpart of DocuSign's createRecipientView. Open the
     * returned `url` in a new tab or redirect to it.
     *
     * @param string $documentId The document the recipient belongs to
     * @param CreateSigningUrlRequest|array<string, mixed> $request Exactly one of `recipientId` /
     *     `externalId`; `identityAssertion` only for external_idv recipients; optional https `returnUrl`
     * @return CreateSigningUrlResponse
     * @throws ValidationException If not exactly one selector is provided, or returnUrl is not https
     *
     * @example
     * ```php
     * $link = TurboSign::createSigningUrl($documentId, new CreateSigningUrlRequest(
     *     externalId: 'baers_customer_123'
     * ));
     * echo $link->url;
     * ```
     */
    public static function createSigningUrl(
        string $documentId,
        CreateSigningUrlRequest|array $request
    ): CreateSigningUrlResponse {
        if (is_array($request)) {
            $request = CreateSigningUrlRequest::fromArray($request);
        }

        // Fail fast with actionable messages; the server still enforces everything. Validation runs
        // BEFORE the client is touched so these checks stay HTTP-free.
        $selectors = array_filter(
            [$request->recipientId, $request->externalId],
            static fn(?string $v): bool => $v !== null && $v !== ''
        );
        if (count($selectors) !== 1) {
            throw new ValidationException(
                'Provide exactly one of recipientId or externalId to createSigningUrl.',
                'RecipientSelectorInvalid'
            );
        }
        if ($request->returnUrl !== null && stripos($request->returnUrl, 'https://') !== 0) {
            throw new ValidationException('returnUrl must be an https URL.', 'InvalidReturnUrl');
        }

        $client = self::getClient();
        // The endpoint replies { data: { results } }. The HTTP client strips the outer `data`, so
        // unwrap the `results` envelope here. `?? $response` keeps it correct if the API ever
        // returns a flat body, and avoids passing null into fromArray() under strict_types.
        $response = $client->post("/turbosign/documents/{$documentId}/signing-url", $request->toArray());
        $results = is_array($response) ? ($response['results'] ?? $response) : [];

        return CreateSigningUrlResponse::fromArray($results);
    }

    /**
     * Read the org's embedded-signing settings: the set-once, org-wide gates (embedded signing
     * enabled, external identity verification allowed, override allowed), the default OTP channel,
     * and the allowed iframe embedding origins. Read-only.
     *
     * @return EmbeddedSigningSettings
     *
     * @example
     * ```php
     * $settings = TurboSign::getEmbeddedSigningSettings();
     * if (!$settings->enabled) {
     *     throw new RuntimeException('Embedded signing is not enabled for this org.');
     * }
     * ```
     */
    public static function getEmbeddedSigningSettings(): EmbeddedSigningSettings
    {
        $client = self::getClient();
        // { data: { results } } envelope, same as createSigningUrl above.
        $response = $client->get('/turbosign/embedded-signing-settings');
        $results = is_array($response) ? ($response['results'] ?? $response) : [];

        return EmbeddedSigningSettings::fromArray($results);
    }

    /**
     * Create a signature request AND mint a per-recipient embedded signing URL in ONE call.
     *
     * This is a thin WRAPPER over {@see TurboSign::sendSignature()} + {@see TurboSign::createSigningUrl()}
     * — no new endpoint. It maps the ergonomic request (per-recipient `auth` + `fields` shorthand)
     * onto those calls, then assembles a per-recipient result carrying the embed URL and the
     * resolved identity-verification mode.
     *
     * Turn-aware: with a real (sequential) signing order the backend only mints a URL for the signer
     * whose turn it is. Rather than throw the whole call away, each result carries a `status`:
     * - 'ready' — it's their turn; `embedUrl` is set.
     * - 'pending' — an earlier signer hasn't finished; `embedUrl` is null. Re-mint later with
     *   {@see TurboSign::createSigningUrl()}.
     * - 'completed' — they've already signed; `embedUrl` is null.
     * A genuine error (anything other than not-in-turn / already-signed) still throws.
     *
     * @param CreateEmbeddedSignatureRequest $request
     * @return CreateEmbeddedSignatureResponse
     * @throws ValidationException|TurboDocxException
     */
    public static function createEmbeddedSignature(
        CreateEmbeddedSignatureRequest $request
    ): CreateEmbeddedSignatureResponse {
        // 1. Map the ergonomic recipients onto full Recipient objects (identity + phone + order).
        $mappedRecipients = [];
        foreach ($request->recipients as $index => $r) {
            $identityVerification = self::resolveIdentityVerification($r);
            $phone = $r->auth?->smsPhoneNumber ?? $r->phone;
            $mappedRecipients[] = new Recipient(
                name: $r->name,
                email: $r->email,
                signingOrder: $r->signingOrder ?? $index + 1,
                phone: $phone,
                identityVerification: $identityVerification,
            );
        }

        // Fail fast on identity-config mistakes (mirrors the JS validateRecipientsIdentity call).
        self::validateRecipientsIdentity($mappedRecipients);

        // Full `fields` (when provided) win verbatim; otherwise expand each recipient's shorthand.
        $fields = $request->fields;
        if ($fields === null) {
            $fields = [];
            foreach ($request->recipients as $r) {
                foreach (self::expandRecipientFields($r) as $field) {
                    $fields[] = $field;
                }
            }
        }

        // Embedded flow default: suppress recipient emails (the host owns the UX).
        $sent = self::sendSignature(new SendSignatureRequest(
            recipients: $mappedRecipients,
            fields: $fields,
            file: $request->file,
            fileName: $request->fileName,
            fileLink: $request->fileLink,
            deliverableId: $request->deliverableId,
            templateId: $request->templateId,
            documentName: $request->documentName,
            documentDescription: $request->documentDescription,
            senderName: $request->senderName,
            senderEmail: $request->senderEmail,
            ccEmails: $request->ccEmails,
            sendEmail: $request->sendEmail ?? false,
        ));

        // Match the backend's recipients back to the request by email so we can carry `name` and
        // know the resolved identity mode. The response's `recipients` is optional, so guard it.
        $recipientIdByEmail = [];
        foreach ($sent->recipients ?? [] as $sr) {
            if (is_array($sr) && isset($sr['email'], $sr['id'])) {
                $recipientIdByEmail[(string) $sr['email']] = (string) $sr['id'];
            }
        }

        // 2 + 3. Mint one embed URL per recipient and assemble the result IN SIGNING ORDER.
        $ordered = [];
        foreach ($request->recipients as $index => $r) {
            $ordered[] = ['r' => $r, 'order' => $r->signingOrder ?? $index + 1];
        }
        usort($ordered, static fn(array $a, array $b): int => $a['order'] <=> $b['order']);

        $results = [];
        foreach ($ordered as $entry) {
            /** @var EmbeddedSignatureRecipient $r */
            $r = $entry['r'];
            $recipientId = $recipientIdByEmail[$r->email] ?? null;
            if ($recipientId === null) {
                throw new ValidationException(
                    "sendSignature did not return a recipient matching \"{$r->email}\"; cannot mint an embed URL.",
                    'EmbeddedRecipientNotReturned'
                );
            }

            // Turn-aware: the backend refuses to mint a URL for a signer whose turn hasn't come
            // (RecipientNotInTurn / NotSignersTurn) or who already signed (RecipientAlreadySigned).
            // Those are expected states, not failures — degrade to a null URL + status. Any OTHER
            // error propagates. Catch the BASE exception: the backend may map these codes to 400,
            // 403 or 409, so branch on the errorCode, not the HTTP class.
            try {
                $link = self::createSigningUrl($sent->documentId, new CreateSigningUrlRequest(
                    recipientId: $recipientId,
                    returnUrl: $request->returnUrl,
                ));
                $results[] = new EmbeddedSignatureRecipientResult(
                    recipientId: $recipientId,
                    name: $r->name,
                    email: $r->email,
                    embedUrl: $link->url,
                    status: EmbeddedSignatureRecipientResult::STATUS_READY,
                    identityVerificationMode: $link->identityVerificationMode,
                );
            } catch (TurboDocxException $e) {
                $code = $e->errorCode;
                if ($code !== 'RecipientNotInTurn' && $code !== 'NotSignersTurn' && $code !== 'RecipientAlreadySigned') {
                    throw $e;
                }
                $results[] = new EmbeddedSignatureRecipientResult(
                    recipientId: $recipientId,
                    name: $r->name,
                    email: $r->email,
                    embedUrl: null,
                    status: $code === 'RecipientAlreadySigned'
                        ? EmbeddedSignatureRecipientResult::STATUS_COMPLETED
                        : EmbeddedSignatureRecipientResult::STATUS_PENDING,
                    identityVerificationMode: self::resolveIdentityVerification($r)?->mode,
                );
            }
        }

        return new CreateEmbeddedSignatureResponse($sent->documentId, $results);
    }

    /**
     * Shorthand field key => the concrete field type and default size it emits.
     *
     * Note `initials` maps to the `initial` field type — that is the literal in SignatureFieldType.
     *
     * @return array<string, array{type: SignatureFieldType, width: int, height: int}>
     */
    private static function embeddedFieldSpecs(): array
    {
        return [
            'signature' => ['type' => SignatureFieldType::SIGNATURE, 'width' => 100, 'height' => 30],
            'date' => ['type' => SignatureFieldType::DATE, 'width' => 75, 'height' => 30],
            'initials' => ['type' => SignatureFieldType::INITIAL, 'width' => 50, 'height' => 30],
            'fullName' => ['type' => SignatureFieldType::FULL_NAME, 'width' => 150, 'height' => 30],
        ];
    }

    /**
     * Map an embedded recipient's ergonomic `auth` shorthand to a full IdentityVerification.
     * `emailOtp` wins if both are set. Returns null when no auth is requested (no verification).
     */
    private static function resolveIdentityVerification(
        EmbeddedSignatureRecipient $recipient
    ): ?IdentityVerification {
        $auth = $recipient->auth;
        if ($auth === null) {
            return null;
        }
        if ($auth->emailOtp) {
            return IdentityVerification::otp('email');
        }
        if ($auth->smsPhoneNumber !== null) {
            return IdentityVerification::otp('sms');
        }
        return null;
    }

    /**
     * Expand a recipient's `fields` shorthand into full Field objects — one per provided key,
     * anchored to the given text with placement 'replace' and the key's default size.
     *
     * @return array<Field>
     */
    private static function expandRecipientFields(EmbeddedSignatureRecipient $recipient): array
    {
        $shorthand = $recipient->fields;
        if ($shorthand === null) {
            return [];
        }

        $anchors = [
            'signature' => $shorthand->signature,
            'date' => $shorthand->date,
            'initials' => $shorthand->initials,
            'fullName' => $shorthand->fullName,
        ];

        $fields = [];
        foreach (self::embeddedFieldSpecs() as $key => $spec) {
            $anchor = $anchors[$key] ?? null;
            if ($anchor === null || $anchor === '') {
                continue;
            }
            $fields[] = new Field(
                type: $spec['type'],
                recipientEmail: $recipient->email,
                template: new TemplateConfig(
                    anchor: $anchor,
                    placement: FieldPlacement::REPLACE,
                    size: ['width' => $spec['width'], 'height' => $spec['height']],
                ),
            );
        }
        return $fields;
    }

    /**
     * Client-side fail-fast validation of each recipient's identityVerification. The server is the
     * source of truth; this catches the common mistakes early with actionable messages.
     *
     * @param array<Recipient> $recipients
     * @throws ValidationException
     */
    private static function validateRecipientsIdentity(array $recipients): void
    {
        foreach ($recipients as $r) {
            $iv = $r->identityVerification;
            if ($iv === null) {
                continue;
            }
            if ($iv->mode === IdentityVerification::MODE_OTP) {
                if ($iv->channel === 'sms' && ($r->phone === null || $r->phone === '')) {
                    throw new ValidationException(
                        "Recipient \"{$r->email}\" uses SMS OTP but has no phone (E.164).",
                        'PhoneRequiredForSmsOtp'
                    );
                }
            } elseif ($iv->mode === IdentityVerification::MODE_EXTERNAL_IDV) {
                if ($iv->provider === null || trim($iv->provider) === '') {
                    throw new ValidationException(
                        "Recipient \"{$r->email}\" uses external_idv but has no provider.",
                        'IdvProviderRequired'
                    );
                }
            } elseif ($iv->mode === IdentityVerification::MODE_OVERRIDE) {
                if ($iv->overrideIdentityVerification !== true) {
                    throw new ValidationException(
                        "Recipient \"{$r->email}\" override requires overrideIdentityVerification: true (boolean).",
                        'OverrideNotAcknowledged'
                    );
                }
                if ($iv->reason === null || trim($iv->reason) === '') {
                    throw new ValidationException(
                        "Recipient \"{$r->email}\" override requires a non-empty reason.",
                        'OverrideNotAcknowledged'
                    );
                }
            }
        }
    }

    /**
     * Copy per-document reminder/expiration overrides onto an outgoing request body.
     *
     * Durations are JSON-encoded. multipart/form-data has no notion of a nested value, so a
     * {value, unit} array cannot survive the file-upload path as an object. The API decodes a
     * JSON-string duration on both content types, so encoding uniformly keeps one code path for
     * the multipart and JSON branches — the same treatment recipients and fields already get.
     *
     * Presence is tested with `!== null`, never truthiness: `false` (feature off) and `0`
     * (no reminders / never warn) are meaningful values, and a truthiness check would drop them
     * and silently fall back to the organization's default.
     *
     * @param array<string, mixed> $formData
     * @param CreateSignatureReviewLinkRequest|SendSignatureRequest $request
     */
    private static function applyScheduleOverrides(array &$formData, object $request): void
    {
        if ($request->remindersEnabled !== null) {
            $formData['remindersEnabled'] = $request->remindersEnabled;
        }
        if ($request->maxReminders !== null) {
            $formData['maxReminders'] = $request->maxReminders;
        }
        if ($request->expirationEnabled !== null) {
            $formData['expirationEnabled'] = $request->expirationEnabled;
        }

        $durations = [
            'reminderDelay' => $request->reminderDelay,
            'reminderInterval' => $request->reminderInterval,
            'expireAfter' => $request->expireAfter,
            'expirationWarning' => $request->expirationWarning,
            'expirationWarningInterval' => $request->expirationWarningInterval,
        ];
        foreach ($durations as $key => $duration) {
            if ($duration !== null) {
                $formData[$key] = json_encode($duration);
            }
        }
    }

    /**
     * Send a reminder email to a document's outstanding signers.
     *
     * This is a standalone nudge, deliberately decoupled from the automatic reminder schedule: it
     * ignores the configured cadence, works even when reminders are disabled or the per-signer cap
     * is already spent, and does not consume that cap.
     *
     * Only signers at the CURRENT signing order are emailed. A recipient at a later order (or one
     * who has already signed) is reported back as skipped rather than silently dropped, so the
     * caller can tell that nobody was emailed.
     *
     * @param string $documentId ID of the document
     * @param array<string>|null $recipientIds Optional subset to remind. Omit to remind every
     *     eligible signer. When supplied the request is all-or-nothing: if any id is not a
     *     current-order pending signer the API rejects the whole call and sends nothing.
     * @return array<string, mixed> Results, one entry per recipient considered
     */
    public static function sendReminder(string $documentId, ?array $recipientIds = null): array
    {
        $client = self::getClient();

        // Only include the filter when it actually names someone. The API requires at least one
        // id when the key is present, so forwarding an empty array would guarantee a 400 — an
        // empty list is far more likely to mean "no filter" than "remind nobody".
        $body = [];
        if ($recipientIds !== null && count($recipientIds) > 0) {
            $body['recipientIds'] = $recipientIds;
        }

        return $client->post("/turbosign/documents/{$documentId}/send-reminder", $body);
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
     * foreach ($audit->auditTrail as $entry) {
     *     echo "{$entry->actionType} - {$entry->timestamp}\n";
     *     if ($entry->user) {
     *         echo "  By: {$entry->user->name}\n";
     *     }
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
