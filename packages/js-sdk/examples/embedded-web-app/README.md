# Embedded signing — a fake host web-app ("Northwind Mutual")

This example is the **integrator's side** of embedded signing: a small customer web-app that puts the
TurboSign signing page inside its own `<iframe>` instead of emailing a signing link. It ties together
everything the embedded flow needs:

- **`server.ts`** — a tiny Node server (no framework) that holds your TurboDocx API key and mints an
  embeddable signing URL with the SDK (`TurboSign.createSigningUrl`). The key stays server-side.
- **`public/index.html`** — the host page. It fetches the URL from its own server, frames it, and
  listens for the `turbosign:completed` postMessage the signing page fires when the signer is done.

## Prerequisite: allow-list this app's origin (the important one)

Embedded signing is **default-deny**. The browser will refuse to render the iframe unless the
signer's org lists this app's origin in its embedded-signing allowed origins. For this demo that is:

```
http://localhost:4000
```

Add it in **TurboDocx → E-Signature settings → Identity & embedding → Allowed origins** (or via the
org preferences API). Without it you get a blank/refused frame — that is the clickjacking protection
(`frame-ancestors`) working, not a bug. This is exactly the tenant change a real integrator (e.g.
Baer's) makes once to allow their own domain to embed.

## Run

You need a document with a signable recipient already created in your org (create one with
`examples/turbosign-embedded-identity.ts` or the app), then:

```bash
TURBODOCX_API_KEY=your-key \
TURBODOCX_ORG_ID=your-org \
TURBODOCX_SENDER_EMAIL=you@yourcompany.com \
DEMO_DOCUMENT_ID=the-document-id \
DEMO_RECIPIENT_ID=the-recipient-id \
npx tsx examples/embedded-web-app/server.ts
```

Then open <http://localhost:4000> and click **Start signing**. Select the recipient by
`DEMO_EXTERNAL_ID` instead of `DEMO_RECIPIENT_ID` if you key recipients by your own id.

## What to notice

- **The API key never reaches the browser.** The page calls its own `/api/signing-url`; only the
  server talks to TurboDocx.
- **`link.url` is an `/e-signature/embed/...` URL** — the embeddable variant. (The email-link variant
  is `/e-signature/sign/...`, which is hard-denied from framing.)
- **Completion is push, not poll.** The host advances when it receives the `turbosign:completed`
  message. In production, pin the listener to your known TurboSign origin (`TURBOSIGN_ORIGIN` in the
  page) since the page posts to `"*"`, and/or confirm via the `completed` webhook.
- **Identity verification is optional.** Uncomment an `identityVerification` block in `server.ts` to
  require an email/SMS OTP (or an external-IdV assertion) before the signer reaches the document.
