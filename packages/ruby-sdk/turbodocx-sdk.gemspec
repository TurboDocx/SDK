# frozen_string_literal: true

Gem::Specification.new do |spec|
  spec.name          = "turbodocx-sdk"
  spec.version       = "0.1.0"
  spec.authors       = ["TurboDocx"]
  spec.email         = ["team@turbodocx.com"]

  spec.summary       = "Ruby SDK for the TurboDocx API"
  spec.description   = "Official Ruby SDK for TurboDocx — digital signatures (TurboSign), " \
                        "partner management (TurboPartner), and quoting (TurboQuote)."
  spec.homepage      = "https://github.com/TurboDocx/SDK"
  spec.license       = "MIT"

  spec.required_ruby_version = ">= 2.7.0"

  spec.files = Dir["lib/**/*.rb"]
  spec.require_paths = ["lib"]

  # Zero runtime dependencies -- uses Ruby stdlib (net/http, json, uri, securerandom)

  spec.add_development_dependency "rspec", "~> 3.13"
end
