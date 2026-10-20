# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- TurboQuote list sorting: `sortBy` / `sortDirection` on `ListQuotesRequest`, `ListProductsRequest`, `ListPriceBooksRequest`, `ListBundlesRequest`, `ListCompaniesRequest`, `ListContactsRequest` (also used by `listCompanyContacts()`) and `ListTypesRequest`. Left out, each list keeps its old order.
- Quote list filters on `ListQuotesRequest`: `companyIds`, `currencies` (`currency` now takes one value or an array too), the `expired` status, `createdBy`, `createdByApiKeys`, `validUntilWindow`, `validUntilFrom`, `validUntilTo`, `summaryCurrency`. `QuoteListResponse` gains `statusCounts` (`QuoteStatusCounts`) and `summary` (`QuoteSummary`); each `Quote` from the list carries `isExpired`, `isSignatureExpired` and `lineItemCount`.
- `ListProductsRequest` `billingFrequency` / `currency` and `ListBundlesRequest` `currency` take one value or an array; `ListContactsRequest` takes `companyIds`.
- `TurboQuote::getQuoteSummary(?QuoteSummaryRequest)`, `listQuoteCreators()` (`QuoteCreator[]`), `getNextQuoteNumber()` (`NextQuoteNumber`), `getCompanyOpenQuotes()` / `getContactOpenQuotes()` (`OpenQuotesResponse`), `getProductQuoteImages()`, and custom line item images: `getQuoteLineItemImages()`, `getLineItemImages()`, `addLineItemImages()`, `reorderLineItemImages()`, `removeLineItemImage()` (`LineItemImage`).
- `duplicateQuote()`, `duplicateProduct()`, `duplicatePriceBook()` and `duplicateBundle()` take an optional name for the copy.
- Companies: `email` on `Company`, `CreateCompanyRequest` and `UpdateCompanyRequest` (`includeEmail: true` + `email: null` clears it). `UpdatePriceBookRequest` takes `resetProductPricing`. `PriceBook` gains `overrideCount`; `Bundle` gains `itemCount` and `billingTotals`; `ContactListResponse` gains `company`.
- `HttpClient::put()`. `FileTypeDetector` recognises PNG and JPEG.

### Changed
- **API behaviour, all SDK versions:** deleting a sent quote is refused with a 409 (`ConflictException`, code `CANNOT_DELETE_SENT_QUOTE`) — void it instead. Deleting a company or contact with open quotes, or a company's last contact, is a 409 (`CompanyHasOpenQuotes`, `ContactHasOpenQuotes`, `LastContact`); deleting the default price book is a 400 `PriceBookIsDefault`.

## [0.9.0] - 2026-10-20

### Added
- Template signer roles: `Recipient` takes an optional `role` (a template signer role key), and `Recipient::$signingOrder` may be left out (`null`) when a role is given. A recipient with neither a role nor a signing order is still rejected. An empty or whitespace-only role counts as no role.
- `TurboSign::getTemplateSignatureSetup($templateId)` lists a template's signer roles (`key`, `label`, `order`, `hasSavedSigner`, `defaultName`, `defaultEmail`, `fieldCount`) for sending it with `recipients[].role` (`GET /turbosign/templates/{id}/signature-setup`). New `TemplateSignatureSetup` and `TemplateSignatureRole` response types.
- `EmbeddedSignatureRecipient` passes `role` through to `createEmbeddedSignature()`.
- New example `examples/turbosign-template-roles.php`.

### Fixed
- `TurboSign::sendSignature()`, `createSignatureReviewLink()` and `createEmbeddedSignature()` now send `fileName` (as a `fileName` form field, so names without an extension work too). It was ignored before, so every upload was stored as `document.<ext>`. An empty `fileName` is left out (the API rejects it).
- The Packagist package no longer ships tests, config files, manual test scripts or other dev-only files (`.gitattributes` `export-ignore`).
- README and docblock examples read config with `fromEnvironment()` or `getenv()` instead of `$_ENV`, which is empty under the shipped `php.ini-production` / `php.ini-development` (`variables_order = "GPCS"`). `getenv()` returns `false` when a variable is unset, so the examples add `?: null` for nullable config fields and `?: ''` for the required strings of `PartnerClientConfig`; TurboWebhooks reads its env vars on first use. The `getStatus()` example now treats `status` as the plain string it is.
- `verifyWebhookSignature()` returns `false` instead of throwing a `TypeError` when a header, the body or the secret is not a string (a missing header is `null`, a repeated one an array). Its parameters are now typed `mixed`.

### Changed
- `SendSignatureRequest` / `CreateSignatureReviewLinkRequest` `$fields` defaults to `[]`. `sendSignature()` leaves `fields` out of the request when it is empty, so a template sent with signer roles uses its saved fields. `createSignatureReviewLink()` always sends it, as `[]` when empty: a review link may have no fields (they are placed in the preview).
- **Behaviour change:** `sendSignature()` with no signer roles and an empty `$fields` now gets a 400 `FieldsRequired` (a `ValidationException`). 0.8.0 sent the empty list, and the API created a document with nothing to sign.
- `createEmbeddedSignature()` treats an empty top-level `$fields` as absent, so the recipients' `fields` shorthand still expands. 0.8.0 sent the empty list and dropped the shorthand.
- A `fields` array whose keys are not sequential (for example after `array_filter()`) is now sent as a JSON list. It was sent as a JSON object before.
- **Behaviour change:** `verifyWebhookSignature()` rejects every delivery when `$toleranceSeconds` is negative. 0.8.0 skipped the timestamp check. `0` still turns the check off.
- `verifyWebhookSignature()` `$toleranceSeconds` and `$now` accept an int or a finite float (they were `int` / `?int`, so a float threw a `TypeError` under `strict_types`). A string (numeric or not), bool, array, NaN or INF returns `false`. `$now` is only read when the timestamp check runs.
- `createEmbeddedSignature()` returns recipients (and mints their embed URLs) in the order the API returns them. With template roles that is the template's role order, not the order passed. Signers the API returns that you did not pass, such as a role's saved signer, are included too.
- `SendSignatureResponse::$recipients` and `CreateSignatureReviewLinkResponse::$recipients` are now always an array (`array`, not `?array`): the API always returns `recipients` on a successful send or review link, and a missing key becomes `[]`. The constructors still accept `null` for that argument (coalesced to `[]`), so direct construction is unchanged.

## [0.8.0] - 2026-10-06

Only the PHP-specific entries recorded here at the time are listed. See the `php-sdk-v0.8.0` GitHub release for the full notes.

### Added
- Quote decline now supports `DRAFT` quotes. Before, only quotes that had been sent could be declined.

### Changed
- The decline `reason` is now optional for a draft quote (it is still required once the quote has been sent). The void reason is unchanged and remains required.

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

[Unreleased]: https://github.com/TurboDocx/SDK/compare/php-sdk-v0.9.0...HEAD
[0.9.0]: https://github.com/TurboDocx/SDK/compare/php-sdk-v0.8.0...php-sdk-v0.9.0
[0.8.0]: https://github.com/TurboDocx/SDK/releases/tag/php-sdk-v0.8.0
[0.1.0]: https://github.com/TurboDocx/SDK/releases/tag/v0.1.0
