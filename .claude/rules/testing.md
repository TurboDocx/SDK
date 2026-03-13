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
