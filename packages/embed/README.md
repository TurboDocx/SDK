[![TurboDocx](https://raw.githubusercontent.com/TurboDocx/SDK/main/packages/js-sdk/banner.png)](https://www.turbodocx.com)

<div align="center">

# @turbodocx/embed

**Embed TurboSign signing in your app with one component**

A React component and a framework-agnostic web component that frame a TurboSign signing page, pin the message origin, and hand you a `turbosign:completed` callback.

[![NPM Version](https://img.shields.io/npm/v/@turbodocx/embed.svg)](https://npmjs.org/package/@turbodocx/embed)
[![npm downloads](https://img.shields.io/npm/dm/@turbodocx/embed)](https://www.npmjs.com/package/@turbodocx/embed)
[![TypeScript](https://img.shields.io/badge/TypeScript-Ready-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE)

[Website](https://www.turbodocx.com) • [Documentation](https://docs.turbodocx.com/docs) • [Example app](https://github.com/TurboDocx/SDK/tree/main/examples/embedded-web-app) • [Discord](https://discord.gg/NYKwz4BcpX)

</div>

---

`@turbodocx/embed` frames a per-recipient `embedUrl`, verifies where each `postMessage` comes from, and
surfaces completion as a callback or DOM event, so you do not have to hand-roll an iframe plus a
`window.addEventListener('message', ...)` listener in every app. Built by [TurboDocx](https://www.turbodocx.com).

## Install

```bash
npm install @turbodocx/embed
# For the React component, also have React 18+ installed (peer dependency):
npm install react
```

React is an optional `peerDependency` and is never bundled. The package root (`@turbodocx/embed`) never
imports React; the React component lives behind the `@turbodocx/embed/react` subpath.

## 1. Get an `embedUrl` (server side)

Mint it on your server with [`@turbodocx/sdk`](https://www.npmjs.com/package/@turbodocx/sdk), so your API
key never reaches the browser:

```ts
import { TurboSign } from '@turbodocx/sdk';

const { recipients } = await TurboSign.createEmbeddedSignature({
  file: pdfBuffer,
  documentName: 'Auto Policy',
  recipients: [{ name, email, auth: { emailOtp: true }, fields: { signature: '{signature1}' } }],
});
const embedUrl = recipients[0].embedUrl;
```

For an existing document, mint a fresh URL per signer with `TurboSign.createSigningUrl(documentId, { recipientId })`
(or `{ externalId }`). Use `embedUrl` exactly as the SDK returns it; it is an `/e-signature/embed/...` URL.

**API key role:** the key must belong to an **Administrator** or **Contributor**. The signing-url
endpoint rejects User-role keys with `403`.

## 2. React quick start

```tsx
import { TurboSignForm } from '@turbodocx/embed/react';

function SignStep({ embedUrl }: { embedUrl: string }) {
  return (
    <TurboSignForm
      embedUrl={embedUrl}
      origin="https://app.turbodocx.com"
      height={720}
      onCompleted={({ documentId }) => console.log('Signed', documentId)}
    />
  );
}
```

### Props

| Prop | Type | Required | Description |
|---|---|---|---|
| `embedUrl` | `string` | yes | The per-recipient embed URL from the SDK. |
| `origin` | `string \| null` | yes, in practice | The exact origin the signing page is served from, e.g. `"https://app.turbodocx.com"`. Without it every message is ignored (see [Security](#security)). |
| `onCompleted` | `(result) => void` | yes | Called when the signer finishes. See [Completion payload](#completion-payload). |
| `onDeclined` | `(result) => void` | no | Reserved: not emitted by the product yet. |
| `onError` | `(result) => void` | no | Reserved: not emitted by the product yet. |
| `height` | `string \| number` | no | CSS length, or a number (or numeric string) of pixels. Defaults to `720px`. |
| `title` | `string` | no | The iframe's accessible name. Defaults to `"TurboSign signing"`. |
| `allowAnyOrigin` | `boolean` | no | Development only. See [Security](#security). Defaults to `false`. |
| `className` | `string` | no | Class name for the iframe. |
| `style` | `CSSProperties` | no | Inline styles merged onto the iframe after the width/height/border defaults. |

The component renders a full-width iframe with `allow="clipboard-write"`. The window listener is wired
in a `useEffect` with cleanup on unmount (React 18+ compatible).

### Completion payload

`onCompleted` (and the web component's `turbosign:completed` event `detail`) receives:

| Field | Value |
|---|---|
| `documentId` | The signing document's id, when the page included it. |
| `status` | `"completed"`. |
| `event` | `"signing_complete"` when the signer just finished, or `"already_signed"` when they reopened a link they had already completed. Use it to skip one-time "thanks for signing" side effects. |
| `scope` | `"recipient"`: THIS signer's step finished. On a multi-signer document others may still be pending, so read the document's status server-side (or watch the `completed` webhook) for the whole document. |

## 3. Web component (no React, any framework)

`<turbosign-form>` is a custom element. No build step is needed to use it: load the built ES module
with a `<script type="module">` and drop the tag in your HTML.

```html
<script type="module" src="/path/to/@turbodocx/embed/dist/index.js"></script>

<turbosign-form
  embed-url="https://app.turbodocx.com/e-signature/embed/DOCUMENT_ID?token=..."
  origin="https://app.turbodocx.com"
  height="720"
></turbosign-form>

<script>
  const form = document.querySelector('turbosign-form');
  form.addEventListener('turbosign:completed', (event) => {
    console.log('Signed. documentId =', event.detail.documentId);
  });
</script>
```

| Attribute | Required | Description |
|---|---|---|
| `embed-url` | yes | The per-recipient embed URL from the SDK. |
| `origin` | yes, in practice | The exact TurboSign origin. Without it every message is ignored (see [Security](#security)). |
| `height` | no | A CSS length or a bare number of pixels. Defaults to `720px`. |
| `title` | no | The iframe's accessible name. Defaults to `TurboSign signing`. As a global attribute it also gives the host element a native tooltip. |
| `allow-any-origin` | no | Development only boolean attribute, enabled by its presence. See [Security](#security). |

The element renders a full-width iframe with `allow="clipboard-write"`, re-emits `turbosign:completed`
(and the reserved `turbosign:declined` / `turbosign:error`) as bubbling `CustomEvent`s, and removes its
window listener when disconnected.

The element auto-registers on import. To register under a different tag name, import
`defineTurboSignForm` and call `defineTurboSignForm('my-tag')`.

## 4. Pure handler (advanced)

Both components are thin shells over `handleTurboSignMessage`, a pure, framework-agnostic function that
decides what a `postMessage` from the signing page means (origin pinning, optional source pinning, and
dispatch). Use it directly if you want to keep your own iframe and listener:

```ts
import { handleTurboSignMessage } from '@turbodocx/embed';

const iframe = document.querySelector('iframe#signing') as HTMLIFrameElement;

window.addEventListener('message', (event) => {
  handleTurboSignMessage(event, {
    expectedOrigin: 'https://app.turbodocx.com',
    expectedSource: iframe.contentWindow,
    onCompleted: ({ documentId }) => console.log('Signed', documentId),
  });
});
```

Options: `expectedOrigin`, `expectedSource`, `allowAnyOrigin`, `onCompleted`, `onDeclined`, `onError`.
Unrelated messages are ignored silently, so it is safe to call for every window message. It is also
exported from `@turbodocx/embed/react`.

## Security

### Origin pinning

The signing page posts its completion message to the parent, targeting your origin when it can resolve
it and falling back to `targetOrigin: '*'` when it cannot. Your app must therefore verify `event.origin`
before trusting the message. Every entry point in this package takes an `origin` / `expectedOrigin` and
ignores messages from anywhere else.

**It fails closed.** If you omit the origin (leave it `null`, `undefined`, or an empty string), EVERY
message is ignored, so `turbosign:completed` never fires. The components log a one-time
`console.warn` when that happens. Pin it to your known TurboSign origin (for example
`https://app.turbodocx.com`).

### Source pinning

The components also check that each message comes from their own iframe
(`event.source === iframe.contentWindow`), so another window on the same origin cannot forge a
completion either. If you use the pure handler with your own iframe, pass that iframe's
`contentWindow` as `expectedSource` to get the same check.

### `allowAnyOrigin` is for local development only

To accept messages from any origin, opt out explicitly with `allowAnyOrigin` (React prop and handler
option) or the `allow-any-origin` attribute. This FAILS OPEN: any other frame on your page could forge a
`turbosign:completed`. Never ship it to production. When an origin is also set, the origin wins and the
opt-out is ignored.

### Allowed embedding domains

The browser only renders the signing page on origins your org admin has allow-listed under
"Allowed embedding domains" (empty list = framing denied everywhere).

## Example

See the runnable [`examples/embedded-web-app`](https://github.com/TurboDocx/SDK/tree/main/examples/embedded-web-app).
Its **Widget** path uses `<TurboSignForm>`, alongside the raw-iframe and sequential-kiosk paths.

## Changelog

> **0.2.1:** README only. Adds the TurboDocx header and reorganizes the docs (React first). No code changes.

> **Changed in 0.2.0:** earlier versions accepted messages from any origin when no origin was set.
> 0.2.0 ignores them instead, checks the message source, and adds the `title` prop / attribute. If you
> relied on the old behavior during development, add `allowAnyOrigin` / `allow-any-origin`.

## License

MIT. See [LICENSE](./LICENSE).

---

<div align="center">

[![TurboDocx](https://raw.githubusercontent.com/TurboDocx/SDK/main/packages/js-sdk/footer.png)](https://www.turbodocx.com)

</div>
