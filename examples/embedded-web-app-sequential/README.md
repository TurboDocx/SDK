# Sequential embedded signing — an in-person kiosk

This example is the **turn-aware** side of embedded signing: **multiple people sign the same document
in order, on the same device**, one after another — a dealership desk, a clinic check-in, a closing
table. It's the counterpart to [`embedded-web-app`](../embedded-web-app) (a single signer) and shows
what `createEmbeddedSignature` does when signing is genuinely sequential.

The key idea: **a later signer's URL isn't minted until it's actually their turn.** When you create a
document with several signers in order, the backend only hands you a signing URL for the signer whose
turn it is now; the rest come back `status: 'pending'` with `embedUrl: null`. The kiosk mints each
next URL on demand as the previous signer finishes.

- **`server.ts`** — framework-free Node server holding the API key. `/api/start` creates one document
  for the whole roster and returns `{ documentId, recipients }` (signer #1 `ready` with a URL, the
  rest `pending`). `/api/next` mints the URL for the next signer (`createSigningUrl`) once it's their
  turn.
- **`public/index.html`** — the kiosk. Collects two signers, frames signer #1, and on the
  `turbosign:completed` postMessage advances to the next signer automatically.

## How turn-awareness shows up

```ts
const { documentId, recipients } = await TurboSign.createEmbeddedSignature({
  file: pdf,
  recipients: [
    { name: 'Alex', email: 'alex@example.com', signingOrder: 1, auth: { emailOtp: true }, fields: { signature: '{signature1}' } },
    { name: 'Sam',  email: 'sam@example.com',  signingOrder: 2, auth: { emailOtp: true }, fields: { signature: '{signature2}' } },
  ],
});

// recipients[0] -> { status: 'ready',   embedUrl: 'https://.../embed/...' }  // frame this now
// recipients[1] -> { status: 'pending', embedUrl: null }                     // mint later, when it's their turn
```

When Alex finishes, mint Sam's URL:

```ts
const link = await TurboSign.createSigningUrl(documentId, { recipientId: recipients[1].recipientId });
// frame link.url
```

`createEmbeddedSignature` never throws just because a later signer isn't in turn — that's an expected
state, not a failure. (A signer who has already signed comes back `status: 'completed'`, also with a
null URL. Any genuine error still throws.)

## Prerequisite: allow-list this app's origin
Embedded signing is **default-deny**. Add this demo's origin to the signer's org:

```
http://localhost:4100
```

in **TurboDocx → E-Signature settings → Identity & embedding → Allowed origins**. Production origins
must be `https://`; `http://localhost` is accepted only as a clearly-flagged dev-only override.

## Run

```bash
cd examples/embedded-web-app-sequential
cp .env.example .env      # then edit .env and fill in your values
npx tsx server.ts
```

Then open <http://localhost:4100>, enter two signers (use real emails you can receive at), and click
**Start signing**. Sign as the first signer; when you complete, the kiosk loads the second signer's
turn on the same screen.

## What to notice
- **The next signer's URL is minted just-in-time.** The kiosk holds `documentId` + the pending
  recipient ids and calls `/api/next` only when the previous signer is done — the backend enforces the
  turn, so an out-of-turn mint is refused, not silently allowed.
- **The API key never reaches the browser.** The page only ever gets embed URLs from its own server.
- **Completion is push.** Each signer's completion arrives as a `turbosign:completed` postMessage; in
  production pin the listener to your known TurboSign origin and/or confirm via the `completed` webhook.
