# frozen_string_literal: true

require "json"
require "net/http"
require "uri"
require_relative "http_client"

module TurboDocxSdk
  # TurboSign module -- digital signature operations.
  #
  # All methods are class-level (static pattern). Call +configure+ once,
  # then invoke any method directly on the class.
  #
  #   TurboDocxSdk::TurboSign.configure(api_key: "...", org_id: "...", sender_email: "...")
  #   result = TurboDocxSdk::TurboSign.send_signature(...)
  #
  class TurboSign
    class << self
      # Configure the TurboSign module with API credentials.
      #
      # @param api_key [String, nil]
      # @param access_token [String, nil]
      # @param org_id [String, nil]
      # @param sender_email [String, nil] Reply-to email for signature requests (required)
      # @param sender_name [String, nil] Sender display name (optional but recommended)
      # @param base_url [String, nil]
      # @raise [AuthenticationError] if no API key or access token is provided
      # @raise [ValidationError] if senderEmail is missing
      def configure(api_key: nil, access_token: nil, org_id: nil,
                    sender_email: nil, sender_name: nil, base_url: nil,
                    client_context: nil)
        @client = HttpClient.new(
          api_key: api_key,
          access_token: access_token,
          org_id: org_id,
          sender_email: sender_email,
          sender_name: sender_name,
          base_url: base_url,
          client_context: client_context
        )
      end

      # Create a signature review link (upload document, do NOT send emails).
      #
      # @param request [Hash] :file or :fileLink or :deliverableId or :templateId,
      #   :recipients (Array), :fields (Array), :documentName, :documentDescription,
      #   :senderEmail, :senderName, :ccEmails
      # @return [Hash] document info with review URL
      # @raise [ValidationError] on invalid request data
      # @raise [AuthenticationError] on invalid credentials
      # @raise [NetworkError] on connection failure
      def create_signature_review_link(request)
        client = get_client
        sender = client.sender_config
        form_data = build_signature_form_data(request, sender)

        if request[:file] || request["file"]
          file = request[:file] || request["file"]
          client.upload_file(
            "/turbosign/single/prepare-for-review",
            file,
            field_name: "file",
            additional_data: form_data
          )
        else
          form_data["fileLink"] = request[:fileLink] || request["fileLink"] if request[:fileLink] || request["fileLink"]
          form_data["deliverableId"] = request[:deliverableId] || request["deliverableId"] if request[:deliverableId] || request["deliverableId"]
          form_data["templateId"] = request[:templateId] || request["templateId"] if request[:templateId] || request["templateId"]
          client.post("/turbosign/single/prepare-for-review", form_data)
        end
      end

      # Send signature request (upload document AND send emails immediately).
      #
      # @param request [Hash] same as create_signature_review_link
      # @return [Hash] document info with confirmation
      # @raise [ValidationError] on invalid request data
      # @raise [AuthenticationError] on invalid credentials
      # @raise [NetworkError] on connection failure
      def send_signature(request)
        client = get_client
        sender = client.sender_config
        form_data = build_signature_form_data(request, sender)

        if request[:file] || request["file"]
          file = request[:file] || request["file"]
          client.upload_file(
            "/turbosign/single/prepare-for-signing",
            file,
            field_name: "file",
            additional_data: form_data
          )
        else
          form_data["fileLink"] = request[:fileLink] || request["fileLink"] if request[:fileLink] || request["fileLink"]
          form_data["deliverableId"] = request[:deliverableId] || request["deliverableId"] if request[:deliverableId] || request["deliverableId"]
          form_data["templateId"] = request[:templateId] || request["templateId"] if request[:templateId] || request["templateId"]
          client.post("/turbosign/single/prepare-for-signing", form_data)
        end
      end

      # Void (cancel) a document.
      #
      # @param document_id [String]
      # @param reason [String]
      # @return [Hash] voided document details
      # @raise [NotFoundError] if the document does not exist
      # @raise [AuthenticationError] on invalid credentials
      # @raise [NetworkError] on connection failure
      def void_document(document_id, reason)
        client = get_client
        client.post("/turbosign/documents/#{document_id}/void", { "reason" => reason })
      end

      # Resend signature request emails to specific recipients.
      #
      # @param document_id [String]
      # @param recipient_ids [Array<String>]
      # @return [Hash] resend confirmation
      # @raise [NotFoundError] if the document does not exist
      # @raise [AuthenticationError] on invalid credentials
      # @raise [NetworkError] on connection failure
      def resend_email(document_id, recipient_ids)
        client = get_client
        client.post("/turbosign/documents/#{document_id}/resend-email", { "recipientIds" => recipient_ids })
      end

      # Send a reminder email to a document's outstanding signers.
      #
      # This is a standalone nudge, deliberately decoupled from the automatic reminder schedule:
      # it ignores the configured cadence, works even when reminders are disabled or the
      # per-signer cap is already spent, and does not consume that cap.
      #
      # Only signers at the CURRENT signing order are emailed. A recipient at a later order (or
      # one who has already signed) is reported back as skipped rather than silently dropped, so
      # the caller can tell that nobody was emailed.
      #
      # @param document_id [String]
      # @param recipient_ids [Array<String>, nil] optional subset to remind. Omit to remind every
      #   eligible signer. When supplied the request is all-or-nothing: if any id is not a
      #   current-order pending signer the API rejects the whole call and sends nothing.
      # @return [Hash] :results, one entry per recipient considered, each with recipientId and
      #   status (e.g. "sent", "skipped_wrong_order")
      # @raise [NotFoundError] if the document does not exist
      # @raise [AuthenticationError] on invalid credentials
      # @raise [NetworkError] on connection failure
      def send_reminder(document_id, recipient_ids = nil)
        client = get_client

        # Only include the filter when it actually names someone. The API requires at least one id
        # when the key is present, so forwarding an empty array would guarantee a 400 -- an empty
        # list is far more likely to mean "no filter" than "remind nobody".
        body = {}
        body["recipientIds"] = recipient_ids if recipient_ids && !recipient_ids.empty?

        client.post("/turbosign/documents/#{document_id}/send-reminder", body)
      end

      # Get the audit trail for a document.
      #
      # @param document_id [String]
      # @return [Hash] audit trail with entries
      # @raise [NotFoundError] if the document does not exist
      # @raise [AuthenticationError] on invalid credentials
      # @raise [NetworkError] on connection failure
      def get_audit_trail(document_id)
        client = get_client
        client.get("/turbosign/documents/#{document_id}/audit-trail")
      end

      # Download the signed document.
      #
      # @param document_id [String]
      # @return [String] raw PDF bytes
      # @raise [NotFoundError] if the document does not exist
      # @raise [TurboDocxError] if the file download from storage fails
      # @raise [AuthenticationError] on invalid credentials
      # @raise [NetworkError] on connection failure
      def download(document_id)
        client = get_client
        response = client.get("/turbosign/documents/#{document_id}/download")
        download_url = response["downloadUrl"]

        uri = URI.parse(download_url)
        http = Net::HTTP.new(uri.host, uri.port)
        http.use_ssl = uri.scheme == "https"
        file_response = http.request(Net::HTTP::Get.new(uri))

        unless file_response.is_a?(Net::HTTPSuccess)
          raise TurboDocxError.new("Failed to download file: #{file_response.message}", status_code: file_response.code.to_i)
        end

        file_response.body
      end

      # Get the status of a document.
      #
      # @param document_id [String]
      # @return [Hash] document status
      # @raise [NotFoundError] if the document does not exist
      # @raise [AuthenticationError] on invalid credentials
      # @raise [NetworkError] on connection failure
      def get_status(document_id)
        client = get_client
        client.get("/turbosign/documents/#{document_id}/status")
      end

      private

      def get_client
        @client ||= HttpClient.new
      end

      def build_signature_form_data(request, sender)
        recipients = request[:recipients] || request["recipients"]
        fields = request[:fields] || request["fields"]

        form_data = {
          "recipients" => JSON.generate(recipients),
          "fields" => JSON.generate(fields)
        }

        doc_name = request[:documentName] || request["documentName"]
        doc_desc = request[:documentDescription] || request["documentDescription"]
        form_data["documentName"] = doc_name if doc_name
        form_data["documentDescription"] = doc_desc if doc_desc

        req_sender_email = request[:senderEmail] || request["senderEmail"]
        req_sender_name = request[:senderName] || request["senderName"]
        form_data["senderEmail"] = req_sender_email || sender["senderEmail"]
        cfg_name = req_sender_name || sender["senderName"]
        form_data["senderName"] = cfg_name if cfg_name

        cc = request[:ccEmails] || request["ccEmails"]
        if cc
          cc_array = cc.is_a?(Array) ? cc : [cc]
          form_data["ccEmails"] = JSON.generate(cc_array)
        end

        apply_schedule_overrides(form_data, request)

        form_data
      end

      # Copy per-document reminder/expiration overrides onto an outgoing request body.
      #
      # Durations are JSON-encoded. multipart/form-data has no notion of a nested value, so a
      # { value:, unit: } hash cannot survive the file-upload path as an object. The API decodes a
      # JSON-string duration on both content types, so encoding uniformly keeps one code path for
      # the multipart and JSON branches -- the same treatment recipients and fields already get.
      #
      # Presence is tested with nil?, never truthiness: false (feature off) and 0 (no reminders /
      # never warn) are meaningful values, and Ruby treats 0 as truthy but false as falsey, so a
      # truthiness check would silently drop an explicit "off" and fall back to the org default.
      #
      # Request-body keys stay camelCase -- the API is not snake_case-aware.
      def apply_schedule_overrides(form_data, request)
        scalar_keys = %w[remindersEnabled maxReminders expirationEnabled]
        scalar_keys.each do |key|
          value = request[key.to_sym]
          value = request[key] if value.nil?
          form_data[key] = value unless value.nil?
        end

        duration_keys = %w[reminderDelay reminderInterval expireAfter expirationWarning
                           expirationWarningInterval]
        duration_keys.each do |key|
          duration = request[key.to_sym]
          duration = request[key] if duration.nil?
          form_data[key] = JSON.generate(duration) unless duration.nil?
        end
      end
    end
  end
end
