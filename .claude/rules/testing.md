# Testing Rules

## TDD Workflow

1. Write tests first that describe expected behavior
2. Run tests to confirm they fail
3. Implement the feature to make tests pass
4. Refactor while keeping tests green

## Test Parity

All SDKs must have equivalent test coverage. When adding a test case in one SDK, add the same scenario in all others. Tests should cover:
- Successful operations (happy path)
- Error handling (auth errors, validation, not found, rate limit)
- Configuration (explicit config, env var fallback, missing required fields)
- File input variants (buffer, path, URL, deliverableId)
- Sender config behavior (senderEmail required, senderName optional)

## Per-SDK Test Commands

| SDK | Command | Framework |
|---|---|---|
| js-sdk | `npm test` | Jest + ts-jest |
| py-sdk | `pytest -v` | pytest |
| go-sdk | `go test -v ./...` | go test |
| php-sdk | `composer test` | PHPUnit |
| java-sdk | `mvn test -B` | JUnit (Maven Surefire) |
| ruby-sdk | `bundle exec rspec` | RSpec |

## Mock HTTP Responses, Not SDK Internals

- Mock the HTTP layer (fetch/requests/http.Client), not SDK module methods
- Return realistic response shapes matching the actual API
- Test error mapping: mock HTTP 401 → verify AuthenticationError is thrown
- Never make real HTTP calls in unit tests
- Keep mocks minimal — only mock what's needed for the specific test case

## Backend Contract Tests

When adding or modifying SDK methods, include tests that verify the SDK produces the correct HTTP request:

- **Request body field names** match the backend Joi schema (camelCase)
- **PATCH null handling**: explicitly-set null fields ARE included in the body; unset fields are OMITTED
- **Multipart structure**: `data` field contains JSON, `images` field contains file parts with detected MIME types
- **Query parameters**: array filters serialize as repeated keys (`?statuses=draft&statuses=sent`)
- **Response unwrapping**: verify `{ data: { result: ... } }` is correctly unwrapped to just the entity
- **Enum values**: test that SDK type definitions include all valid backend values (check `TurboQuotesConstants.ts`)
