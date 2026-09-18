# Embedded signing — Vite + React + shadcn (three paths)

A single host web-app that embeds TurboSign three ways, so you can compare the approaches side by side:

- **Single signer** — the host hand-rolls the `<iframe>` and its own origin-checked
  `window.addEventListener("message", …)` completion listener.
- **Sequential kiosk** — one document, two signers **in order** on the same device. The next signer's
  URL is minted **just-in-time** when it's their turn (turn-aware), with a short retry to ride out the
  moment right after the previous signer completes.
- **Widget** — the same flow, but the page drops in `<TurboSignForm>` from
  [`@turbodocx/embed`](../../packages/embed), which owns the iframe, origin pinning, and completion
  event for you.

## The key stays on the server

This is the pattern real integrations use in production:

```
React SPA  ──/api/*──▶  server.ts (holds the API key)  ──▶  TurboDocx
```

The browser **never** imports the SDK or sees the API key. `server.ts` is a tiny backend-for-frontend
that holds the key and uses `@turbodocx/sdk` to create documents and mint embeddable signing URLs; the
SPA calls `/api/single`, `/api/kiosk/start`, `/api/kiosk/next` and just frames the URLs it gets back
(or hands them to the widget). In dev, Vite proxies `/api` to `server.ts`.

## Run

Two processes. Configure the server's `.env` first (copy the template, fill in your creds):

```bash
cd examples/embedded-web-app
cp .env.example .env      # set TURBODOCX_API_KEY + TURBODOCX_ORG_ID (see the file)
npm install

# terminal 1 — the key-holding backend (default :4000)
npm run server

# terminal 2 — the SPA (Vite, :5173, proxies /api → :4000)
npm run dev
```

Then open <http://localhost:5173> and pick a path.

`.env` documents every variable. At minimum set `TURBODOCX_API_KEY`, `TURBODOCX_ORG_ID`, and
`TURBODOCX_SENDER_EMAIL`. `TURBODOCX_API_URL` defaults to TurboDocx production; set it (e.g.
`http://localhost:3000`) only when testing against a dev backend. Your real `.env` is gitignored.

## Prerequisite: allow-list this app's origin

Embedded signing is **default-deny**. The browser refuses to render the iframe unless the signer's org
lists this app's origin in its embedded-signing allowed origins. For this demo add:

```
http://localhost:5173
```

in **TurboDocx → E-Signature settings → Identity & embedding → Allowed origins**. Production origins
must be `https://`; `http://localhost` is accepted only as a clearly-flagged dev-only override. Without
an allow-listed origin you get a blank/refused frame — that's the clickjacking protection
(`frame-ancestors`) working, not a bug.

## Tests

```bash
npm test
```

`handlers.test.ts` covers the server handlers (SDK mocked): single/kiosk mapping, the turn-aware
`ready`/`pending` split, and the null-URL guard. `src/lib/turbosign.test.ts` covers the frontend API
client (fetch mocked): the three endpoints, error propagation, and the kiosk mint retry.

## What to notice

- **The API key never reaches the browser** — only `server.ts` talks to TurboDocx.
- **Email OTP is the identity step** — the signing page challenges a 6-digit code before the document.
- **Completion is push** — the single-signer path listens for the `turbosign:completed` postMessage;
  the widget surfaces it as an `onCompleted` callback. In production, pin the listener to your known
  TurboSign origin and/or confirm via the `completed` webhook.
- **The kiosk mints just-in-time** — a later signer's URL is created only when it's their turn; the
  backend enforces the order.
