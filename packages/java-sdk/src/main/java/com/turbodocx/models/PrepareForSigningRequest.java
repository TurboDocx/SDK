package com.turbodocx.models;

import java.util.List;

/**
 * Request for preparing a document for signing
 */
public class PrepareForSigningRequest {
    private final byte[] file;
    private final String fileName;
    private final String fileLink;
    private final String deliverableId;
    private final String templateId;
    private final List<Recipient> recipients;
    private final List<Field> fields;
    private final String documentName;
    private final String documentDescription;
    private final String senderName;
    private final String senderEmail;
    private final List<String> ccEmails;

    private PrepareForSigningRequest(Builder builder) {
        this.file = builder.file;
        this.fileName = builder.fileName;
        this.fileLink = builder.fileLink;
        this.deliverableId = builder.deliverableId;
        this.templateId = builder.templateId;
        this.recipients = builder.recipients;
        this.fields = builder.fields;
        this.documentName = builder.documentName;
        this.documentDescription = builder.documentDescription;
        this.senderName = builder.senderName;
        this.senderEmail = builder.senderEmail;
        this.ccEmails = builder.ccEmails;
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

    public String getDeliverableId() {
        return deliverableId;
    }

    public String getTemplateId() {
        return templateId;
    }

    public List<Recipient> getRecipients() {
        return recipients;
    }

    public List<Field> getFields() {
        return fields;
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

    public boolean hasFile() {
        return file != null && file.length > 0;
    }

    public static class Builder {
        private byte[] file;
        private String fileName;
        private String fileLink;
        private String deliverableId;
        private String templateId;
        private List<Recipient> recipients;
        private List<Field> fields;
        private String documentName;
        private String documentDescription;
        private String senderName;
        private String senderEmail;
        private List<String> ccEmails;

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

        public Builder deliverableId(String deliverableId) {
            this.deliverableId = deliverableId;
            return this;
        }

        public Builder templateId(String templateId) {
            this.templateId = templateId;
            return this;
        }

        public Builder recipients(List<Recipient> recipients) {
            this.recipients = recipients;
            return this;
        }

        public Builder fields(List<Field> fields) {
            this.fields = fields;
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

        public PrepareForSigningRequest build() {
            return new PrepareForSigningRequest(this);
        }
    }
}
