# Embedded signing, the WIDGET way (`<turbosign-form>`)

A host web-app ("Northwind Mutual") that embeds TurboSign signing using the
[`@turbodocx/embed`](../../packages/embed) widget instead of a hand-rolled iframe. It is the same flow
as [`embedded-web-app`](../embedded-web-app) (collect name + email, email OTP identity check, mint the
signing URL server-side, complete via the `turbosign:completed` postMessage) with one difference: the
host page drops a `<turbosign-form>` custom element and listens for a DOM event, so there is no iframe
markup and no `window.addEventListener('message', ...)` with an origin check in the page.

## Raw iframe vs widget

- [`embedded-web-app`](../embedded-web-app) shows the **raw** approach: the page writes its own
  `<iframe>` and its own message listener with the origin check.
- **This example** shows the **widget**: `@turbodocx/embed` does the iframe, the origin pinning, and the
  event plumbing for you. Use this in real apps.

## Run it

```bash
# 1. From the repo root, build the widget so the demo can serve it (no bundler needed):
npm run build -w @turbodocx/embed

# 2. Configure and start this example:
cd examples/embedded-web-app-widget
cp .env.example .env   # then fill in your TurboDocx credentials
npx tsx server.ts
# open http://localhost:4100
```

Prerequisites:

- `@turbodocx/sdk` installed (this repo's workspace provides it) and `@turbodocx/embed` **built**.
- Your app's origin (`http://localhost:4100` for this demo) must be allow-listed in the signer's org
  under E-Signature settings -> Identity & embedding -> Allowed origins. Embedded signing is default-deny
  on `frame-ancestors`; without the allow-list the browser refuses to render the iframe. (Production
  embedders must be https; `http://localhost` is a dev-only override.)

## How the widget is used (this example, plain HTML)

```html
<script type="module" src="/embed/index.js"></script>
...
<turbosign-form embed-url="<minted-url>" origin="https://app.turbodocx.com" height="720"></turbosign-form>
<script>
  document.querySelector('turbosign-form')
    .addEventListener('turbosign:completed', (e) => console.log('signed', e.detail.documentId));
</script>
```

Pin `origin` to your TurboSign origin in production. The signing page posts its completion message with
`targetOrigin: '*'`, so without an origin check any frame could forge completion (the widget skips the
check only when `origin` is unset, which fails open and is for local development only).

## React usage (for reference)

If your host app is React, use the component from the `@turbodocx/embed/react` subpath instead. React
is a peer dependency (not bundled). This snippet documents the React path; the runnable demo above uses
the web component.

```tsx
import { useState } from 'react';
import { TurboSignForm } from '@turbodocx/embed/react';

export function SignPolicy() {
  const [embedUrl, setEmbedUrl] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function start(name: string, email: string) {
    // Your server mints the URL with TurboSign.createEmbeddedSignature (API key stays server-side).
    const res = await fetch('/api/start', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ name, email }),
    });
    const { url } = await res.json();
    setEmbedUrl(url);
  }

  if (done) return <p>All set. Your policy is signed.</p>;
  if (!embedUrl) return <button onClick={() => start('Alex Rivera', 'alex@example.com')}>Start signing</button>;

  return (
    <TurboSignForm
      embedUrl={embedUrl}
      origin="https://app.turbodocx.com"
      height={720}
      onCompleted={({ documentId }) => {
        console.log('signed', documentId);
        setDone(true);
      }}
    />
  );
}
```
