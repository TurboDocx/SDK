# frozen_string_literal: true

Gem::Specification.new do |spec|
  spec.name          = "turbodocx-sdk"
  spec.version       = "0.6.2"
  spec.authors       = ["TurboDocx"]
  spec.email         = ["team@turbodocx.com"]

  spec.summary       = "Ruby SDK for the TurboDocx API"
  spec.description   = "Official Ruby SDK for TurboDocx — digital signatures (TurboSign), " \
                        "partner management (TurboPartner), quoting/CPQ (TurboQuote), " \
                        "document generation (Deliverable), and signature webhooks (TurboWebhooks)."
  spec.homepage      = "https://github.com/TurboDocx/SDK"
  spec.license       = "MIT"

  spec.required_ruby_version = ">= 2.7.0"

  spec.metadata = {
    "homepage_uri" => "https://github.com/TurboDocx/SDK",
    "source_code_uri" => "https://github.com/TurboDocx/SDK/tree/main/packages/ruby-sdk",
    "documentation_uri" => "https://docs.turbodocx.com/docs/SDKs/ruby",
    "rubygems_mfa_required" => "true",
  }

  spec.files = Dir["lib/**/*.rb"] + ["README.md", "LICENSE"]
  spec.require_paths = ["lib"]

  # Zero runtime dependencies -- uses Ruby stdlib (net/http, json, uri, securerandom)

  spec.add_development_dependency "rspec", "~> 3.13"
end
