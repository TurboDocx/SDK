# @turbodocx/embed

The TurboSign embedded-signing widget. It frames a per-recipient `embedUrl` (from
`TurboSign.createEmbeddedSignature`), pins the message origin, and surfaces the
`turbosign:completed` event, so you do not have to hand-roll an iframe plus a
`window.addEventListener('message', ...)` listener in every app.

Ships three things:

1. **`handleTurboSignMessage`** - a pure, framework-agnostic function that decides what a
   `postMessage` from the signing page means (origin pinning, optional source pinning + dispatch). This is the load-bearing
   logic; the two components below are thin shells over it.
2. **`<turbosign-form>`** - a custom element (web component). No build step needed to use it: load the
   built ES module with a `<script type="module">` and drop the tag in your HTML.
3. **`<TurboSignForm>`** - a React component, exported from the `@turbodocx/embed/react` subpath. React
   is a `peerDependency` and is never bundled.

## Why origin pinning matters

The signing page posts its completion message to the parent, targeting your origin when it can resolve
it and falling back to `targetOrigin: '*'` when it cannot. Your app must therefore verify `event.origin`
before trusting the message. Every entry point in this package takes an `origin` / `expectedOrigin` and
ignores messages from anywhere else.

**It fails closed.** If you omit the origin (leave it `null`, `undefined`, or an empty string), EVERY
message is ignored, so `turbosign:completed` never fires. The components log a one-time
`console.warn` when that happens. Pin it to your known TurboSign origin (for example
`https://app.turbodocx.com`).

The components also check that each message comes from their own iframe
(`event.source === iframe.contentWindow`), so another window on the same origin cannot forge a
completion either. If you use the pure handler with your own iframe, pass that iframe's
`contentWindow` as `expectedSource` to get the same check.

**Local development only:** to accept messages from any origin, opt out explicitly with
`allowAnyOrigin` (React prop and handler option) or the `allow-any-origin` attribute. This FAILS OPEN:
any other frame on your page could forge a `turbosign:completed`. Never ship it to production. When an
origin is also set, the origin wins and the opt-out is ignored.

> **Changed in 0.2.0:** earlier versions accepted messages from any origin when no origin was set.
> 0.2.0 ignores them instead, checks the message source, and adds the `title` prop / attribute. If you
> relied on the old behavior during development, add `allowAnyOrigin` / `allow-any-origin`.

## Install

```bash
npm install @turbodocx/embed
# For the React component, also have React 18+ installed (peer dependency):
npm install react
```

## Web component (framework-agnostic)

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

Attributes: `embed-url` (required), `origin` (required for messages to be delivered; see above),
`height` (optional, a CSS length or a bare number of pixels; defaults to `720px`), `title` (optional,
the iframe's accessible name; defaults to `TurboSign signing`; as a global attribute it also gives the
host element a native tooltip), and `allow-any-origin` (dev-only boolean attribute, enabled by its
presence). The element renders a full-width iframe with
`allow="clipboard-write"`, re-emits `turbosign:completed` (and the reserved `turbosign:declined` /
`turbosign:error`) as bubbling `CustomEvent`s, and removes its window listener when disconnected.

The element auto-registers on import. To register under a different tag name, import
`defineTurboSignForm` and call `defineTurboSignForm('my-tag')`.

## React component

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

Props: `embedUrl` (required), `origin?` (required for messages to be delivered; see above),
`onCompleted` (required), `onDeclined?`, `onError?`, `height?`, `title?` (the iframe's accessible name;
defaults to `"TurboSign signing"`), `allowAnyOrigin?` (dev only), `className?`, `style?`. The window listener is wired in a `useEffect` with cleanup on
unmount (React 18+ compatible).

## What a completion tells you

`onCompleted` (and the web component's `turbosign:completed` event `detail`) receives:

| Field | Value |
|---|---|
| `documentId` | The signing document's id, when the page included it. |
| `status` | `"completed"`. |
| `event` | `"signing_complete"` when the signer just finished, or `"already_signed"` when they reopened a link they had already completed. Use it to skip one-time "thanks for signing" side effects. |
| `scope` | `"recipient"`: THIS signer's step finished. On a multi-signer document others may still be pending, so read the document's status server-side (or watch the `completed` webhook) for the whole document. |

Use `embedUrl` exactly as the SDK returns it (`createSigningUrl` / `createEmbeddedSignature`); it is an
`/e-signature/embed/...` URL. The browser only renders it on origins your org admin has allow-listed
under "Allowed embedding domains" (empty list = framing denied everywhere).

## Pure handler (advanced)

Use it directly if you want to keep your own iframe and listener:

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

## Getting the `embedUrl`

Mint it server-side with the SDK (your API key stays on the server):

```ts
import { TurboSign } from '@turbodocx/sdk';

const { recipients } = await TurboSign.createEmbeddedSignature({
  file: pdfBuffer,
  documentName: 'Auto Policy',
  recipients: [{ name, email, auth: { emailOtp: true }, fields: { signature: '{signature1}' } }],
});
const embedUrl = recipients[0].embedUrl;
```

See the runnable [`examples/embedded-web-app`](https://github.com/TurboDocx/SDK/tree/main/examples/embedded-web-app).
Its **Widget** path uses `<TurboSignForm>`, alongside the raw-iframe and sequential-kiosk paths.

## License

MIT
