# TurboDocx examples

Runnable, self-contained examples that show a full integration end to end (beyond the per-language
snippets in each `packages/<lang>-sdk/examples/`).

Embedded signing is shown **two ways**: the **raw iframe** (you write the iframe + message listener)
and the **widget** (the `@turbodocx/embed` `<turbosign-form>` element does it for you). Both mint the
signing URL server-side, verify with email OTP, and complete via the `turbosign:completed` postMessage.
Prefer the widget in real apps; the raw example shows what it does under the hood.

| Example | What it shows |
|---|---|
| [`embedded-web-app`](./embedded-web-app) | Embedded signing the **raw** way: a host web-app that hand-rolls the `<iframe>` and its own `window.addEventListener('message', ...)` origin-checked listener. Collects name + email, verifies with **email OTP**, mints the signing URL server-side, and completes via the `turbosign:completed` postMessage. |
| [`embedded-web-app-widget`](./embedded-web-app-widget) | Embedded signing with the **widget**: the same flow, but the host page uses the framework-agnostic `<turbosign-form>` web component from [`@turbodocx/embed`](../packages/embed) (iframe, origin pinning, and completion event handled for you). Includes a `<TurboSignForm>` React snippet for the React path. |
| [`embedded-web-app-sequential`](./embedded-web-app-sequential) | **Sequential** embedded signing (an in-person kiosk): several people sign the **same** document in order on one device. Shows `createEmbeddedSignature`'s turn-awareness — signer #1 comes back `ready` with a URL, the rest `pending`; each next URL is minted just-in-time as the previous signer finishes. |
| [`partner-preferences`](./partner-preferences) | Reading and setting a partner/customer organization's preferences (JS + Python). |

Each example has its own README with run instructions and prerequisites.
