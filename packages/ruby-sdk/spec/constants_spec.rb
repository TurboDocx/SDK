require "spec_helper"
require "turbodocx_sdk"

RSpec.describe "TurboDocxSdk Constants" do
  describe "QuoteStatus" do
    it "defines all 6 status values" do
      expect(TurboDocxSdk::QuoteStatus::DRAFT).to eq("draft")
      expect(TurboDocxSdk::QuoteStatus::PENDING_APPROVAL).to eq("pending_approval")
      expect(TurboDocxSdk::QuoteStatus::SENT).to eq("sent")
      expect(TurboDocxSdk::QuoteStatus::ACCEPTED).to eq("accepted")
      expect(TurboDocxSdk::QuoteStatus::DECLINED).to eq("declined")
      expect(TurboDocxSdk::QuoteStatus::VOIDED).to eq("voided")
    end

    it "provides ALL constant" do
      expect(TurboDocxSdk::QuoteStatus::ALL).to contain_exactly(
        "draft", "pending_approval", "sent", "accepted", "declined", "voided"
      )
    end
  end

  describe "BillingFrequency" do
    it "defines all 4 values" do
      expect(TurboDocxSdk::BillingFrequency::MONTHLY).to eq("monthly")
      expect(TurboDocxSdk::BillingFrequency::QUARTERLY).to eq("quarterly")
      expect(TurboDocxSdk::BillingFrequency::ANNUAL).to eq("annual")
      expect(TurboDocxSdk::BillingFrequency::ONE_TIME).to eq("one-time")
    end
  end

  describe "LineItemType" do
    it "defines product and bundle" do
      expect(TurboDocxSdk::LineItemType::PRODUCT).to eq("product")
      expect(TurboDocxSdk::LineItemType::BUNDLE).to eq("bundle")
    end
  end

  describe "CategoryType" do
    it "defines all 4 category types" do
      expect(TurboDocxSdk::CategoryType::PRODUCT_CATEGORY).to eq("product_category")
      expect(TurboDocxSdk::CategoryType::PRICEBOOK_TYPE).to eq("pricebook_type")
      expect(TurboDocxSdk::CategoryType::COMPANY_INDUSTRY).to eq("company_industry")
      expect(TurboDocxSdk::CategoryType::BUNDLE_CATEGORY).to eq("bundle_category")
    end
  end

  describe "RenewalPeriod" do
    it "defines all 4 periods" do
      expect(TurboDocxSdk::RenewalPeriod::WEEKLY).to eq("weekly")
      expect(TurboDocxSdk::RenewalPeriod::MONTHLY).to eq("monthly")
      expect(TurboDocxSdk::RenewalPeriod::QUARTERLY).to eq("quarterly")
      expect(TurboDocxSdk::RenewalPeriod::ANNUALLY).to eq("annually")
    end
  end

  describe "Currency" do
    it "defines all 6 currencies" do
      expect(TurboDocxSdk::Currency::USD).to eq("USD")
      expect(TurboDocxSdk::Currency::EUR).to eq("EUR")
      expect(TurboDocxSdk::Currency::GBP).to eq("GBP")
      expect(TurboDocxSdk::Currency::CAD).to eq("CAD")
      expect(TurboDocxSdk::Currency::INR).to eq("INR")
      expect(TurboDocxSdk::Currency::AUD).to eq("AUD")
    end
  end

  describe "BundleItemStatus" do
    it "defines all 4 statuses" do
      expect(TurboDocxSdk::BundleItemStatus::ACTIVE).to eq("active")
      expect(TurboDocxSdk::BundleItemStatus::PRODUCT_DELETED).to eq("product_deleted")
      expect(TurboDocxSdk::BundleItemStatus::PRODUCT_UNAVAILABLE).to eq("product_unavailable")
      expect(TurboDocxSdk::BundleItemStatus::CURRENCY_MISMATCH).to eq("currency_mismatch")
    end
  end
end
