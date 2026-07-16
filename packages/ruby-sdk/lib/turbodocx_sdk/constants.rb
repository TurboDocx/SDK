# frozen_string_literal: true

module TurboDocxSdk
  module QuoteStatus
    DRAFT = "draft"
    PENDING_APPROVAL = "pending_approval"
    SENT = "sent"
    ACCEPTED = "accepted"
    DECLINED = "declined"
    VOIDED = "voided"
    ALL = [DRAFT, PENDING_APPROVAL, SENT, ACCEPTED, DECLINED, VOIDED].freeze
  end

  module BillingFrequency
    MONTHLY = "monthly"
    QUARTERLY = "quarterly"
    ANNUAL = "annual"
    ONE_TIME = "one-time"
    ALL = [MONTHLY, QUARTERLY, ANNUAL, ONE_TIME].freeze
  end

  module LineItemType
    PRODUCT = "product"
    BUNDLE = "bundle"
    ALL = [PRODUCT, BUNDLE].freeze
  end

  module CategoryType
    PRODUCT_CATEGORY = "product_category"
    PRICEBOOK_TYPE = "pricebook_type"
    COMPANY_INDUSTRY = "company_industry"
    BUNDLE_CATEGORY = "bundle_category"
    ALL = [PRODUCT_CATEGORY, PRICEBOOK_TYPE, COMPANY_INDUSTRY, BUNDLE_CATEGORY].freeze
  end

  module RenewalPeriod
    WEEKLY = "weekly"
    MONTHLY = "monthly"
    QUARTERLY = "quarterly"
    ANNUALLY = "annually"
    ALL = [WEEKLY, MONTHLY, QUARTERLY, ANNUALLY].freeze
  end

  module Currency
    USD = "USD"
    EUR = "EUR"
    GBP = "GBP"
    CAD = "CAD"
    INR = "INR"
    AUD = "AUD"
    ALL = [USD, EUR, GBP, CAD, INR, AUD].freeze
  end

  module BundleItemStatus
    ACTIVE = "active"
    PRODUCT_DELETED = "product_deleted"
    PRODUCT_UNAVAILABLE = "product_unavailable"
    CURRENCY_MISMATCH = "currency_mismatch"
    ALL = [ACTIVE, PRODUCT_DELETED, PRODUCT_UNAVAILABLE, CURRENCY_MISMATCH].freeze
  end

  module DiscountType
    PERCENT = "percent"
    AMOUNT = "amount"
    ALL = [PERCENT, AMOUNT].freeze
  end

  # Year token included in a generated quote number.
  module QuoteNumberYearToken
    NONE = "none"
    TWO = "two"
    FOUR = "four"
    ALL = [NONE, TWO, FOUR].freeze
  end

  # Month token included in a generated quote number.
  module QuoteNumberMonthToken
    OFF = "off"
    TWO = "two"
    ALL = [OFF, TWO].freeze
  end

  # Cadence on which the quote number sequence resets.
  module QuoteNumberResetCadence
    NEVER = "never"
    YEARLY = "yearly"
    MONTHLY = "monthly"
    ALL = [NEVER, YEARLY, MONTHLY].freeze
  end

  # The 7 TurboSign webhook events (create_webhook / update_webhook +events:+,
  # test_webhook / notify_webhook +event_type:+).
  #
  # +events:+ stays an Array of plain Strings, so raw strings keep working and
  # the backend can add events without a gem release.
  #
  # On every signature, +recipient_signed+ fires first, then exactly one of
  # +completed+ / +finalization_failed+ (that was the final signature) or
  # +signed+ (signers still remain).
  module WebhookEvent
    # The document is dispatched to recipients.
    SENT = "signature.document.sent"

    # A recipient opens the document for the first time.
    VIEWED = "signature.document.viewed"

    # Any individual signer completes their signature -- fires ONCE PER SIGNER,
    # including the last one. The payload carries the signer's identity plus
    # +is_final_signer+ (true only on the last signature) and +remaining_signers+.
    #
    # This is the per-person event, and it always fires before the
    # document-level outcome (SIGNED, COMPLETED, or FINALIZATION_FAILED).
    RECIPIENT_SIGNED = "signature.document.recipient_signed"

    # A signer signs but the document is NOT yet complete -- document-level
    # partial progress.
    #
    # Two consequences worth internalizing:
    # - It NEVER fires on the final signature. To detect "the whole document is
    #   done", use COMPLETED (or RECIPIENT_SIGNED with +is_final_signer: true+)
    #   -- NOT this event.
    # - A single-signer document never emits it at all. That document emits
    #   +recipient_signed+ (+is_final_signer: true+) then +completed+.
    SIGNED = "signature.document.signed"

    # All recipients have signed and the signed PDF is finalized.
    COMPLETED = "signature.document.completed"

    # The signed PDF fails to finalize (e.g. a KMS signing error). The document
    # is NOT completed -- this fires INSTEAD OF COMPLETED on the final signature.
    FINALIZATION_FAILED = "signature.document.finalization_failed"

    # The document is voided or cancelled.
    VOIDED = "signature.document.voided"

    # All 7 events, in lifecycle order. Pass straight to
    # +create_webhook(events: WebhookEvent::ALL)+ to subscribe to everything.
    ALL = [
      SENT,
      VIEWED,
      RECIPIENT_SIGNED,
      SIGNED,
      COMPLETED,
      FINALIZATION_FAILED,
      VOIDED,
    ].freeze
  end

  # Granular permission scopes for a TurboPartner API key
  # (create_partner_api_key / update_partner_api_key).
  module PartnerScope
    ORG_CREATE = "org:create"
    ORG_READ = "org:read"
    ORG_UPDATE = "org:update"
    ORG_DELETE = "org:delete"
    ENTITLEMENTS_UPDATE = "entitlements:update"
    ORG_USERS_CREATE = "org-users:create"
    ORG_USERS_READ = "org-users:read"
    ORG_USERS_UPDATE = "org-users:update"
    ORG_USERS_DELETE = "org-users:delete"
    PARTNER_USERS_CREATE = "partner-users:create"
    PARTNER_USERS_READ = "partner-users:read"
    PARTNER_USERS_UPDATE = "partner-users:update"
    PARTNER_USERS_DELETE = "partner-users:delete"
    ORG_APIKEYS_CREATE = "org-apikeys:create"
    ORG_APIKEYS_READ = "org-apikeys:read"
    ORG_APIKEYS_UPDATE = "org-apikeys:update"
    ORG_APIKEYS_DELETE = "org-apikeys:delete"
    PARTNER_APIKEYS_CREATE = "partner-apikeys:create"
    PARTNER_APIKEYS_READ = "partner-apikeys:read"
    PARTNER_APIKEYS_UPDATE = "partner-apikeys:update"
    PARTNER_APIKEYS_DELETE = "partner-apikeys:delete"
    AUDIT_READ = "audit:read"
    ALL = [
      ORG_CREATE, ORG_READ, ORG_UPDATE, ORG_DELETE,
      ENTITLEMENTS_UPDATE,
      ORG_USERS_CREATE, ORG_USERS_READ, ORG_USERS_UPDATE, ORG_USERS_DELETE,
      PARTNER_USERS_CREATE, PARTNER_USERS_READ, PARTNER_USERS_UPDATE, PARTNER_USERS_DELETE,
      ORG_APIKEYS_CREATE, ORG_APIKEYS_READ, ORG_APIKEYS_UPDATE, ORG_APIKEYS_DELETE,
      PARTNER_APIKEYS_CREATE, PARTNER_APIKEYS_READ, PARTNER_APIKEYS_UPDATE, PARTNER_APIKEYS_DELETE,
      AUDIT_READ,
    ].freeze
  end
end
