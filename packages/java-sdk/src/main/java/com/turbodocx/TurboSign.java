package com.turbodocx;

import com.google.gson.Gson;
import com.google.gson.reflect.TypeToken;
import com.turbodocx.models.*;
import okhttp3.OkHttpClient;
import okhttp3.Request;
import okhttp3.Response;

import java.io.IOException;
import java.lang.reflect.Type;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * TurboSign client for digital signature operations
 * with 100% parity with the JS SDK
 */
public final class TurboSign {
    private final HttpClient httpClient;
    private final Gson gson;
    private final OkHttpClient s3Client;

    public TurboSign(HttpClient httpClient) {
        this.httpClient = httpClient;
        this.gson = new Gson();
        this.s3Client = new OkHttpClient();
    }

    /**
     * Prepare document for review without sending emails.
     * Use this to preview field placement before sending.
     */
    public CreateSignatureReviewLinkResponse createSignatureReviewLink(CreateSignatureReviewLinkRequest request) throws IOException {
        Map<String, String> formData = buildFormData(
                request.getRecipients(),
                request.getFields(),
                request.getDocumentName(),
                request.getDocumentDescription(),
                request.getSenderName(),
                request.getSenderEmail(),
                request.getCcEmails(),
                request.getSchedule()
        );

        if (request.hasFile()) {
            String fileName = request.getFileName();
            return httpClient.uploadFile(
                    "/turbosign/single/prepare-for-review",
                    request.getFile(),
                    fileName,
                    formData,
                    CreateSignatureReviewLinkResponse.class
            );
        } else {
            if (request.getFileLink() != null) {
                formData.put("fileLink", request.getFileLink());
            }
            if (request.getDeliverableId() != null) {
                formData.put("deliverableId", request.getDeliverableId());
            }
            if (request.getTemplateId() != null) {
                formData.put("templateId", request.getTemplateId());
            }

            return httpClient.post(
                    "/turbosign/single/prepare-for-review",
                    formData,
                    CreateSignatureReviewLinkResponse.class
            );
        }
    }

    /**
     * Prepare document for signing and send emails in a single call.
     * This is the equivalent "Prepare for Signing" operation.
     */
    public SendSignatureResponse sendSignature(SendSignatureRequest request) throws IOException {
        Map<String, String> formData = buildFormData(
                request.getRecipients(),
                request.getFields(),
                request.getDocumentName(),
                request.getDocumentDescription(),
                request.getSenderName(),
                request.getSenderEmail(),
                request.getCcEmails(),
                request.getSchedule()
        );

        // Forward email suppression only from the send path (never the review path). Tested with
        // != null, not truthiness: false (do not email) is meaningful and must not be dropped.
        if (request.getSendEmail() != null) {
            formData.put("sendEmail", String.valueOf(request.getSendEmail()));
        }

        if (request.hasFile()) {
            String fileName = request.getFileName();
            return httpClient.uploadFile(
                    "/turbosign/single/prepare-for-signing",
                    request.getFile(),
                    fileName,
                    formData,
                    SendSignatureResponse.class
            );
        } else {
            if (request.getFileLink() != null) {
                formData.put("fileLink", request.getFileLink());
            }
            if (request.getDeliverableId() != null) {
                formData.put("deliverableId", request.getDeliverableId());
            }
            if (request.getTemplateId() != null) {
                formData.put("templateId", request.getTemplateId());
            }

            return httpClient.post(
                    "/turbosign/single/prepare-for-signing",
                    formData,
                    SendSignatureResponse.class
            );
        }
    }

    /**
     * Get the status of a document
     */
    public DocumentStatusResponse getStatus(String documentId) throws IOException {
        return httpClient.get(
                "/turbosign/documents/" + documentId + "/status",
                DocumentStatusResponse.class
        );
    }

    /**
     * Get every recipient on a document with their signing status.
     *
     * <p>Answers "who has signed and who are we still waiting on" in one call, and reports who
     * sent the document. {@link DocumentRecipientsResponse#getSummary()} carries the
     * pending/viewed/completed counts.
     */
    public DocumentRecipientsResponse getRecipients(String documentId) throws IOException {
        return httpClient.get(
                "/turbosign/documents/" + documentId + "/recipients",
                DocumentRecipientsResponse.class
        );
    }

    /**
     * Download the signed document.
     * The backend returns a presigned S3 URL, which this method fetches.
     */
    public byte[] download(String documentId) throws IOException {
        // Get presigned URL from API
        DownloadResponse downloadResponse = httpClient.get(
                "/turbosign/documents/" + documentId + "/download",
                DownloadResponse.class
        );

        if (downloadResponse.getDownloadUrl() == null || downloadResponse.getDownloadUrl().isEmpty()) {
            throw new TurboDocxException("No download URL in response");
        }

        // Fetch actual file from S3
        Request request = new Request.Builder()
                .url(downloadResponse.getDownloadUrl())
                .get()
                .build();

        try (Response response = s3Client.newCall(request).execute()) {
            if (!response.isSuccessful()) {
                throw new TurboDocxException.NetworkException("Failed to download file: " + response.message());
            }
            return response.body() != null ? response.body().bytes() : new byte[0];
        }
    }

    /**
     * Void a document (cancel signature request)
     */
    public VoidDocumentResponse voidDocument(String documentId, String reason) throws IOException {
        Map<String, String> body = new HashMap<>();
        body.put("reason", reason);

        return httpClient.post(
                "/turbosign/documents/" + documentId + "/void",
                body,
                VoidDocumentResponse.class
        );
    }

    /**
     * Resend signature request email to recipients
     */
    public ResendEmailResponse resendEmail(String documentId, List<String> recipientIds) throws IOException {
        Map<String, List<String>> body = new HashMap<>();
        body.put("recipientIds", recipientIds);

        return httpClient.post(
                "/turbosign/documents/" + documentId + "/resend-email",
                body,
                ResendEmailResponse.class
        );
    }

    /**
     * Get the audit trail for a document
     */
    public AuditTrailResponse getAuditTrail(String documentId) throws IOException {
        return httpClient.get(
                "/turbosign/documents/" + documentId + "/audit-trail",
                AuditTrailResponse.class
        );
    }

    // ============================================
    // EMBEDDED SIGNING
    // ============================================

    /**
     * Shorthand field key → the concrete field type it emits plus its default size. Mirrors the
     * JS {@code EMBEDDED_FIELD_SPECS}. Note {@code initials} maps to the {@code "initial"} field
     * type (there is no {@code "initials"} type).
     */
    private static final EmbeddedFieldSpec[] EMBEDDED_FIELD_SPECS = new EmbeddedFieldSpec[]{
            new EmbeddedFieldSpec("signature", "signature", 100, 30),
            new EmbeddedFieldSpec("date", "date", 75, 30),
            new EmbeddedFieldSpec("initials", "initial", 50, 30),
            new EmbeddedFieldSpec("fullName", "full_name", 150, 30),
    };

    private static final class EmbeddedFieldSpec {
        final String key;
        final String type;
        final int width;
        final int height;

        EmbeddedFieldSpec(String key, String type, int width, int height) {
            this.key = key;
            this.type = type;
            this.width = width;
            this.height = height;
        }
    }

    /** Envelope for the {@code { data: { results } }} shape, after HttpClient strips the outer data. */
    private static final class ResultsObjectEnvelope<T> {
        private T results;

        T getResults() {
            return results;
        }
    }

    /**
     * Mint a single-use embedded signing URL for one recipient — request it the moment the signer
     * is ready (never store it). Open the returned {@code url} in a new tab or redirect to it.
     *
     * <p>Provide exactly one of {@code recipientId} / {@code externalId}. {@code identityAssertion}
     * is only for external_idv recipients; {@code returnUrl}, when supplied, must be https. Both are
     * checked client-side here for a fast, actionable message; the server still enforces everything.
     *
     * @param documentId the document the recipient belongs to
     * @param request    the recipient selector plus optional assertion / return URL
     * @return the signing URL and its metadata (identity mode, pending passcode checks, expiry)
     * @throws IOException on transport failure
     */
    public CreateSigningUrlResponse createSigningUrl(String documentId, CreateSigningUrlRequest request)
            throws IOException {
        // Fail fast with actionable messages; the server still enforces everything.
        int selectorCount = 0;
        if (isPresent(request.getRecipientId())) {
            selectorCount++;
        }
        if (isPresent(request.getExternalId())) {
            selectorCount++;
        }
        if (selectorCount != 1) {
            throw new TurboDocxException.ValidationException(
                    "Provide exactly one of recipientId or externalId to createSigningUrl.",
                    "RecipientSelectorInvalid");
        }

        String returnUrl = request.getReturnUrl();
        if (returnUrl != null && !returnUrl.toLowerCase().startsWith("https://")) {
            throw new TurboDocxException.ValidationException("returnUrl must be an https URL.", "InvalidReturnUrl");
        }

        // The endpoint replies { data: { results } }. HttpClient strips the outer data, so unwrap
        // the results envelope here (same convention as the quote/deliverable modules). Double
        // unwrap is robust whether or not the data wrapper is present.
        Type type = new TypeToken<ResultsObjectEnvelope<CreateSigningUrlResponse>>() {}.getType();
        ResultsObjectEnvelope<CreateSigningUrlResponse> envelope = httpClient.post(
                "/turbosign/documents/" + documentId + "/signing-url",
                request,
                type
        );
        return envelope.getResults();
    }

    /**
     * Read the org's embedded-signing settings: the set-once, org-wide gates (embedded signing
     * enabled, external identity verification allowed, override allowed), the default OTP channel,
     * and the allowed iframe embedding origins. Read-only.
     *
     * @return the org's embedded-signing gates and defaults
     * @throws IOException on transport failure
     */
    public EmbeddedSigningSettings getEmbeddedSigningSettings() throws IOException {
        // { data: { results } } envelope, same as createSigningUrl above.
        Type type = new TypeToken<ResultsObjectEnvelope<EmbeddedSigningSettings>>() {}.getType();
        ResultsObjectEnvelope<EmbeddedSigningSettings> envelope = httpClient.get(
                "/turbosign/embedded-signing-settings",
                type
        );
        return envelope.getResults();
    }

    /**
     * Create a signature request AND mint a per-recipient embedded signing URL in ONE call. This is
     * a thin WRAPPER over {@link #sendSignature(SendSignatureRequest)} +
     * {@link #createSigningUrl(String, CreateSigningUrlRequest)} — no new endpoint. It maps the
     * ergonomic request (per-recipient {@code auth} + {@code fields} shorthand) onto those calls,
     * then assembles a per-recipient result carrying the embed URL and the resolved identity mode,
     * IN SIGNING ORDER.
     *
     * <p>Turn-aware: with a real (sequential) signing order the backend only mints a URL for the
     * signer whose turn it is. Rather than throw the whole call away, each result carries a status:
     * <ul>
     *   <li>{@code "ready"} — it's their turn; {@code embedUrl} is set, frame it now.</li>
     *   <li>{@code "pending"} — an earlier signer hasn't finished; {@code embedUrl} is null.</li>
     *   <li>{@code "completed"} — they've already signed; {@code embedUrl} is null.</li>
     * </ul>
     * A genuine error (any code other than not-in-turn / already-signed) still propagates.
     *
     * @param request the embedded-signature request (document source, recipients, fields, options)
     * @return the document id and a per-recipient embed URL, in signing order
     * @throws IOException on transport failure
     */
    public CreateEmbeddedSignatureResponse createEmbeddedSignature(CreateEmbeddedSignatureRequest request)
            throws IOException {
        List<EmbeddedSignatureRecipient> requestRecipients = request.getRecipients() != null
                ? request.getRecipients()
                : new ArrayList<>();

        // 1. Map the ergonomic recipients onto full Recipient objects (identity + phone + order).
        List<Recipient> mappedRecipients = new ArrayList<>();
        for (int index = 0; index < requestRecipients.size(); index++) {
            EmbeddedSignatureRecipient r = requestRecipients.get(index);
            IdentityVerification identityVerification = resolveIdentityVerification(r.getAuth());
            String phone = resolvePhone(r);
            int order = r.getSigningOrder() != null ? r.getSigningOrder() : index + 1;
            mappedRecipients.add(new Recipient(r.getName(), r.getEmail(), order, phone, null, identityVerification));
        }

        // Full fields (when provided) win verbatim — even an explicitly empty list; otherwise expand
        // each recipient's shorthand. Null check, never isEmpty(), mirrors the JS `?? expand`.
        List<Field> fields;
        if (request.getFields() != null) {
            fields = request.getFields();
        } else {
            fields = new ArrayList<>();
            for (EmbeddedSignatureRecipient r : requestRecipients) {
                fields.addAll(expandRecipientFields(r));
            }
        }

        SendSignatureRequest.Builder sendBuilder = new SendSignatureRequest.Builder()
                .recipients(mappedRecipients)
                .fields(fields)
                // Embedded flow default: suppress recipient emails (the host owns the UX).
                .sendEmail(request.getSendEmail() != null ? request.getSendEmail() : Boolean.FALSE);

        if (request.hasFile()) {
            sendBuilder.file(request.getFile());
        }
        if (request.getFileName() != null) {
            sendBuilder.fileName(request.getFileName());
        }
        if (request.getFileLink() != null) {
            sendBuilder.fileLink(request.getFileLink());
        }
        if (request.getTemplateId() != null) {
            sendBuilder.templateId(request.getTemplateId());
        }
        if (request.getDeliverableId() != null) {
            sendBuilder.deliverableId(request.getDeliverableId());
        }
        if (request.getDocumentName() != null) {
            sendBuilder.documentName(request.getDocumentName());
        }
        if (request.getDocumentDescription() != null) {
            sendBuilder.documentDescription(request.getDocumentDescription());
        }
        if (request.getSenderName() != null) {
            sendBuilder.senderName(request.getSenderName());
        }
        if (request.getSenderEmail() != null) {
            sendBuilder.senderEmail(request.getSenderEmail());
        }
        if (request.getCcEmails() != null) {
            sendBuilder.ccEmails(request.getCcEmails());
        }

        SendSignatureResponse sent = sendSignature(sendBuilder.build());

        // Match the backend's recipients back to the request by email so we can carry the id.
        Map<String, String> recipientIdByEmail = new HashMap<>();
        if (sent.getRecipients() != null) {
            for (RecipientResponse sr : sent.getRecipients()) {
                recipientIdByEmail.put(sr.getEmail(), sr.getId());
            }
        }

        // 2 + 3. Order the request recipients by signing order (stable — keep a copy, never sort
        // the caller's list), mint one embed URL each, and assemble the result IN SIGNING ORDER.
        List<OrderedRecipient> ordered = new ArrayList<>();
        for (int index = 0; index < requestRecipients.size(); index++) {
            EmbeddedSignatureRecipient r = requestRecipients.get(index);
            int order = r.getSigningOrder() != null ? r.getSigningOrder() : index + 1;
            ordered.add(new OrderedRecipient(r, order));
        }
        ordered.sort(Comparator.comparingInt(o -> o.order));

        List<EmbeddedSignatureRecipientResult> results = new ArrayList<>();
        for (OrderedRecipient entry : ordered) {
            EmbeddedSignatureRecipient r = entry.recipient;
            String recipientId = recipientIdByEmail.get(r.getEmail());
            if (recipientId == null) {
                throw new TurboDocxException.ValidationException(
                        "sendSignature did not return a recipient matching \"" + r.getEmail()
                                + "\"; cannot mint an embed URL.",
                        "EmbeddedRecipientNotReturned");
            }

            // Turn-aware: RecipientNotInTurn / NotSignersTurn / RecipientAlreadySigned are expected
            // states, not failures — degrade to a null URL + status. Any OTHER error propagates.
            try {
                CreateSigningUrlRequest.Builder linkBuilder = new CreateSigningUrlRequest.Builder()
                        .recipientId(recipientId);
                if (request.getReturnUrl() != null) {
                    linkBuilder.returnUrl(request.getReturnUrl());
                }
                CreateSigningUrlResponse link = createSigningUrl(sent.getDocumentId(), linkBuilder.build());
                results.add(new EmbeddedSignatureRecipientResult(
                        recipientId,
                        r.getName(),
                        r.getEmail(),
                        link.getUrl(),
                        "ready",
                        link.getIdentityVerificationMode()
                ));
            } catch (TurboDocxException err) {
                String code = err.getCode();
                if (!"RecipientNotInTurn".equals(code)
                        && !"NotSignersTurn".equals(code)
                        && !"RecipientAlreadySigned".equals(code)) {
                    throw err;
                }
                results.add(new EmbeddedSignatureRecipientResult(
                        recipientId,
                        r.getName(),
                        r.getEmail(),
                        null,
                        "RecipientAlreadySigned".equals(code) ? "completed" : "pending",
                        resolveIdentityVerificationMode(r.getAuth())
                ));
            }
        }

        return new CreateEmbeddedSignatureResponse(sent.getDocumentId(), results);
    }

    /** A request recipient paired with its resolved signing order, so the caller's list is untouched. */
    private static final class OrderedRecipient {
        final EmbeddedSignatureRecipient recipient;
        final int order;

        OrderedRecipient(EmbeddedSignatureRecipient recipient, int order) {
            this.recipient = recipient;
            this.order = order;
        }
    }

    /**
     * Map a recipient's {@code auth} shorthand to a full {@link IdentityVerification}.
     * {@code emailOtp} wins if both are set. Returns null when no auth is requested.
     */
    private IdentityVerification resolveIdentityVerification(EmbeddedRecipientAuth auth) {
        if (auth == null) {
            return null;
        }
        if (auth.isEmailOtp()) {
            return IdentityVerification.otpEmail();
        }
        if (auth.getSms() != null) {
            return IdentityVerification.otpSms();
        }
        return null;
    }

    /** The resolved identity mode string ({@code "otp"} or null) for the degraded-status result. */
    private String resolveIdentityVerificationMode(EmbeddedRecipientAuth auth) {
        IdentityVerification iv = resolveIdentityVerification(auth);
        return iv != null ? iv.getMode() : null;
    }

    /** {@code auth.sms.phoneNumber} wins over the recipient's own {@code phone}. */
    private String resolvePhone(EmbeddedSignatureRecipient r) {
        if (r.getAuth() != null && r.getAuth().getSms() != null && r.getAuth().getSms().getPhoneNumber() != null) {
            return r.getAuth().getSms().getPhoneNumber();
        }
        return r.getPhone();
    }

    /**
     * Expand a recipient's {@code fields} shorthand into full {@link Field} objects — one per
     * provided key, anchored to the given text with placement {@code replace} and the key's default
     * size.
     */
    private List<Field> expandRecipientFields(EmbeddedSignatureRecipient recipient) {
        List<Field> fields = new ArrayList<>();
        EmbeddedRecipientFields shorthand = recipient.getFields();
        if (shorthand == null) {
            return fields;
        }
        for (EmbeddedFieldSpec spec : EMBEDDED_FIELD_SPECS) {
            String anchor = anchorFor(shorthand, spec.key);
            if (anchor == null) {
                continue;
            }
            fields.add(new Field.Builder()
                    .type(spec.type)
                    .recipientEmail(recipient.getEmail())
                    .template(new Field.TemplateAnchor.Builder()
                            .anchor(anchor)
                            .placement("replace")
                            .size(new Field.Size(spec.width, spec.height))
                            .build())
                    .build());
        }
        return fields;
    }

    private String anchorFor(EmbeddedRecipientFields shorthand, String key) {
        switch (key) {
            case "signature":
                return shorthand.getSignature();
            case "date":
                return shorthand.getDate();
            case "initials":
                return shorthand.getInitials();
            case "fullName":
                return shorthand.getFullName();
            default:
                return null;
        }
    }

    private static boolean isPresent(String value) {
        return value != null && !value.isEmpty();
    }

    /**
     * Shut down HTTP clients used by TurboSign.
     * Closes both the main HttpClient and the S3 download client.
     */
    void close() {
        httpClient.close();
        s3Client.dispatcher().executorService().shutdown();
        s3Client.connectionPool().evictAll();
        okhttp3.Cache cache = s3Client.cache();
        if (cache != null) {
            try { cache.close(); } catch (java.io.IOException ignored) { }
        }
    }

    private Map<String, String> buildFormData(
            List<Recipient> recipients,
            List<Field> fields,
            String documentName,
            String documentDescription,
            String senderName,
            String senderEmail,
            List<String> ccEmails,
            SignatureSchedule schedule
    ) {
        Map<String, String> formData = new HashMap<>();
        formData.put("recipients", gson.toJson(recipients));
        formData.put("fields", gson.toJson(fields));

        if (documentName != null) {
            formData.put("documentName", documentName);
        }
        if (documentDescription != null) {
            formData.put("documentDescription", documentDescription);
        }

        // Use request senderEmail/senderName if provided, otherwise fall back to configured values
        String effectiveSenderEmail = (senderEmail != null && !senderEmail.isEmpty()) ? senderEmail : httpClient.getSenderEmail();
        formData.put("senderEmail", effectiveSenderEmail);

        String effectiveSenderName = (senderName != null && !senderName.isEmpty()) ? senderName : httpClient.getSenderName();
        if (effectiveSenderName != null && !effectiveSenderName.isEmpty()) {
            formData.put("senderName", effectiveSenderName);
        }

        if (ccEmails != null && !ccEmails.isEmpty()) {
            // Use JSON for ccEmails instead of comma-join
            formData.put("ccEmails", gson.toJson(ccEmails));
        }

        applyScheduleOverrides(formData, schedule);

        return formData;
    }

    /**
     * Copies per-document reminder/expiration overrides onto an outgoing request body.
     *
     * <p>Durations are JSON-encoded. multipart/form-data has no notion of a nested value, so a
     * {value, unit} object cannot survive the file-upload path as an object. The API decodes a
     * JSON-string duration on both content types, so encoding uniformly keeps one code path for
     * the multipart and JSON branches — the same treatment recipients and fields already get.
     *
     * <p>Scalars are formatted as strings because formData is {@code Map<String, String>}; the
     * API's validation coerces them, exactly as it already does for the JSON-encoded recipients,
     * fields and ccEmails this SDK sends.
     *
     * <p>Null checks, never truthiness: a deliberate {@code false} or {@code 0} must survive.
     */
    private void applyScheduleOverrides(Map<String, String> formData, SignatureSchedule schedule) {
        if (schedule == null) {
            return;
        }

        if (schedule.getRemindersEnabled() != null) {
            formData.put("remindersEnabled", String.valueOf(schedule.getRemindersEnabled()));
        }
        if (schedule.getMaxReminders() != null) {
            formData.put("maxReminders", String.valueOf(schedule.getMaxReminders()));
        }
        if (schedule.getExpirationEnabled() != null) {
            formData.put("expirationEnabled", String.valueOf(schedule.getExpirationEnabled()));
        }

        putDuration(formData, "reminderDelay", schedule.getReminderDelay());
        putDuration(formData, "reminderInterval", schedule.getReminderInterval());
        putDuration(formData, "expireAfter", schedule.getExpireAfter());
        putDuration(formData, "expirationWarning", schedule.getExpirationWarning());
        putDuration(formData, "expirationWarningInterval", schedule.getExpirationWarningInterval());
    }

    private void putDuration(Map<String, String> formData, String key, SignatureSchedule.Duration duration) {
        if (duration != null) {
            formData.put(key, gson.toJson(duration));
        }
    }

    /**
     * Sends a reminder email to a document's outstanding signers.
     *
     * <p>This is a standalone nudge, deliberately decoupled from the automatic reminder schedule:
     * it ignores the configured cadence, works even when reminders are disabled or the per-signer
     * cap is already spent, and does not consume that cap.
     *
     * <p>Only signers at the CURRENT signing order are emailed. A recipient at a later order (or
     * one who has already signed) is reported back as skipped rather than silently dropped.
     *
     * @param documentId   ID of the document
     * @param recipientIds optional subset to remind; pass null to remind every eligible signer.
     *                     When supplied the request is all-or-nothing: if any id is not a
     *                     current-order pending signer the API rejects the whole call.
     * @return one result per recipient considered
     * @throws IOException on transport failure
     */
    public SendReminderResponse sendReminder(String documentId, List<String> recipientIds) throws IOException {
        // Only include the filter when it actually names someone. The API requires at least one
        // id when the key is present, so forwarding an empty list would guarantee a 400 — an
        // empty list is far more likely to mean "no filter" than "remind nobody".
        Map<String, Object> body = new HashMap<>();
        if (recipientIds != null && !recipientIds.isEmpty()) {
            body.put("recipientIds", recipientIds);
        }

        return httpClient.post(
                "/turbosign/documents/" + documentId + "/send-reminder",
                body,
                SendReminderResponse.class
        );
    }

    /** Reminds every eligible signer. @see #sendReminder(String, List) */
    public SendReminderResponse sendReminder(String documentId) throws IOException {
        return sendReminder(documentId, null);
    }
}
