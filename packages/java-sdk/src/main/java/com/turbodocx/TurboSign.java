package com.turbodocx;

import com.google.gson.Gson;
import com.turbodocx.models.*;

import java.io.IOException;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * TurboSign client for digital signature operations
 * with 100% parity with n8n-nodes-turbodocx
 */
public class TurboSign {
    private final HttpClient httpClient;
    private final Gson gson;

    public TurboSign(HttpClient httpClient) {
        this.httpClient = httpClient;
        this.gson = new Gson();
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

        DataWrapper<PrepareForReviewResponse> response;

        if (request.hasFile()) {
            String fileName = request.getFileName() != null ? request.getFileName() : "document.pdf";
            response = httpClient.uploadFile(
                    "/turbosign/single/prepare-for-review",
                    request.getFile(),
                    fileName,
                    formData,
                    (Class<DataWrapper<PrepareForReviewResponse>>) (Class<?>) DataWrapper.class
            );
            // Re-parse with correct type
            String json = gson.toJson(response);
            response = gson.fromJson(json, PrepareForReviewDataWrapper.class);
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

            response = httpClient.post(
                    "/turbosign/single/prepare-for-review",
                    formData,
                    PrepareForReviewDataWrapper.class
            );
        }

        return response.getData();
    }

    /**
     * Prepare document for signing and send emails in a single call.
     * This is the n8n-equivalent "Prepare for Signing" operation.
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

        DataWrapper<PrepareForSigningResponse> response;

        if (request.hasFile()) {
            String fileName = request.getFileName() != null ? request.getFileName() : "document.pdf";
            response = httpClient.uploadFile(
                    "/turbosign/single/prepare-for-signing",
                    request.getFile(),
                    fileName,
                    formData,
                    (Class<DataWrapper<PrepareForSigningResponse>>) (Class<?>) DataWrapper.class
            );
            // Re-parse with correct type
            String json = gson.toJson(response);
            response = gson.fromJson(json, PrepareForSigningDataWrapper.class);
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

            response = httpClient.post(
                    "/turbosign/single/prepare-for-signing",
                    formData,
                    PrepareForSigningDataWrapper.class
            );
        }

        return response.getData();
    }

    /**
     * Get the status of a document
     */
    public DocumentStatusResponse getStatus(String documentId) throws IOException {
        DocumentStatusDataWrapper response = httpClient.get(
                "/turbosign/documents/" + documentId + "/status",
                DocumentStatusDataWrapper.class
        );
        return response.getData();
    }

    /**
     * Download the signed document
     */
    public byte[] download(String documentId) throws IOException {
        return httpClient.getRaw("/turbosign/documents/" + documentId + "/download");
    }

    /**
     * Void a document (cancel signature request)
     */
    public VoidDocumentResponse voidDocument(String documentId, String reason) throws IOException {
        Map<String, String> body = new HashMap<>();
        body.put("reason", reason);

        VoidDocumentDataWrapper response = httpClient.post(
                "/turbosign/documents/" + documentId + "/void",
                body,
                VoidDocumentDataWrapper.class
        );
        return response.getData();
    }

    /**
     * Resend signature request email to recipients
     */
    public ResendEmailResponse resendEmail(String documentId, List<String> recipientIds) throws IOException {
        Map<String, List<String>> body = new HashMap<>();
        body.put("recipientIds", recipientIds);

        ResendEmailDataWrapper response = httpClient.post(
                "/turbosign/documents/" + documentId + "/resend-email",
                body,
                ResendEmailDataWrapper.class
        );
        return response.getData();
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
            formData.put("ccEmails", String.join(",", ccEmails));
        }

        return formData;
    }

    // Data wrapper classes for JSON deserialization
    private static class DataWrapper<T> {
        private T data;
        public T getData() { return data; }
    }

    private static class PrepareForReviewDataWrapper extends DataWrapper<PrepareForReviewResponse> {}
    private static class PrepareForSigningDataWrapper extends DataWrapper<PrepareForSigningResponse> {}
    private static class DocumentStatusDataWrapper extends DataWrapper<DocumentStatusResponse> {}
    private static class VoidDocumentDataWrapper extends DataWrapper<VoidDocumentResponse> {}
    private static class ResendEmailDataWrapper extends DataWrapper<ResendEmailResponse> {}
}
