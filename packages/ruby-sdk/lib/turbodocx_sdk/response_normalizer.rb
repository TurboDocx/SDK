# frozen_string_literal: true

require "set"

module TurboDocxSdk
  # Normalizes MySQL type quirks in API responses.
  #
  # MySQL returns tinyint(1) as 0/1 and decimal columns as strings.
  # This normalizer converts them to proper Ruby types so consumers
  # get booleans and floats instead of integers and strings.
  #
  # Field names use camelCase to match the API JSON keys.
  module ResponseNormalizer
    BOOLEAN_FIELDS = Set.new(%w[
      isActive
      isDefault
      showInCatalog
      showInQuoteBuilder
      showItemsToEndUser
      syncWithProducts
      isPrimaryAdmin
      canManageOrgs
      canManageUsers
      canManageBilling
      canViewAuditLog
      canManageApiKeys
      canManageEntitlements
      hasFileDownload
      hasGDrive
      hasWrike
      hasSalesforce
      hasConnectWise
      rdWatermark
      hasKnowledgeBase
      hasAI
      hasTurboSign
      hasTurboQuote
    ]).freeze

    DECIMAL_FIELDS = Set.new(%w[
      listPrice
      cost
      unitPrice
      discountPercent
      subtotal
      grandTotal
      subtotalMonthly
      subtotalQuarterly
      subtotalAnnual
      subtotalOneTime
      taxAmount
      taxRate
      bundleDiscountPercent
      totalListPrice
      totalFinalPrice
      totalCost
      finalPrice
      marginPercent
    ]).freeze

    # Recursively normalize a parsed JSON structure (hashes with string keys
    # and arrays). Returns a new structure; does not mutate the input.
    def self.normalize(data)
      case data
      when nil then nil
      when Array then data.map { |item| normalize(item) }
      when Hash
        result = {}
        data.each do |key, value|
          str_key = key.to_s
          if BOOLEAN_FIELDS.include?(str_key) && (value == 0 || value == 1)
            result[str_key] = value == 1
          elsif DECIMAL_FIELDS.include?(str_key) && value.is_a?(String)
            parsed = Float(value) rescue nil
            result[str_key] = parsed.nil? ? value : parsed
          elsif value.is_a?(Hash) || value.is_a?(Array)
            result[str_key] = normalize(value)
          else
            result[str_key] = value
          end
        end
        result
      else
        data
      end
    end
  end
end
