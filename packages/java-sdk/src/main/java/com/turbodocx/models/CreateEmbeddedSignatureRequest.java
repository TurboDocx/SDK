package com.turbodocx.models;

import java.util.List;

/**
 * Request for {@code TurboSign.createEmbeddedSignature} — create a signature request and mint a
 * per-recipient embed URL in one call.
 */
public class CreateEmbeddedSignatureRequest {
    private final byte[] file;
    private final String fileName;
    private final String fileLink;
    private final String templateId;
    private final String deliverableId;
    private final String documentName;
    private final String documentDescription;
    private final String senderName;
    private final String senderEmail;
    private final List<String> ccEmails;
    private final List<EmbeddedSignatureRecipient> recipients;
    /** Optional full field control; overrides the per-recipient {@code fields} shorthand when non-null. */
    private final List<Field> fields;
    /**
     * Embedded default: do not email the recipients (you own the UX). Null defaults to
     * {@code false} for this flow.
     */
    private final Boolean sendEmail;
    /** Optional completion fallback. Must be an https URL. Passed to each embed URL. */
    private final String returnUrl;

    private CreateEmbeddedSignatureRequest(Builder builder) {
        this.file = builder.file;
        this.fileName = builder.fileName;
        this.fileLink = builder.fileLink;
        this.templateId = builder.templateId;
        this.deliverableId = builder.deliverableId;
        this.documentName = builder.documentName;
        this.documentDescription = builder.documentDescription;
        this.senderName = builder.senderName;
        this.senderEmail = builder.senderEmail;
        this.ccEmails = builder.ccEmails;
        this.recipients = builder.recipients;
        this.fields = builder.fields;
        this.sendEmail = builder.sendEmail;
        this.returnUrl = builder.returnUrl;
    }

    public byte[] getFile() {
        return file;
    }

    public String getFileName() {
        return fileName;
    }

    public String getFileLink() {
        return fileLink;
    }

    public String getTemplateId() {
        return templateId;
    }

    public String getDeliverableId() {
        return deliverableId;
    }

    public String getDocumentName() {
        return documentName;
    }

    public String getDocumentDescription() {
        return documentDescription;
    }

    public String getSenderName() {
        return senderName;
    }

    public String getSenderEmail() {
        return senderEmail;
    }

    public List<String> getCcEmails() {
        return ccEmails;
    }

    public List<EmbeddedSignatureRecipient> getRecipients() {
        return recipients;
    }

    public List<Field> getFields() {
        return fields;
    }

    public Boolean getSendEmail() {
        return sendEmail;
    }

    public String getReturnUrl() {
        return returnUrl;
    }

    public boolean hasFile() {
        return file != null && file.length > 0;
    }

    public static class Builder {
        private byte[] file;
        private String fileName;
        private String fileLink;
        private String templateId;
        private String deliverableId;
        private String documentName;
        private String documentDescription;
        private String senderName;
        private String senderEmail;
        private List<String> ccEmails;
        private List<EmbeddedSignatureRecipient> recipients;
        private List<Field> fields;
        private Boolean sendEmail;
        private String returnUrl;

        public Builder file(byte[] file) {
            this.file = file;
            return this;
        }

        public Builder fileName(String fileName) {
            this.fileName = fileName;
            return this;
        }

        public Builder fileLink(String fileLink) {
            this.fileLink = fileLink;
            return this;
        }

        public Builder templateId(String templateId) {
            this.templateId = templateId;
            return this;
        }

        public Builder deliverableId(String deliverableId) {
            this.deliverableId = deliverableId;
            return this;
        }

        public Builder documentName(String documentName) {
            this.documentName = documentName;
            return this;
        }

        public Builder documentDescription(String documentDescription) {
            this.documentDescription = documentDescription;
            return this;
        }

        public Builder senderName(String senderName) {
            this.senderName = senderName;
            return this;
        }

        public Builder senderEmail(String senderEmail) {
            this.senderEmail = senderEmail;
            return this;
        }

        public Builder ccEmails(List<String> ccEmails) {
            this.ccEmails = ccEmails;
            return this;
        }

        public Builder recipients(List<EmbeddedSignatureRecipient> recipients) {
            this.recipients = recipients;
            return this;
        }

        /** Optional full field control; overrides the per-recipient shorthand when supplied. */
        public Builder fields(List<Field> fields) {
            this.fields = fields;
            return this;
        }

        /** Suppress recipient emails (embedded flow default). Omit to default to {@code false}. */
        public Builder sendEmail(Boolean sendEmail) {
            this.sendEmail = sendEmail;
            return this;
        }

        /** Completion fallback URL, forwarded to each embed URL (https only). */
        public Builder returnUrl(String returnUrl) {
            this.returnUrl = returnUrl;
            return this;
        }

        public CreateEmbeddedSignatureRequest build() {
            return new CreateEmbeddedSignatureRequest(this);
        }
    }
}
