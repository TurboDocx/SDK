# SDK Architecture

## Module Design

Each SDK exposes two top-level modules:

- **TurboSign** — digital signature operations (create review links, send signatures, void, resend, download, get status, audit trail)
- **TurboPartner** — partner portal management (organizations, users, API keys, entitlements, audit logs)

Modules use a **static class pattern**: configure once with `TurboSign.configure(config)`, then call static methods. No instantiation required.

## HTTP Client

Each SDK wraps a single `HttpClient` class responsible for:

1. **Authentication**: Bearer token via `apiKey` or `accessToken`, sent in `Authorization` header. Org ID sent as `x-rapiddocx-org-id` header.
2. **Base URL**: Configurable, defaults to `https://api.turbodocx.com`. Env var fallback: `TURBODOCX_BASE_URL`.
3. **Response unwrapping**: Backend wraps responses in `{ "data": ... }`. The client auto-unwraps when the response has only a `data` key (smart unwrap).
4. **Error mapping**: HTTP status codes map to typed errors (400→Validation, 401→Auth, 404→NotFound, 429→RateLimit, other→TurboDocxError).
5. **File upload**: Multipart form upload with magic-byte file type detection.

### Partner Client

TurboPartner uses a separate config (`PartnerClientConfig`) with `partnerApiKey` (TDXP- prefix) and `partnerId`. It skips sender email validation since it doesn't send signature emails.

## Configuration Pattern

All SDKs follow: **explicit config > env var fallback > error**.

| Config Field | Env Var | Required |
|---|---|---|
| `apiKey` | `TURBODOCX_API_KEY` | Yes (or accessToken) |
| `orgId` | `TURBODOCX_ORG_ID` | Yes for TurboSign |
| `senderEmail` | `TURBODOCX_SENDER_EMAIL` | Yes for TurboSign |
| `senderName` | `TURBODOCX_SENDER_NAME` | No (defaults to "API Service User") |
| `baseUrl` | `TURBODOCX_BASE_URL` | No (defaults to api.turbodocx.com) |

## Error Hierarchy

```
TurboDocxError (base)
├── AuthenticationError    (401)
├── ValidationError        (400)
├── NotFoundError          (404)
├── RateLimitError         (429)
└── NetworkError           (no status — fetch/connection failure)
```

All errors carry `statusCode` and `code` properties. Each SDK implements this hierarchy using language-appropriate patterns (classes in JS/Py/Java/PHP, error types in Go, exceptions in Ruby).

## File Input Abstraction

TurboSign methods accept documents via multiple input types:

| Input | Description |
|---|---|
| `file` (Buffer/bytes) | Raw file content — type detected via magic bytes |
| `file` (path string) | Local file path — read and detect type |
| `file` (File object) | Browser File API object |
| `fileLink` (URL) | Remote file URL — server fetches it |
| `deliverableId` | TurboDocx-generated document ID |
| `templateId` | Pre-configured TurboSign template |

When a `file` is provided, the request uses multipart form upload. Otherwise, JSON body is used.

### Magic Byte Detection

File types are detected from content, not extensions:
- `%PDF` (0x25504446) → PDF
- `PK` (0x504B) + `word/` → DOCX
- `PK` (0x504B) + `ppt/` → PPTX

## Signature Field Positioning

Fields use **coordinate-based positioning**:
- `page` — page number (1-indexed)
- `x`, `y` — position from top-left in points
- `width`, `height` — field dimensions in points
- `recipientEmail` — binds field to a specific signer
- `type` — field type (`signature`, `initials`, `date`, `text`, etc.)

## Type/Model Organization

Each SDK organizes types by module:
- `types/sign` — TurboSign request/response types (recipients, fields, document status)
- `types/partner` — TurboPartner request/response types (organizations, users, API keys, audit logs)

## CLI (`packages/cli/`)

The CLI is a Go + Cobra binary that wraps the Go SDK. It is **not** an SDK — it's a consumer of the Go SDK, providing a command-line interface for TurboSign (and eventually TurboPartner) operations.

### Design

- **Single binary, zero runtime deps** — CGO_ENABLED=0, cross-compiled for 6 platforms
- **Lazy client creation** — each leaf command (`sign status`, `sign send`, etc.) creates its own SDK client. This avoids requiring TurboSign credentials for partner commands
- **Config resolution** — flag > env var (`TURBODOCX_*`) > config file (`~/.turbodocx/config.json`)
- **Output modes** — Human (colored tables), JSON (`--json` for scripting), plain (`--plain` for piping)
- **`@file` syntax** — `--recipients @signers.json` reads JSON from file, like curl's `-d @file`

### Package Layout

```
packages/cli/
├── main.go                    # Entry point (ldflags: version/commit)
├── cmd/
│   ├── root.go                # Persistent flags, config resolution
│   ├── cmdutil/cmdutil.go     # Shared state (avoids circular imports)
│   ├── sign/                  # TurboSign commands (interface + mock injection)
│   │   ├── sign.go            # SignClient interface, factory, @file parser
│   │   ├── status.go, download.go, audit.go, send.go, review.go, void.go, resend.go
│   │   └── *_test.go
│   └── version.go, completion.go, config.go, login.go
└── internal/
    ├── config/                # Load/Save ~/.turbodocx/config.json (0600 perms)
    └── output/                # JSON, table, key-value formatters + ANSI colors
```

### Testing

SDK client calls are mocked via a `SignClient` interface that matches `TurboSignClient` methods. The `newSignClient` package var is swapped in tests. Sign subcommand tests use `executeSignCmd()` helper which creates a fresh Cobra command tree to avoid flag state leakage.

## CI/CD

### Test Workflows (`.github/workflows/ci.yml`)
Runs on push to `main`/`develop` and all PRs. Per-SDK jobs with language-specific setup:
- JS: Node 22, `npm ci && npm run build && npm test`
- Python: 3.9, `pip install -e ".[dev]" && pytest -v`
- Go: 1.21, `go mod tidy && go test -v ./...`
- PHP: 8.1, `composer install && composer test && composer phpstan`
- Java: JDK 11 (Temurin), `mvn test -B`
- CLI: Go 1.21, `go build -v . && go test -v ./...`

### Publish Workflows
Separate workflow per SDK (`publish-{js,py,go,php,java}.yml`). Triggered on release or manual dispatch. Each publishes to the language's package registry.

### CLI Release (`release-cli.yml`)
Triggered by GitHub release with `cli-v*` tag. Runs tests, then GoReleaser cross-compiles binaries for 6 platforms and publishes to GitHub Releases + Homebrew tap (`brew install turbodocx/tap/cli`).
