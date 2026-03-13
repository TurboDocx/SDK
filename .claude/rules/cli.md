# CLI Rules

## Architecture

The CLI (`packages/cli/`) is a Go + Cobra wrapper around the Go SDK. It translates command-line flags/args into Go SDK method calls and formats output. It adds zero HTTP or auth logic — that's all in the SDK.

## Command Structure

Top-level subcommands map to product brands:
- `turbodocx sign ...` — TurboSign digital signatures
- `turbodocx partner ...` — TurboPartner portal management (planned)
- `turbodocx config/login/version/completion` — CLI utilities

## Testability

- SDK client calls mocked via **interface + injection**: define interface matching SDK client methods, `newSignClient` is a package var replaceable in tests
- Use `testify/assert` + `testify/require`
- Capture stdout/stderr via `bytes.Buffer` for output assertions
- Temp dirs for config file tests (`t.TempDir()`)
- Sign subcommand tests use `executeSignCmd()` helper which creates a fresh Cobra command tree

## Key Patterns

- **Lazy client creation**: Each leaf command creates its own SDK client in `RunE`. Avoids requiring TurboSign credentials for partner commands and vice versa
- **`@file` syntax**: `--recipients @signers.json` reads from file, inline JSON also accepted
- **Config resolution**: flag > env var > config file (`~/.turbodocx/config.json`)
- **Output modes**: Human (colored), JSON (`--json`), plain (`--plain`). Errors to stderr, data to stdout
- **`cmdutil` package**: Shared state between `cmd` and `cmd/sign` to avoid circular imports

## Build & Release

- `go build -v .` from `packages/cli/`
- GoReleaser: 6 targets (linux/darwin/windows × amd64/arm64), Homebrew tap
- Release trigger: GitHub release with tag `cli-v*`
- Install: `brew install turbodocx/tap/cli`
