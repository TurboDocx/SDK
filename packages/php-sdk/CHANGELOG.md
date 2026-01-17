# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Initial PHP SDK implementation
- TurboSign module with 8 methods for digital signatures
- Support for coordinate-based and template anchor-based field positioning
- Strong typing with PHP 8.1+ enums and readonly classes
- Comprehensive exception hierarchy for error handling
- Automatic file type detection using magic bytes
- PHPStan level 8 static analysis support
- PSR-4 autoloading

### Features
- `TurboSign::configure()` - Configure SDK with API credentials
- `TurboSign::sendSignature()` - Send signature request and immediately send emails
- `TurboSign::createSignatureReviewLink()` - Create review link without sending emails
- `TurboSign::getStatus()` - Get document status
- `TurboSign::download()` - Download signed document
- `TurboSign::void()` - Void a document
- `TurboSign::resend()` - Resend signature request emails
- `TurboSign::getAuditTrail()` - Get audit trail for a document

[Unreleased]: https://github.com/TurboDocx/SDK/compare/main...HEAD
