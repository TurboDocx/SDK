package com.turbodocx.models;

import java.util.List;

/**
 * Response from {@code TurboSign.createEmbeddedSignature}: the document and a per-recipient
 * embed URL, in signing order.
 */
public class CreateEmbeddedSignatureResponse {
    private final String documentId;
    private final List<EmbeddedSignatureRecipientResult> recipients;

    public CreateEmbeddedSignatureResponse(String documentId, List<EmbeddedSignatureRecipientResult> recipients) {
        this.documentId = documentId;
        this.recipients = recipients;
    }

    public String getDocumentId() {
        return documentId;
    }

    public List<EmbeddedSignatureRecipientResult> getRecipients() {
        return recipients;
    }
}
