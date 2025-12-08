package com.turbodocx;

import com.google.gson.Gson;
import com.turbodocx.models.*;
import okhttp3.OkHttpClient;
import okhttp3.Request;
import okhttp3.Response;

import java.io.IOException;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * TurboSign client for digital signature operations
 * with 100% parity with the JS SDK
 */
public class TurboSign {
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
    public PrepareForReviewResponse prepareForReview(PrepareForReviewRequest request) throws IOException {
        Map<String, String> formData = buildFormData(
                request.getRecipients(),
                request.getFields(),
                request.getDocumentName(),
                request.getDocumentDescription(),
                request.getSenderName(),
                request.getSenderEmail(),
                request.getCcEmails()
        );

        if (request.hasFile()) {
            String fileName = request.getFileName() != null ? request.getFileName() : "document.pdf";
            return httpClient.uploadFile(
                    "/turbosign/single/prepare-for-review",
                    request.getFile(),
                    fileName,
                    formData,
                    PrepareForReviewResponse.class
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
                    PrepareForReviewResponse.class
            );
        }
    }

    /**
     * Prepare document for signing and send emails in a single call.
     * This is the equivalent "Prepare for Signing" operation.
     */
    public PrepareForSigningResponse prepareForSigningSingle(PrepareForSigningRequest request) throws IOException {
        Map<String, String> formData = buildFormData(
                request.getRecipients(),
                request.getFields(),
                request.getDocumentName(),
                request.getDocumentDescription(),
                request.getSenderName(),
                request.getSenderEmail(),
                request.getCcEmails()
        );

        if (request.hasFile()) {
            String fileName = request.getFileName() != null ? request.getFileName() : "document.pdf";
            return httpClient.uploadFile(
                    "/turbosign/single/prepare-for-signing",
                    request.getFile(),
                    fileName,
                    formData,
                    PrepareForSigningResponse.class
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
                    PrepareForSigningResponse.class
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

    private Map<String, String> buildFormData(
            List<Recipient> recipients,
            List<Field> fields,
            String documentName,
            String documentDescription,
            String senderName,
            String senderEmail,
            List<String> ccEmails
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
        if (senderName != null) {
            formData.put("senderName", senderName);
        }
        if (senderEmail != null) {
            formData.put("senderEmail", senderEmail);
        }
        if (ccEmails != null && !ccEmails.isEmpty()) {
            // Use JSON for ccEmails instead of comma-join
            formData.put("ccEmails", gson.toJson(ccEmails));
        }

        return formData;
    }
}
