# @turbodocx/embed

The TurboSign embedded-signing widget. It frames a per-recipient `embedUrl` (from
`TurboSign.createEmbeddedSignature`), pins the message origin, and surfaces the
`turbosign:completed` event, so you do not have to hand-roll an iframe plus a
`window.addEventListener('message', ...)` listener in every app.

Ships three things:

1. **`handleTurboSignMessage`** - a pure, framework-agnostic function that decides what a
   `postMessage` from the signing page means (origin pinning + dispatch). This is the load-bearing
   logic; the two components below are thin shells over it.
2. **`<turbosign-form>`** - a custom element (web component). No build step needed to use it: load the
   built ES module with a `<script type="module">` and drop the tag in your HTML.
3. **`<TurboSignForm>`** - a React component, exported from the `@turbodocx/embed/react` subpath. React
   is a `peerDependency` and is never bundled.

## Why origin pinning matters

The signing page posts its completion message to the parent with `targetOrigin: '*'` (it does not know
your origin). Your app must therefore verify `event.origin` before trusting the message. Every entry
point in this package takes an `origin` / `expectedOrigin` and ignores messages from anywhere else.

If you omit the origin (leave it `null`, `undefined`, or an empty string) the check is skipped and
messages from ANY origin are accepted. That is a development convenience and it FAILS OPEN: another
frame on your page could forge a `turbosign:completed`. In production, always pin it to your known
TurboSign origin (for example `https://app.turbodocx.com`).

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
  embed-url="https://app.turbodocx.com/sign/RECIPIENT_EMBED_URL"
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

Attributes: `embed-url` (required), `origin` (recommended), `height` (optional, a CSS length or a bare
number of pixels; defaults to `720px`). The element renders a full-width iframe with
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

Props: `embedUrl` (required), `origin?`, `onCompleted` (required), `onDeclined?`, `onError?`,
`height?`, `className?`, `style?`. The window listener is wired in a `useEffect` with cleanup on
unmount (React 18+ compatible).

## Pure handler (advanced)

Use it directly if you want to keep your own iframe and listener:

```ts
import { handleTurboSignMessage } from '@turbodocx/embed';

window.addEventListener('message', (event) => {
  handleTurboSignMessage(event, {
    expectedOrigin: 'https://app.turbodocx.com',
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

See the runnable [`examples/embedded-web-app`](../../examples/embedded-web-app) — the **Widget** path uses
`<TurboSignForm>`, alongside the raw-iframe and sequential-kiosk paths.

## License

MIT
