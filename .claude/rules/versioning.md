# Versioning — Lockstep Across All SDKs

All six SDKs share **one version number** and are released together. They wrap the
same backend API and maintain feature parity (see `cross-sdk-parity.md`), so a
feature that lands in one lands in all — there's no meaningful "JS is at 0.4 but
Ruby is at 0.2" state. Divergent versions confuse users ("does the Ruby gem have
the webhook fix?") and break the parity guarantee.

**On every release, bump the version in EVERY SDK to the same value — even SDKs
with no code change this cycle.** A no-op bump keeps the line aligned; a skipped
bump is how drift starts (Go sat at 0.2.0 while the others were 0.3.0 because its
bump was forgotten).

## Where the version lives in each SDK

When bumping, update **all** of these to the identical `MAJOR.MINOR.PATCH` string:

| SDK | File | Field |
|-----|------|-------|
| js-sdk | `packages/js-sdk/package.json` | `"version"` |
| py-sdk | `packages/py-sdk/pyproject.toml` **and** `packages/py-sdk/src/turbodocx_sdk/__init__.py` | `version = "…"` + `__version__ = "…"` |
| go-sdk | `packages/go-sdk/turbodocx.go` | `const Version = "…"` |
| php-sdk | `packages/php-sdk/composer.json` | `"version"` |
| java-sdk | `packages/java-sdk/pom.xml` **and** `packages/java-sdk/src/main/java/com/turbodocx/ClientContext.java` | `<version>` + `static final String VERSION` |
| ruby-sdk | `packages/ruby-sdk/turbodocx-sdk.gemspec` **and** `packages/ruby-sdk/lib/turbodocx_sdk.rb` | `spec.version` + `VERSION =` (Ruby carries the version in two places — keep them in sync) |

**Why py/java/ruby carry the version twice:** the registry manifest (`pyproject.toml`,
`pom.xml`, `.gemspec`) is not readable at runtime, but the client-context User-Agent must
emit `@turbodocx/sdk/<version>` — the exact token the backend keys on to classify a request
as an SDK call for the audit trail. So those SDKs also hold an in-code constant. **A stale
in-code constant is not cosmetic** — it ships a wrong version into the audit trail. (Both
drifted this way once: py `__version__` sat at 0.2.0 and java `ClientContext.VERSION` at
0.4.0 while their manifests were at 0.5.0.) JS reads `package.json`, Go's `const Version`
*is* the manifest, and PHP reads `composer.json` — those have one site each.

## Checklist for a release bump

1. Pick the new version (semver: breaking → MAJOR, additive → MINOR, fix → PATCH).
2. Update the field(s) above in all six SDKs to that exact string.
3. Grep to confirm none were missed and none still carry the old version:
   ```bash
   git grep -nE '"version"|version *=|const Version|<version>|spec\.version|VERSION *=' packages/*/  # spot every version site
   ```
4. Run each SDK's tests (versions sometimes assert in spec — e.g. ruby `constants_spec`).
5. Commit as one change: `chore: release vX.Y.Z across all SDKs`.

## Why not derive it from one source?

The registries (npm, PyPI, RubyGems, Packagist, Maven, Go modules) each read the
version from their own manifest, so there's no single file to derive from — the
number has to be written into each ecosystem's native location. Lockstep is
maintained by discipline + the grep check, not by a shared constant.
