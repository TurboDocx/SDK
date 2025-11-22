# frozen_string_literal: true

require "json"

module TurboDocx
  # TurboSign client for digital signature operations
  # with 100% parity with n8n-nodes-turbodocx
  class TurboSign
    def initialize(http_client)
      @http = http_client
    end

    # Prepare document for review without sending emails.
    # Use this to preview field placement before sending.
    def prepare_for_review(
      file: nil,
      file_name: nil,
      file_link: nil,
      deliverable_id: nil,
      template_id: nil,
      recipients:,
      fields:,
      document_name: nil,
      document_description: nil,
      sender_name: nil,
      sender_email: nil,
      cc_emails: nil
    )
      form_data = build_form_data(
        recipients: recipients,
        fields: fields,
        document_name: document_name,
        document_description: document_description,
        sender_name: sender_name,
        sender_email: sender_email,
        cc_emails: cc_emails
      )

      response = if file
                   @http.upload_file(
                     "/turbosign/single/prepare-for-review",
                     file,
                     file_name || "document.pdf",
                     form_data
                   )
                 else
                   form_data[:fileLink] = file_link if file_link
                   form_data[:deliverableId] = deliverable_id if deliverable_id
                   form_data[:templateId] = template_id if template_id
                   @http.post("/turbosign/single/prepare-for-review", form_data)
                 end

      symbolize_keys(response["data"])
    end

    # Prepare document for signing and send emails in a single call.
    # This is the n8n-equivalent "Prepare for Signing" operation.
    def prepare_for_signing_single(
      file: nil,
      file_name: nil,
      file_link: nil,
      deliverable_id: nil,
      template_id: nil,
      recipients:,
      fields:,
      document_name: nil,
      document_description: nil,
      sender_name: nil,
      sender_email: nil,
      cc_emails: nil
    )
      form_data = build_form_data(
        recipients: recipients,
        fields: fields,
        document_name: document_name,
        document_description: document_description,
        sender_name: sender_name,
        sender_email: sender_email,
        cc_emails: cc_emails
      )

      response = if file
                   @http.upload_file(
                     "/turbosign/single/prepare-for-signing",
                     file,
                     file_name || "document.pdf",
                     form_data
                   )
                 else
                   form_data[:fileLink] = file_link if file_link
                   form_data[:deliverableId] = deliverable_id if deliverable_id
                   form_data[:templateId] = template_id if template_id
                   @http.post("/turbosign/single/prepare-for-signing", form_data)
                 end

      symbolize_keys(response["data"])
    end

    # Get the status of a document
    def get_status(document_id)
      response = @http.get("/turbosign/documents/#{document_id}/status")
      symbolize_keys(response["data"])
    end

    # Download the signed document
    def download(document_id)
      @http.get_raw("/turbosign/documents/#{document_id}/download")
    end

    # Void a document (cancel signature request)
    def void_document(document_id, reason)
      response = @http.post(
        "/turbosign/documents/#{document_id}/void",
        { reason: reason }
      )
      symbolize_keys(response["data"])
    end

    # Resend signature request email to recipients
    def resend_email(document_id, recipient_ids)
      response = @http.post(
        "/turbosign/documents/#{document_id}/resend-email",
        { recipientIds: recipient_ids }
      )
      symbolize_keys(response["data"])
    end

    private

    def build_form_data(
      recipients:,
      fields:,
      document_name:,
      document_description:,
      sender_name:,
      sender_email:,
      cc_emails:
    )
      form_data = {
        recipients: recipients.to_json,
        fields: fields.to_json
      }

      form_data[:documentName] = document_name if document_name
      form_data[:documentDescription] = document_description if document_description
      form_data[:senderName] = sender_name if sender_name
      form_data[:senderEmail] = sender_email if sender_email
      form_data[:ccEmails] = cc_emails.join(",") if cc_emails&.any?

      form_data
    end

    def symbolize_keys(hash)
      return hash unless hash.is_a?(Hash)

      hash.transform_keys(&:to_sym).transform_values do |v|
        case v
        when Hash then symbolize_keys(v)
        when Array then v.map { |item| item.is_a?(Hash) ? symbolize_keys(item) : item }
        else v
        end
      end
    end
  end
end
