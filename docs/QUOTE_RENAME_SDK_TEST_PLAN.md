# Quote rename & duplicate naming (SDK surface) — E2E test plan

**Tier:** standard · **Rows:** 46 · **Written:** 2026-08-04
**Derived from:** the TurboQuote naming behaviour documented in the `quote-*` SDK reference pages

## Scope

The API changed how quote **names** are validated and propagated. No SDK method, signature,
or type changed — every method involved (`createQuote`, `updateQuote`, `duplicateQuote`,
`handleExpiredQuote`, `sendQuote`) already existed in all six languages. What changed is
behaviour *behind* those methods, which means an SDK caller sees it with no version bump and no
compile error:

1. `name` is **trimmed** on create and update; a name that is empty once trimmed is a `400`.
2. `duplicateQuote` names the copy `Copy of <source>`, **truncated to 255 characters** (previously
   it could overflow the `varchar(255)` column).
3. `handleExpiredQuote` creates its replacement draft carrying the **original name** — no
   `Copy of ` prefix — so repeated renewals cannot compound into `Copy of Copy of …`.
4. Renaming is **draft-only**; `templateId` is the only field updatable on a non-draft quote.
5. Sending snapshots the quote's **current name** onto the TurboSign document, which is what makes
   1–4 user-visible rather than cosmetic.

This plan is language-agnostic. Each row is implemented once per SDK in
`packages/<pkg>/examples/quote-rename/`, so a row that passes in JS but fails in Go is a porting
defect in that SDK, not a backend defect.

## Surface map

| Surface | Where | Notes |
|---------|-------|-------|
| `createQuote` / `create_quote` | `packages/*/…` quote module | Joi `joiCreateQuoteSchema` now trims `name` |
| `updateQuote` / `update_quote` | `packages/*/…` quote module | Joi `joiUpdateQuoteSchema` now trims `name`; draft-only gate |
| `duplicateQuote` / `duplicate_quote` | `packages/*/…` quote module | Copy naming + 255 cap |
| `handleExpiredQuote` | `packages/*/…` quote module | `action` = `void` \| `decline` \| `renew` |
| `sendQuote` | `packages/*/…` quote module | Snapshots the name onto the signature document |
| `POST /v1/quotes` | API | Name validated as trimmed, 1–255 characters |
| `PATCH /v1/quotes/:id` | API | Same name validation; draft-only for every field but `templateId` |
| `POST /v1/quotes/:id/duplicate` | API | Copy naming + 255 cap |
| `POST /v1/quotes/:id/handle-expired-sent` | API | Replacement draft keeps the original name |

**Shared surfaces and their other consumers** (this drives §4):

- The duplicate routine has **two** callers: the public `POST /v1/quotes/:id/duplicate` endpoint
  *and* the expired-quote handler. The naming override exists for the second; the first must be
  unchanged.
- Name validation covers every quote create/update in the product, not just renames — the web
  quote wizard, the n8n `quote:create` / `quote:update` operations, and bulk import. Ordinary
  names must round-trip byte-identical.
- The draft-only gate on `updateQuote` governs *all* updatable fields, not just `name`.
- `sendQuoteWithDeliverable` names its signature document `<quote name> with <deliverable name>` —
  a second naming call site that must stay correct.

## Environment

- A dev org and API key. Configure via `TURBODOCX_API_KEY`, `TURBODOCX_ORG_ID`,
  `TURBODOCX_BASE_URL` — **never hardcode**; the examples read them from the environment.
- The org needs at least one company + contact (`companyId` is `NOT NULL` on `TurboQuoteHeader`).
  The example apps create and clean up their own.
- Rows touching `sendQuote` / `handleExpiredQuote` need a send-capable org (sender name + email set
  on the org quote template), or they return `400 SenderEmailRequired` for an unrelated reason.
- §7 rows that assert on the TurboSign document name need read access to the signature document —
  via `TurboSign.listDocuments()` or a DB check on `SignatureDocument.name`.

---

## 1. Happy paths

| # | Precondition | Step | Expected | Status |
|---|--------------|------|----------|--------|
| S1 | Org with a company + contact | `createQuote({ name: 'Acme Q3' })` | Quote created, `name === 'Acme Q3'`, `status === 'draft'` | ☐ |
| S2 | Draft quote from S1 | `updateQuote(id, { name: 'Acme Q3 — Revised' })` | Returns the quote with the new name | ☐ |
| S3 | Draft quote named `Acme Q3` | `duplicateQuote(id)` | New quote, `name === 'Copy of Acme Q3'`, `status === 'draft'` | ☐ |
| S4 | Copy from S3 | `updateQuote(copyId, { name: 'Acme Q3 (2nd site)' })` | Copy renamed; the source quote's name is untouched | ☐ |
| S5 | Draft quote with ≥1 line item | `sendQuote(id)` | Send succeeds; quote `status === 'sent'` | ☐ |
| S6 | Sent quote past `validUntil` | `handleExpiredQuote(id, { action: 'void', reason: 'x', newValidUntil })` | Original goes terminal; a new draft is returned | ☐ |
| S7 | Sent quote past `validUntil` | `handleExpiredQuote(id, { action: 'decline', reason: 'x', newValidUntil })` | Original `declined`; a new draft is returned | ☐ |
| S8 | Sent quote whose signature expired | `handleExpiredQuote(id, { action: 'renew', newValidUntil })` | Succeeds **without** `reason`; a new draft is returned | ☐ |
| S9 | Full pass | create → rename → duplicate → rename copy → send copy | Every step succeeds; final `status === 'sent'` | ☐ |

## 2. Persistence & round-trips

| # | Precondition | Step | Expected | Status |
|---|--------------|------|----------|--------|
| S10 | Quote renamed in S2 | `getQuote(id)` in a fresh client | Returns the renamed value, not the original | ☐ |
| S11 | Quote renamed in S2 | `listQuotes()` | The list entry carries the renamed value | ☐ |
| S12 | Copy from S3 | `getQuote(copyId)` | `name === 'Copy of Acme Q3'` — the prefix persisted, not just echoed | ☐ |
| S13 | Renamed source quote | `duplicateQuote(id)` again | Copy is built from the **current** name, not the name at creation | ☐ |
| S14 | Quote renamed then sent | `getQuote(id)` | Name still the renamed value after the status transition | ☐ |
| S15 | Renewal draft from S8 | `getQuote(newId)` | Name equals the original quote's name exactly | ☐ |
| S16 | Renewal draft from S8, renewed again | `handleExpiredQuote` a second time | Name is *still* the original — no `Copy of Copy of …` | ☐ |
| S17 | Copy created, then source deleted | `getQuote(copyId)` | Copy survives with its `Copy of …` name (no cascade) | ☐ |

## 3. Edge cases, limits & input abuse

| # | Precondition | Step | Expected | Status |
|---|--------------|------|----------|--------|
| S20 | — | `createQuote({ name: '  Acme  ' })` | Stored as `'Acme'` — leading/trailing whitespace trimmed | ☐ |
| S21 | Draft quote | `updateQuote(id, { name: '  Acme  ' })` | Stored as `'Acme'` | ☐ |
| S22 | — | `createQuote({ name: '   ' })` | `400`; message names `name` as not allowed to be empty | ☐ |
| S23 | Draft quote | `updateQuote(id, { name: '   ' })` | `400`; the quote's name is **unchanged** afterwards | ☐ |
| S24 | — | `createQuote({ name: '\t\n' })` | `400` — tabs/newlines are whitespace too | ☐ |
| S25 | — | `createQuote({ name: '' })` | `400` | ☐ |
| S26 | — | `createQuote({ name: 'A'.repeat(255) })` | Accepted — 255 is the inclusive maximum | ☐ |
| S27 | — | `createQuote({ name: 'A'.repeat(256) })` | `400` — one over the limit | ☐ |
| S28 | — | `createQuote({ name: '  ' + 'A'.repeat(255) + '  ' })` | **Accepted** — trim runs before the length check | ☐ |
| S29 | Quote named with 255 chars | `duplicateQuote(id)` | Copy name is exactly 255 chars (`Copy of ` + first 247), insert does not fail | ☐ |
| S30 | Quote named `Copy of X` | `duplicateQuote(id)` | Copy is `Copy of Copy of X` — duplicate genuinely stacks (unlike renew) | ☐ |
| S31 | — | `createQuote({ name: '案件 🚀 Ünïcode' })` | Stored and returned byte-identical; no mangling | ☐ |
| S32 | — | `createQuote({ name: '<b>x</b> {{tpl}}' })` | Stored literally; not executed or stripped | ☐ |
| S33 | Draft quote | `updateQuote(id, { name: null })` | Rejected — `name` is not a nullable field | ☐ |
| S34 | Draft quote | `updateQuote(id, {})` | No-op update succeeds; name unchanged | ☐ |
| S35 | Two quotes | Create both with the same name | Both succeed — names are not unique | ☐ |

## 4. Regressions — untouched neighbours

> Every row here asserts something the change must NOT have altered.

| # | Precondition | Step | Expected | Status |
|---|--------------|------|----------|--------|
| S40 | Draft quote | `duplicateQuote(id)` via the public route | Still prefixes `Copy of ` — the new optional `name` param did not leak into the public path | ☐ |
| S41 | Draft quote | `updateQuote(id, { taxRate: 8.25 })` | Succeeds; totals recalculate as before | ☐ |
| S42 | Draft quote | `updateQuote(id, { validUntil, termDays })` | Succeeds — the draft gate is unchanged for non-name fields | ☐ |
| S43 | **Sent** quote | `updateQuote(id, { templateId })` | **Succeeds** — `templateId` is still the documented exemption | ☐ |
| S44 | Quote with an ordinary name | create → get | Name round-trips byte-identical; trimming does not touch interior whitespace (`'Acme  Corp'` keeps both spaces) | ☐ |
| S45 | Quote created before this change | `getQuote(id)` on pre-existing data | Loads and renames normally; no migration was required | ☐ |
| S46 | Duplicate with line items | `duplicateQuote(id)` | Line items, bundles, and category order still copy across | ☐ |
| S47 | Duplicate | `duplicateQuote(id)` with an API key | Copy still attributed to the caller, `preparedBy` resolves via the org template | ☐ |
| S48 | `sendQuoteWithDeliverable` | Send a quote with a deliverable | Signature doc named `<quote name> with <deliverable name>` — second call site (`QuoteStatusHandlers.ts:692`) still correct | ☐ |
| S49 | `handleExpiredQuote` with `void` | Check the original quote | Original is `voided` with the reason recorded — closing out still works, only the *new draft's name* changed | ☐ |

## 5. Permissions, roles & tenancy

| # | Actor | Step | Expected | Status |
|---|-------|------|----------|--------|
| S50 | No API key | `updateQuote(id, { name })` | `401` | ☐ |
| S51 | API key for org B | `updateQuote(<org A quote id>, { name })` | `404`/`403` — must not leak that the quote exists | ☐ |
| S52 | API key for org B | `duplicateQuote(<org A quote id>)` | `404`/`403`; no quote is created in either org | ☐ |
| S53 | Read-only role, if the org has one | `updateQuote(id, { name })` | Refused at the API, not merely hidden in a UI | ☐ |
| S54 | Valid key, non-existent quote id | `updateQuote('<random uuid>', { name })` | `404`, same shape as S51 (no existence oracle) | ☐ |

## 6. Concurrency, failure & recovery

| # | Precondition | Step | Expected | Status |
|---|--------------|------|----------|--------|
| S60 | Draft quote | Two `updateQuote` calls with different names, fired together | Last writer wins; final `getQuote` matches one of them exactly (no interleaved/merged string) | ☐ |
| S61 | Draft quote | `duplicateQuote` twice concurrently | Two distinct copies, both named `Copy of <source>`; no partial copy | ☐ |
| S62 | Draft quote | `updateQuote` with an invalid name (S22), then a valid one | Second call succeeds; the failed call left no partial write | ☐ |
| S63 | Sent quote | `handleExpiredQuote` twice concurrently | One succeeds; the second fails cleanly on the terminal original — not two renewal drafts | ☐ |

## 7. Integration contracts

| # | Precondition | Step | Expected | Status |
|---|--------------|------|----------|--------|
| S70 | Quote renamed then sent | Inspect the TurboSign document | The signature document's name equals the quote's name **at send time** | ☐ |
| S71 | Copy named `Copy of Acme`, renamed to `Acme`, then sent | Inspect the signature document | Named `Acme` — the corrected name, not the copy name | ☐ |
| S72 | Sent quote | `updateQuote(id, { name })` | `400` `Cannot update quote that is not in draft status` | ☐ |
| S73 | `accepted` / `declined` / `voided` quote | `updateQuote(id, { name })` | Same rejection as S72 for every terminal status | ☐ |
| S74 | — | `handleExpiredQuote(id, { action: 'extend', … })` | `400` — `extend` is not a valid action (docs previously claimed only void/decline existed) | ☐ |
| S75 | — | `handleExpiredQuote(id, { action: 'void' })` with no `reason` | `400` — reason required for void | ☐ |
| S76 | — | `handleExpiredQuote(id, { action: 'renew' })` with no `reason` | **Succeeds** — reason optional for renew only | ☐ |
| S77 | — | `handleExpiredQuote(id, { action: 'void', reason: 'A'.repeat(191) })` | `400` — reason capped at 190 | ☐ |
| S78 | Quote renamed via the SDK | Open the same quote in the web UI | UI shows the SDK-set name — one source of truth across clients | ☐ |
| S79 | Quote renamed via the web UI | `getQuote(id)` via the SDK | SDK sees the UI-set name — the contract holds in both directions | ☐ |

---

## Not applicable

- **§8 Presentation & accessibility** — this plan covers the SDK surface, which has no UI. The
  rendering and keyboard/screen-reader rows for the rename affordances are covered by the web
  app's own test plan.
- **Data hygiene / cascade** — partially covered by S17; no delete semantics changed.
- **Feature flags** — this change is not gated by an entitlement.

## Results

| Run | Date | By | Pass | Fail | Blocked | Notes |
|-----|------|----|------|------|---------|-------|
| 1 | | | | | | |

### Failures found

| # | What happened | Root cause | Fixed in |
|---|---------------|------------|----------|
