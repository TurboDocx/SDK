/**
 * Example host web-app: "Northwind Mutual" embeds TurboSign signing using the WIDGET instead of a
 * hand-rolled iframe. This is the same flow as `examples/embedded-web-app`, but the host page uses the
 * framework-agnostic `<turbosign-form>` web component from `@turbodocx/embed` rather than writing its
 * own iframe + `window.addEventListener('message', ...)` with an origin check.
 *
 * The integrator's side, end to end:
 *   1. The host page collects the signer's name + email (public/index.html).
 *   2. This server (no framework) holds the TurboDocx API key and, per request, creates a signing
 *      document for that email with email OTP, then mints an embeddable signing URL with the SDK. The
 *      API key stays SERVER-SIDE.
 *   3. The host drops `<turbosign-form embed-url="..." origin="...">` on the page. The web component
 *      renders the iframe, pins the origin, and emits a `turbosign:completed` DOM CustomEvent when the
 *      signer finishes. No message-listener boilerplate in the host page.
 *
 * This server also SERVES the built web component (the `@turbodocx/embed` ESM `dist/`) under `/embed/`,
 * so the demo runs with no bundler. Build the package first:
 *   npm run build -w @turbodocx/embed
 *
 * IMPORTANT - the org must allow-list THIS app's origin (default-deny frame-ancestors). For this demo
 * add `http://localhost:4100` to the org's embedded-signing allowed origins (dev-only http override;
 * production embedders must be https). Without it the browser refuses to render the iframe.
 *
 * Run (from this example's directory, with @turbodocx/sdk installed and @turbodocx/embed built):
 *   cd examples/embedded-web-app-widget
 *   cp .env.example .env   # then fill in your credentials
 *   npx tsx server.ts
 * then open http://localhost:4100
 */
import 'dotenv/config';

import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join, extname, normalize } from 'node:path';

import { TurboSign } from '@turbodocx/sdk';

const HERE = dirname(fileURLToPath(import.meta.url));
const PORT = Number(process.env.PORT || 4100);
const ORIGIN = `http://localhost:${PORT}`;
// A PDF with signature/date anchors ({signature1}, {date1}). Ships with the SDK (repo ExampleAssets).
const PDF_PATH = fileURLToPath(new URL('../../ExampleAssets/sample-contract.pdf', import.meta.url));
// The built web component (ESM). Served under /embed/ so index.html can <script type="module"> it.
const EMBED_DIST = fileURLToPath(new URL('../../packages/embed/dist/', import.meta.url));

TurboSign.configure({
  apiKey: process.env.TURBODOCX_API_KEY || 'your-api-key-here',
  orgId: process.env.TURBODOCX_ORG_ID || 'your-org-id-here',
  senderEmail: process.env.TURBODOCX_SENDER_EMAIL || 'support@yourcompany.com',
  senderName: process.env.TURBODOCX_SENDER_NAME || 'Northwind Mutual',
  // Point at your API if not the default (e.g. a local backend during development).
  ...(process.env.TURBODOCX_API_URL ? { baseUrl: process.env.TURBODOCX_API_URL } : {}),
});

/** Content type for the static files this demo serves out of the built @turbodocx/embed dist. */
function contentTypeFor(file: string): string {
  const ext = extname(file);
  if (ext === '.js' || ext === '.mjs') return 'text/javascript; charset=utf-8';
  if (ext === '.map') return 'application/json; charset=utf-8';
  return 'application/octet-stream';
}

async function readBody(req: import('node:http').IncomingMessage): Promise<Record<string, unknown>> {
  const chunks: Buffer[] = [];
  for await (const c of req) chunks.push(c as Buffer);
  try {
    return JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}');
  } catch {
    return {};
  }
}

/** Create a document for this signer (email OTP) and mint the embeddable signing URL. */
async function startSigning(name: string, email: string): Promise<{ url: string; mode: string | null }> {
  const pdf = await readFile(PDF_PATH);

  // ONE call: create + send the document for a single recipient who must clear an EMAIL OTP before
  // signing, and mint the embeddable signing URL for them.
  const { recipients } = await TurboSign.createEmbeddedSignature({
    file: pdf,
    documentName: `Northwind Auto Policy - ${name}`,
    recipients: [{ name, email, auth: { emailOtp: true }, fields: { signature: '{signature1}', date: '{date1}' } }],
    // returnUrl must be an https URL. Include it only when this host is served over https (production);
    // running locally over http, rely on the turbosign:completed postMessage for completion instead.
    ...(ORIGIN.startsWith('https://') ? { returnUrl: `${ORIGIN}/signed` } : {}),
  });
  return { url: recipients[0].embedUrl, mode: recipients[0].identityVerificationMode };
}

const server = createServer(async (req, res) => {
  try {
    const url = new URL(req.url || '/', ORIGIN);

    if (url.pathname === '/api/start' && req.method === 'POST') {
      const body = await readBody(req);
      const name = String(body.name || '').trim();
      const email = String(body.email || '').trim();
      if (!name || !email) {
        res.writeHead(400, { 'content-type': 'application/json' });
        res.end(JSON.stringify({ error: 'Name and email are required.' }));
        return;
      }
      const result = await startSigning(name, email);
      res.writeHead(200, { 'content-type': 'application/json' });
      res.end(JSON.stringify(result));
      return;
    }

    // Serve the built @turbodocx/embed ES module (and its relative .js imports) under /embed/.
    if (url.pathname.startsWith('/embed/')) {
      const rel = url.pathname.slice('/embed/'.length);
      // Guard against path traversal: only allow simple file names inside the dist directory.
      if (!/^[A-Za-z0-9._-]+$/.test(rel)) {
        res.writeHead(400).end('Bad request');
        return;
      }
      const filePath = normalize(join(EMBED_DIST, rel));
      if (!filePath.startsWith(EMBED_DIST)) {
        res.writeHead(403).end('Forbidden');
        return;
      }
      try {
        const buf = await readFile(filePath);
        res.writeHead(200, { 'content-type': contentTypeFor(filePath) });
        res.end(buf);
      } catch {
        res.writeHead(404, { 'content-type': 'text/plain' });
        res.end('Not found. Did you build the widget?  npm run build -w @turbodocx/embed');
      }
      return;
    }

    const html = await readFile(join(HERE, 'public', 'index.html'), 'utf8');
    res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' });
    res.end(html);
  } catch (err) {
    res.writeHead(500, { 'content-type': 'application/json' });
    res.end(JSON.stringify({ error: err instanceof Error ? err.message : String(err) }));
  }
});

server.listen(PORT, () => {
  console.log(`\nNorthwind Mutual (embedded-signing WIDGET demo) running at ${ORIGIN}`);
  console.log(
    `\n>> Build the widget first if you have not:  npm run build -w @turbodocx/embed` +
      `\n>> Allow-list this origin in the signer's org, or the iframe will be blocked:\n     ${ORIGIN}\n   (TurboDocx E-Signature settings -> Identity & embedding -> Allowed origins.)\n`,
  );
});
