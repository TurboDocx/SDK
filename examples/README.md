# TurboDocx examples

Runnable, self-contained examples that show a full integration end to end (beyond the per-language
snippets in each `packages/<lang>-sdk/examples/`).

| Example | What it shows |
|---|---|
| [`embedded-web-app`](./embedded-web-app) | Embedded TurboSign signing in a **Vite + React + shadcn** app with **three paths** in one place: **Single signer** (hand-rolled `<iframe>` + `postMessage` listener), **Sequential kiosk** (two signers in order on one device — turn-aware), and **Widget** (the drop-in `<TurboSignForm>` from [`@turbodocx/embed`](../packages/embed)). All three go through a **key-safe backend-for-frontend** (`server.ts`): the browser calls `/api/*`, the server holds the API key and uses `@turbodocx/sdk` to mint the embed URLs. Verified with email OTP. |
| [`partner-preferences`](./partner-preferences) | Reading and setting a partner/customer organization's preferences (JS + Python). |

Each example has its own README with run instructions and prerequisites.
