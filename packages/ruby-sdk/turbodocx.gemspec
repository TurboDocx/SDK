# frozen_string_literal: true

Gem::Specification.new do |spec|
  spec.name          = "turbodocx"
  spec.version       = "1.0.0"
  spec.authors       = ["TurboDocx Team"]
  spec.email         = ["support@turbodocx.com"]

  spec.summary       = "Official Ruby SDK for TurboDocx API"
  spec.description   = "Ruby SDK for TurboDocx API - Document generation and digital signatures with 100% n8n parity"
  spec.homepage      = "https://github.com/TurboDocx/SDK"
  spec.license       = "MIT"
  spec.required_ruby_version = ">= 3.0.0"

  spec.metadata["homepage_uri"] = spec.homepage
  spec.metadata["source_code_uri"] = "https://github.com/TurboDocx/SDK/tree/main/packages/ruby-sdk"
  spec.metadata["changelog_uri"] = "https://github.com/TurboDocx/SDK/blob/main/packages/ruby-sdk/CHANGELOG.md"

  spec.files = Dir.chdir(__dir__) do
    `git ls-files -z`.split("\x0").reject do |f|
      (File.expand_path(f) == __FILE__) ||
        f.start_with?(*%w[bin/ test/ spec/ features/ .git .github appveyor Gemfile])
    end
  end
  spec.bindir = "exe"
  spec.executables = spec.files.grep(%r{\Aexe/}) { |f| File.basename(f) }
  spec.require_paths = ["lib"]

  spec.add_dependency "faraday", "~> 2.0"
  spec.add_dependency "faraday-multipart", "~> 1.0"

  spec.add_development_dependency "rspec", "~> 3.12"
  spec.add_development_dependency "webmock", "~> 3.19"
  spec.add_development_dependency "rake", "~> 13.0"
end
