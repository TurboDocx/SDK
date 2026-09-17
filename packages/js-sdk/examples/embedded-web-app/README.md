# Embedded signing — a host web-app with email + email OTP ("Northwind Mutual")

This example is the **integrator's side** of embedded signing: a small customer web-app that collects
the signer's **name and email**, verifies them with an **email one-time passcode**, and embeds the
TurboSign signing page in its own `<iframe>` instead of emailing a signing link. It ties together the
whole embedded ceremony:

- **`server.ts`** — a framework-free Node server that holds your TurboDocx API key. Per request it
  creates a signing document for the entered email with `identityVerification: { mode: 'otp', channel:
  'email' }`, then mints an embeddable signing URL with the SDK (`TurboSign.sendSignature` +
  `TurboSign.createSigningUrl`). The API key stays server-side.
- **`public/index.html`** — the host page. A name + email form; on submit it calls its own backend,
  frames the returned URL, and advances on the `turbosign:completed` postMessage.

## What the signer sees
1. Enters name + email on the host page.
2. Inside the iframe, TurboSign emails a **6-digit code** to that email; the signer verifies it (the
   email-OTP identity step).
3. Signs the document.
4. The **completed signed copy is emailed to that same address** (plus any CC configured on the
   document, plus a completion notification to the sender). The host page updates on its own via the
   `turbosign:completed` message.

## Prerequisite: allow-list this app's origin (the important one)
Embedded signing is **default-deny**. The browser refuses to render the iframe unless the signer's org
lists this app's origin in its embedded-signing allowed origins. For this demo:

```
http://localhost:4000
```

Add it in **TurboDocx → E-Signature settings → Identity & embedding → Allowed origins**. Production
origins must be `https://`; `http://localhost` / `127.0.0.1` is accepted only as a clearly-flagged
dev-only override. Without an allow-listed origin you get a blank/refused frame — that is the
clickjacking protection (`frame-ancestors`) working, not a bug.

## Run

```bash
TURBODOCX_API_KEY=your-key \
TURBODOCX_ORG_ID=your-org \
TURBODOCX_SENDER_EMAIL=you@yourcompany.com \
npx tsx examples/embedded-web-app/server.ts
```

Then open <http://localhost:4000>, enter your name + a real email you can receive at, and click **Start
signing**. (Set `TURBODOCX_API_URL` to point at a non-default backend, e.g. a local dev server.)

## What to notice
- **The API key never reaches the browser.** The page calls its own `/api/start`; only the server
  talks to TurboDocx.
- **Email OTP is the identity step.** `identityVerification: { mode: 'otp', channel: 'email' }` on the
  recipient makes the signing page challenge a code emailed to the signer before they reach the
  document. Drop that field for a plain embedded signer, or use `{ mode: 'external_idv', provider }` if
  your own IdP already verified them (that returns a single-use `?sut=` URL).
- **`link.url` is an `/e-signature/embed/...` URL** — the embeddable variant. (The email-link variant
  is `/e-signature/sign/...`, which is hard-denied from framing.)
- **Completion is push, not poll.** The host advances on `turbosign:completed`. In production, pin the
  listener to your known TurboSign origin (`TURBOSIGN_ORIGIN` in the page), and/or confirm via the
  `completed` webhook.
