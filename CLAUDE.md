# TurboDocx SDK Monorepo

Multi-language SDK monorepo for TurboDocx API (TurboSign digital signatures + TurboPartner portal management).

## Directory Structure

```
packages/
├── js-sdk/      # TypeScript/JavaScript (@turbodocx/sdk)
├── py-sdk/      # Python (turbodocx-sdk)
├── go-sdk/      # Go (github.com/TurboDocx/SDK/packages/go-sdk)
├── php-sdk/     # PHP (turbodocx/sdk)
├── java-sdk/    # Java (com.turbodocx:sdk)
└── ruby-sdk/    # Ruby (turbodocx-sdk)
.github/workflows/  # Per-SDK CI + publish workflows
```

## Build & Test Commands

| SDK | Install | Build | Test |
|-----|---------|-------|------|
| js-sdk | `npm ci` | `npm run build` | `npm test` |
| py-sdk | `pip install -e ".[dev]"` | — | `pytest -v` |
| go-sdk | `go mod tidy` | — | `go test -v ./...` |
| php-sdk | `composer install` | — | `composer test` |
| java-sdk | — | `mvn compile` | `mvn test -B` |
| ruby-sdk | `bundle install` | — | `bundle exec rspec` |

Root-level shortcuts (JS only): `npm run build:js`, `npm run test:js`

## Commit Format

```
feat|fix|docs|test|refactor: description
[js-sdk] Add batch signing      # PR title format
```

## Cross-SDK Conventions

- All SDKs must maintain **feature parity** — see `.claude/rules/cross-sdk-parity.md`
- Two modules per SDK: **TurboSign** (signatures) and **TurboPartner** (partner portal)
- Follow each language's idiomatic naming (camelCase JS, snake_case Py, PascalCase Go)
- Shared error hierarchy: `TurboDocxError > Auth | Validation | NotFound | RateLimit | Network`
- Config pattern: explicit config → env var fallback → error

## Architecture

See @docs/ARCHITECTURE.md for HTTP client design, file input abstraction, error handling, and CI/CD details.

## Rules

- `.claude/rules/cross-sdk-parity.md` — feature parity requirements
- `.claude/rules/js-sdk.md` — JS/TS-specific conventions
- `.claude/rules/testing.md` — TDD workflow and test patterns
