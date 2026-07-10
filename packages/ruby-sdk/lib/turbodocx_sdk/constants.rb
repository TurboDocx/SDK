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
