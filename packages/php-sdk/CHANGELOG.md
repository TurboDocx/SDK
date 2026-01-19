# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.1.0] - 2026-01-17

### Added
- Initial PHP SDK implementation with TypeScript-equivalent strong typing
- TurboSign module with 8 methods for digital signatures
- Support for coordinate-based and template anchor-based field positioning
- Strong typing with PHP 8.1+ enums and typed properties
- Comprehensive exception hierarchy for error handling (6 exception types)
- Automatic file type detection using magic bytes (PDF/DOCX/PPTX)
- PHPStan level 8 static analysis support (zero errors)
- PSR-4 autoloading and PSR-12 code formatting
- Industry-standard dependencies (Guzzle 7.8, PHPUnit 10.5)

### Features
- `TurboSign::configure()` - Configure SDK with API credentials
- `TurboSign::sendSignature()` - Send signature request and immediately send emails
- `TurboSign::createSignatureReviewLink()` - Create review link without sending emails
- `TurboSign::getStatus()` - Get document status
- `TurboSign::download()` - Download signed document
- `TurboSign::void()` - Void a document
- `TurboSign::resend()` - Resend signature request emails
- `TurboSign::getAuditTrail()` - Get audit trail for a document

### Type System
- 4 backed enums: `SignatureFieldType`, `DocumentStatus`, `RecipientStatus`, `FieldPlacement`
- 10 immutable DTOs: `Recipient`, `Field`, `TemplateConfig`, Request/Response classes
- 6 custom exceptions with typed properties

### Testing & Quality
- 31 unit tests with 82 assertions (100% passing)
- PHPStan level 8 static analysis (0 errors)
- PSR-12 code formatting compliance
- Comprehensive test coverage for all core components

### Documentation
- Complete README with API reference and examples
- 3 working example files (simple, basic, advanced)
- PHPDoc annotations for all classes and methods
- TypeScript → PHP equivalents mapping

[Unreleased]: https://github.com/TurboDocx/SDK/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/TurboDocx/SDK/releases/tag/v0.1.0
