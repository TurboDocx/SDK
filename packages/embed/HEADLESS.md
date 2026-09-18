# Toward custom signing UI (headless)

`@turbodocx/embed` today ships an **iframe widget** (`<TurboSignForm>` / `<turbosign-form>`): the host
frames TurboDocx's own signing page. That is the fastest integration, and for most customers it's the
right one. This note records why we are already **teed up** for a future where a customer builds their
**own** signing UI (native components in their design system) instead of framing ours — and what's
left to make that a first-class experience.

## We are already headless-capable at the API layer

The signing flow is not an iframe-only feature. It is a **public, token-authenticated REST surface**
that our own signing page is merely one client of:

```
POST /turbosign/public/documents/:id/otp/send          # send the email/SMS code
POST /turbosign/public/documents/:id/otp/verify         # → returns the X-Signing-Session token
GET  /turbosign/public/documents/:id/otp/status
GET  /turbosign/public/documents/:id/fields/recipient   # the fields to render (signature/date/…)
GET  /turbosign/public/documents/:id/file               # the document to display
GET  /turbosign/public/documents/:id/consent-content
POST /turbosign/public/documents/:id/consent
POST /turbosign/public/documents/:id/sign               # submit field values + signature
GET  /turbosign/public/documents/:id/status
```

Auth is the same token model the iframe uses — no privileged key in the browser:

1. `TurboSign.createSigningUrl(...)` mints a per-recipient URL carrying a **recipient token**
   (`?token=` for OTP, single-use `?sut=` for external-IdV / override). It also returns
   `identityVerificationMode` and `pendingChecks` (e.g. `["email_otp"]`) — a headless client reads
   these to know which steps to drive.
2. The recipient token authorizes `otp/send` + `otp/verify`.
3. `otp/verify` returns the **signing-session token** (`X-Signing-Session`), which authorizes the
   OTP-gated endpoints (`fields/recipient`, `file`, `consent`, `sign`).

A custom UI drives exactly this sequence with its own components. Nothing about the API assumes an
iframe.

## What's already in the right shape

- **`createSigningUrl` is not iframe-coupled** — it returns a URL *plus* the machine-readable
  `identityVerificationMode` / `pendingChecks` a headless client needs.
- **`@turbodocx/embed` separates the primitive from the renderer** — `handleTurboSignMessage` (a pure,
  origin-pinned message handler) is exported independently of `<TurboSignForm>`. The composable
  direction is already established.
- **The signing API is token-scoped**, so a custom UI needs no API key in the browser — same security
  posture as the iframe.

## The roadmap to first-class custom-UI DevEx (all additive)

None of this requires re-architecting; it layers on top of what exists.

1. **SDK signing-step wrappers.** The JS SDK stops at `createSigningUrl` (mint). Add a headless
   `TurboSignSigner` (or `session`) module wrapping `otp/send`, `otp/verify`, `fields/recipient`,
   `file`, `consent`, `sign`, `status`, holding the recipient + signing-session tokens — so customers
   don't hand-roll REST. Port to the other language SDKs after JS.
2. **A shared headless hook.** Add `useTurboSignSession(token)` here that drives the state machine
   (send/verify OTP → load fields → collect input → submit) and expose it so both `<TurboSignForm>`
   (iframe renderer) and a future `<TurboSignFields>` (native renderer) consume the same hook. The
   iframe becomes one renderer of a shared session, not a fork.
3. **Publish + version the `/turbosign/public/documents/...` contract**, especially the
   `fields/recipient` layout schema, with stability guarantees — today it's implicitly public
   (token-auth'd) but not documented as an integration surface a custom UI can build against.

## Guardrail

Keep `createSigningUrl` returning `identityVerificationMode` + `pendingChecks`, and keep the signing
steps behind the recipient + signing-session tokens (never the API key). As long as those hold, the
iframe widget and a custom UI stay two renderers of one headless flow — and we never have to choose.
