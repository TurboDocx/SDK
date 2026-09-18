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
    # Shorthand field key => the concrete field type it emits plus its default size.
    #
    # Note +initials+ maps to the +"initial"+ field type -- that is the literal in the
    # signature field-type set (there is no +"initials"+).
    EMBEDDED_FIELD_SPECS = {
      "signature" => { type: "signature", size: { "width" => 100, "height" => 30 } },
      "date" => { type: "date", size: { "width" => 75, "height" => 30 } },
      "initials" => { type: "initial", size: { "width" => 50, "height" => 30 } },
      "fullName" => { type: "full_name", size: { "width" => 150, "height" => 30 } }
    }.freeze

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

      # Mint a single-use embedded signing URL for one recipient -- request it the moment the signer
      # is ready (never store it). The counterpart of DocuSign's createRecipientView / BoldSign's
      # GetEmbeddedSignLink. Open the returned +url+ in a new tab, redirect to it, or embed it.
      #
      # Provide EXACTLY ONE of +recipient_id+ / +external_id+ (an empty string counts as absent);
      # supplying both or neither raises before any HTTP call. +identity_assertion+ is only for
      # external_idv recipients; +return_url+, when given, must be an https URL.
      #
      # The endpoint replies { data: { results } }. The HTTP client strips the outer +data+, so this
      # method peels the remaining +results+ envelope and returns the flat response -- never the
      # +{ "results" => ... }+ wrapper.
      #
      # @param document_id [String] the document the recipient belongs to
      # @param recipient_id [String, nil] select the recipient by TurboDocx recipient id
      # @param external_id [String, nil] ...or by the externalId set when the recipient was created
      # @param identity_assertion [Hash, nil] assertion from your own provider, for external_idv only
      #   (keys: provider, verificationId, verifiedAt, subjectEmail)
      # @param return_url [String, nil] where TurboSign returns the signer after completion (https only)
      # @return [Hash] with "url", "expiresAt", "recipientId", "externalId",
      #   "identityVerificationMode" and "pendingChecks"
      # @raise [ValidationError] if not exactly one selector is given, or return_url is not https
      # @raise [NotFoundError] if the document or recipient does not exist
      # @raise [AuthenticationError] on invalid credentials
      # @raise [NetworkError] on connection failure
      def create_signing_url(document_id, recipient_id: nil, external_id: nil,
                             identity_assertion: nil, return_url: nil)
        # Fail fast with actionable messages; the server still enforces everything.
        selector_count = [recipient_id, external_id].count { |v| !v.nil? && v != "" }
        unless selector_count == 1
          raise ValidationError.new(
            "Provide exactly one of recipientId or externalId to createSigningUrl.",
            code: "RecipientSelectorInvalid"
          )
        end
        # An empty-string return_url is treated as ABSENT (not sent, no error), matching js
        # (`if (request.returnUrl && ...)` -- "" is falsy there), Go and Python. Guard so the https
        # check only runs when return_url is a non-empty string.
        if return_url && !return_url.empty? && !return_url.match?(%r{\Ahttps://}i)
          raise ValidationError.new("returnUrl must be an https URL.", code: "InvalidReturnUrl")
        end

        client = get_client
        body = {}
        body["recipientId"] = recipient_id unless recipient_id.nil? || recipient_id == ""
        body["externalId"] = external_id unless external_id.nil? || external_id == ""
        body["identityAssertion"] = identity_assertion unless identity_assertion.nil?
        body["returnUrl"] = return_url unless return_url.nil? || return_url == ""

        # The client already stripped the outer { data }; peel the inner { results } envelope here
        # (same convention as the quote/deliverable modules).
        response = client.post("/turbosign/documents/#{document_id}/signing-url", body)
        # `|| response` keeps it correct if the API ever returns a flat body (no `results`
        # envelope), so it degrades gracefully rather than returning nil. PHP/Go/Java guard this too.
        response["results"] || response
      end

      # Read the org's embedded-signing settings: the set-once, org-wide gates (embedded signing
      # enabled, external identity verification allowed, override allowed), the default OTP channel,
      # and the allowed iframe embedding origins. Use it to see what is permitted before you request
      # signing URLs. Read-only.
      #
      # Same { data: { results } } envelope as +create_signing_url+.
      #
      # @return [Hash] with "enabled", "allowExternalIdv", "allowIdentityOverride",
      #   "defaultChannel" and "allowedFrameAncestors"
      # @raise [AuthenticationError] on invalid credentials
      # @raise [NetworkError] on connection failure
      def get_embedded_signing_settings
        client = get_client
        response = client.get("/turbosign/embedded-signing-settings")
        response["results"]
      end

      # Create a signature request AND mint a per-recipient embedded signing URL in ONE call -- the
      # embedded-signing counterpart of DocuSeal's create-with-embed and Dropbox Sign's embedded flow.
      # Scales to multiple signers (e.g. in-person, same-device sequential signing): you get one embed
      # URL per recipient, returned IN SIGNING ORDER.
      #
      # This is a thin WRAPPER over +send_signature+ + +create_signing_url+ -- no new endpoint. It
      # maps the ergonomic request (per-recipient +auth+ + +fields+ shorthand) onto those calls, then
      # assembles a per-recipient result carrying the embed URL and the resolved identity mode.
      #
      # Mapping:
      # - +auth[:emailOtp]+ => identityVerification { mode:"otp", channel:"email" };
      #   +auth[:sms][:phoneNumber]+ => { mode:"otp", channel:"sms" } and sets the recipient's phone.
      # - +fields+ shorthand => full field objects (placement:"replace" + a default size). Provide the
      #   top-level +fields+ to override the shorthand with full field control.
      # - +signingOrder+ defaults to each recipient's array index + 1.
      # - +sendEmail+ defaults to false (you own the UX; forwarded to the backend).
      # - +returnUrl+ is passed through to each embed URL only when provided (https, enforced by
      #   +create_signing_url+).
      #
      # Turn-aware: with a real (sequential) signing order the backend only mints a URL for the signer
      # whose turn it is. Rather than throw the whole call away, each result carries a "status":
      # - "ready"     -- it's their turn; "embedUrl" is set, frame it now.
      # - "pending"   -- an earlier signer hasn't finished; "embedUrl" is nil. Re-mint later with
      #                  +create_signing_url+ once earlier signers complete.
      # - "completed" -- they've already signed; "embedUrl" is nil.
      # A genuine error (anything other than not-in-turn / already-signed) still raises.
      #
      # @param request [Hash] :recipients (Array; each :name, :email, optional :phone, :signingOrder,
      #   :auth, :fields), and any of :file/:fileName/:fileLink/:templateId/:deliverableId,
      #   :documentName, :documentDescription, :senderName, :senderEmail, :ccEmails, :fields (full
      #   field override), :sendEmail, :returnUrl
      # @return [Hash] with "documentId" and "recipients" (each "recipientId", "name", "email",
      #   "embedUrl", "status", "identityVerificationMode")
      # @raise [ValidationError] if send_signature returns no recipient matching a requested email
      # @raise [AuthenticationError] on invalid credentials
      # @raise [NetworkError] on connection failure
      def create_embedded_signature(request)
        recipients = request[:recipients] || request["recipients"] || []

        # 1. Map the ergonomic recipients onto full recipient objects (identity + phone + order).
        mapped_recipients = recipients.each_with_index.map do |r, index|
          auth = req_val(r, :auth)
          identity_verification = resolve_identity_verification(auth)
          phone = dig_val(auth, :sms, :phoneNumber)
          phone = req_val(r, :phone) if phone.nil?

          recipient = {
            "name" => req_val(r, :name),
            "email" => req_val(r, :email),
            "signingOrder" => req_val(r, :signingOrder) || index + 1
          }
          recipient["phone"] = phone unless phone.nil?
          recipient["identityVerification"] = identity_verification unless identity_verification.nil?
          recipient
        end

        # Client-side fail-fast: an SMS OTP recipient with no resolved phone. Mirrors the JS
        # validateRecipientsIdentity call (and Go/PHP), catching the common mistake with an
        # actionable message BEFORE the send rather than as a raw HTTP 400. The other identity
        # modes are unreachable from this shorthand (auth only ever produces email/sms OTP), so
        # only this check is live; the server remains the source of truth.
        mapped_recipients.each do |recipient|
          iv = recipient["identityVerification"]
          next if iv.nil?
          next unless iv["mode"] == "otp" && iv["channel"] == "sms"

          phone = recipient["phone"]
          next unless phone.nil? || phone == ""

          raise ValidationError.new(
            "Recipient \"#{recipient["email"]}\" uses SMS OTP but has no phone (E.164).",
            code: "PhoneRequiredForSmsOtp"
          )
        end

        # Full `fields` (when provided) win verbatim; otherwise expand each recipient's shorthand.
        fields = req_val(request, :fields)
        fields ||= recipients.flat_map { |r| expand_recipient_fields(r) }

        send_request = {
          "recipients" => mapped_recipients,
          "fields" => fields,
          # Embedded flow default: suppress recipient emails (the host owns the UX). Explicit
          # request value wins; nil? test keeps a caller's false from being replaced by the default.
          "sendEmail" => req_val(request, :sendEmail).nil? ? false : req_val(request, :sendEmail)
        }
        %i[file fileName fileLink templateId deliverableId documentName documentDescription
           senderName senderEmail ccEmails].each do |key|
          value = req_val(request, key)
          send_request[key.to_s] = value unless value.nil?
        end

        sent = send_signature(send_request)

        # Match the backend's recipients back to the request by email so we can carry `name` and know
        # the resolved identity mode. The response's `recipients` is optional, so guard it.
        sent_recipients = sent["recipients"] || []
        recipient_id_by_email = {}
        sent_recipients.each { |sr| recipient_id_by_email[sr["email"]] = sr["id"] }

        document_id = sent["documentId"]
        return_url = req_val(request, :returnUrl)

        # 2 + 3. Mint one embed URL per recipient and assemble the result IN SIGNING ORDER. The index
        # is part of the sort key because Ruby's sort_by is not stable: two recipients with a
        # colliding signingOrder must keep their original relative order (as JS's stable sort does).
        ordered = recipients.each_with_index
                            .map { |r, index| [req_val(r, :signingOrder) || index + 1, index, r] }
                            .sort_by { |order, index, _r| [order, index] }

        result_recipients = ordered.map do |_order, _index, r|
          email = req_val(r, :email)
          recipient_id = recipient_id_by_email[email]
          if recipient_id.nil?
            raise ValidationError.new(
              "sendSignature did not return a recipient matching \"#{email}\"; cannot mint an embed URL.",
              code: "EmbeddedRecipientNotReturned"
            )
          end
          mint_embedded_recipient(r, recipient_id, document_id, return_url)
        end

        { "documentId" => document_id, "recipients" => result_recipients }
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

      # Get every recipient on a document with their signing status.
      #
      # Answers "who has signed and who are we still waiting on" in one call, and
      # reports who sent the document.
      #
      # "status" is the raw database value and is only ever "pending", "viewed" or
      # "completed". "effectiveStatus" layers the document's terminal state on top and is
      # what you should display: a signer on a voided or expired document reads
      # "voided"/"expired" there while "status" still says "pending". A completed
      # signature is never revoked.
      #
      # Each recipient's "delivery" is their email history — CC notifications are
      # excluded, since a CC address is not a signer.
      #
      # Two delivery fields are easy to misread:
      #   * "reminderCount" counts AUTOMATIC (scheduled) reminders only — the counter
      #     maxReminders caps. A manual "remind now" does not increment it (it must not
      #     consume the cap budget), though it does land in "totalSent". So it can read 0
      #     while reminder emails have genuinely been sent.
      #   * "lastRemindedAt" is when the reminder CADENCE CLOCK was last reset, not
      #     necessarily when a reminder was sent. The initial signature-request send, each
      #     scheduled reminder, each manual "remind now" and each expiry warning all stamp
      #     it — so a freshly-sent document normally reads a non-nil "lastRemindedAt"
      #     alongside "reminderCount" of 0.
      #
      # "warningCount" / "lastWarningAt" are touched only by an expiry warning.
      #
      # @param document_id [String]
      # @return [Hash] with "document" (id, name, status, createdOn, sentOn, expiresAt,
      #   sentBy), "recipients" (each with "status", "effectiveStatus", "signedOn",
      #   "signingOrder" and "delivery" = firstSentOn/lastSentOn/totalSent/
      #   reminderCount/lastRemindedAt/warningCount/lastWarningAt) and "summary"
      #   ("total", "pending", "viewed", "completed", "voided", "expired", "waitingOn")
      # @raise [NotFoundError] if the document does not exist
      # @raise [AuthenticationError] on invalid credentials
      # @raise [NetworkError] on connection failure
      def get_recipients(document_id)
        client = get_client
        client.get("/turbosign/documents/#{document_id}/recipients")
      end

      private

      def get_client
        @client ||= HttpClient.new
      end

      # Read a value from a request/recipient hash by symbol key, falling back to the string key.
      # The SDK accepts both key styles throughout, so callers can use either.
      def req_val(hash, key)
        return nil if hash.nil?

        value = hash[key]
        value.nil? ? hash[key.to_s] : value
      end

      # Two-level +req_val+: the outer key then the inner key, tolerating symbol or string at both.
      def dig_val(hash, outer_key, inner_key)
        inner = req_val(hash, outer_key)
        req_val(inner, inner_key)
      end

      # Map an embedded recipient's ergonomic +auth+ shorthand to a full identityVerification hash.
      # +emailOtp+ wins if both are set. Returns nil when no auth is requested (no verification).
      def resolve_identity_verification(auth)
        return nil if auth.nil?
        return { "mode" => "otp", "channel" => "email" } if req_val(auth, :emailOtp)
        return { "mode" => "otp", "channel" => "sms" } unless req_val(auth, :sms).nil?

        nil
      end

      # Expand a recipient's +fields+ shorthand into full field objects -- one per provided key,
      # anchored to the given text with placement:"replace" and the key's default size.
      def expand_recipient_fields(recipient)
        shorthand = req_val(recipient, :fields)
        return [] if shorthand.nil?

        email = req_val(recipient, :email)
        EMBEDDED_FIELD_SPECS.each_with_object([]) do |(key, spec), fields|
          anchor = req_val(shorthand, key.to_sym)
          next if anchor.nil?

          fields << {
            "type" => spec[:type],
            "recipientEmail" => email,
            "template" => { "anchor" => anchor, "placement" => "replace", "size" => spec[:size] }
          }
        end
      end

      # Mint the embed URL for one already-resolved recipient and build its result entry.
      #
      # Turn-aware: for a real signing order the backend refuses to mint a URL for a signer whose turn
      # hasn't come (+RecipientNotInTurn+ / +NotSignersTurn+) or who already signed
      # (+RecipientAlreadySigned+). Those are expected states, not failures -- degrade to a nil URL +
      # status so the caller can mint the URL later instead of the whole call throwing away. Any
      # OTHER error is a genuine failure and propagates. We rescue the base error class and branch on
      # +code+ alone (never the HTTP status), mirroring the JS surface.
      def mint_embedded_recipient(recipient, recipient_id, document_id, return_url)
        link = create_signing_url(document_id, recipient_id: recipient_id, return_url: return_url)
        {
          "recipientId" => recipient_id,
          "name" => req_val(recipient, :name),
          "email" => req_val(recipient, :email),
          "embedUrl" => link["url"],
          "status" => "ready",
          "identityVerificationMode" => link["identityVerificationMode"]
        }
      rescue TurboDocxError => e
        code = e.code
        raise unless ["RecipientNotInTurn", "NotSignersTurn", "RecipientAlreadySigned"].include?(code)

        identity_verification = resolve_identity_verification(req_val(recipient, :auth))
        {
          "recipientId" => recipient_id,
          "name" => req_val(recipient, :name),
          "email" => req_val(recipient, :email),
          "embedUrl" => nil,
          "status" => code == "RecipientAlreadySigned" ? "completed" : "pending",
          "identityVerificationMode" => identity_verification && identity_verification["mode"]
        }
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
        # sendEmail rides the same nil?-guarded scalar path: false (suppress recipient emails, the
        # embedded-signing default) is a meaningful value that a truthiness check would silently drop,
        # letting the backend email the recipients. On the multipart upload path it travels as the
        # string "false" via upload_file's value.to_s -- identical treatment to remindersEnabled.
        scalar_keys = %w[sendEmail remindersEnabled maxReminders expirationEnabled]
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
