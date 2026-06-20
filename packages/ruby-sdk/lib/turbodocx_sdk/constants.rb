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
end
