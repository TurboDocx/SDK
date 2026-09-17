/**
 * Example host web-app: "Northwind Mutual" embeds TurboSign signing inside its own page.
 *
 * This is the INTEGRATOR'S side of embedded signing — a fake customer app that puts the TurboSign
 * signing page in an <iframe> instead of emailing a signing link. It has two halves:
 *
 *   1. This tiny server (Node, no framework) holds your TurboDocx API key and mints an embeddable
 *      signing URL with the SDK. The API key stays SERVER-SIDE — never ship it to the browser.
 *   2. public/index.html is the host page: it fetches the URL from this server, frames it, and
 *      listens for the `turbosign:completed` postMessage the signing page sends when the signer is
 *      done. (See public/index.html.)
 *
 * IMPORTANT — the org must allow-list THIS app's origin. Embedded signing is default-deny: the
 * browser will refuse to render the iframe unless the signer's org lists this app's origin
 * (e.g. http://localhost:4000) in its embedded-signing "allowed origins". Set that in the TurboDocx
 * E-Signature settings (Identity & embedding tab) or via the org preferences API. Without it you'll
 * see a blank/refused frame — that's the clickjacking protection working, not a bug.
 *
 * Run:
 *   TURBODOCX_API_KEY=... TURBODOCX_ORG_ID=... TURBODOCX_SENDER_EMAIL=you@co.com \
 *   DEMO_DOCUMENT_ID=... DEMO_RECIPIENT_ID=... \
 *   npx tsx examples/embedded-web-app/server.ts
 * then open http://localhost:4000
 */
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

import { TurboSign } from '@turbodocx/sdk';

const HERE = dirname(fileURLToPath(import.meta.url));
const PORT = Number(process.env.PORT || 4000);
const ORIGIN = `http://localhost:${PORT}`;

TurboSign.configure({
  apiKey: process.env.TURBODOCX_API_KEY || 'your-api-key-here',
  orgId: process.env.TURBODOCX_ORG_ID || 'your-org-id-here',
  senderEmail: process.env.TURBODOCX_SENDER_EMAIL || 'support@yourcompany.com',
  senderName: process.env.TURBODOCX_SENDER_NAME || 'Northwind Mutual',
});

// The document + recipient you want the signer to sign. In a real app these come from your own
// records (you created the document earlier and know which recipient is signing now).
const DOCUMENT_ID = process.env.DEMO_DOCUMENT_ID || '';
const RECIPIENT_ID = process.env.DEMO_RECIPIENT_ID || '';
// Optional: select the recipient by YOUR own key instead of TurboDocx's recipient id.
const EXTERNAL_ID = process.env.DEMO_EXTERNAL_ID || '';

/** Mint a fresh embeddable signing URL for this signer. Called by the host page's fetch. */
async function mintSigningUrl(): Promise<{ url: string; mode: string | null }> {
  if (!DOCUMENT_ID || (!RECIPIENT_ID && !EXTERNAL_ID)) {
    throw new Error('Set DEMO_DOCUMENT_ID and DEMO_RECIPIENT_ID (or DEMO_EXTERNAL_ID) in the environment.');
  }
  const link = await TurboSign.createSigningUrl(DOCUMENT_ID, {
    // Pass exactly one selector — recipientId OR externalId.
    ...(RECIPIENT_ID ? { recipientId: RECIPIENT_ID } : { externalId: EXTERNAL_ID }),
    // After signing, the page bounces here; the host also learns completion via postMessage below.
    returnUrl: `${ORIGIN}/signed`,
    // A plain embedded recipient signs directly. To require a step-up first, uncomment one:
    // identityVerification: { mode: 'otp', channel: 'email' },
    // identityVerification: { mode: 'external_idv', provider: 'CAPA' },
  });
  return { url: link.url, mode: link.identityVerificationMode ?? null };
}

const server = createServer(async (req, res) => {
  try {
    const url = new URL(req.url || '/', ORIGIN);

    // The host page mints a URL from its own backend so the API key stays server-side.
    if (url.pathname === '/api/signing-url') {
      const { url: signingUrl, mode } = await mintSigningUrl();
      res.writeHead(200, { 'content-type': 'application/json' });
      res.end(JSON.stringify({ url: signingUrl, mode }));
      return;
    }

    // Everything else serves the single host page.
    const html = await readFile(join(HERE, 'public', 'index.html'), 'utf8');
    res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' });
    res.end(html);
  } catch (err) {
    res.writeHead(500, { 'content-type': 'application/json' });
    res.end(JSON.stringify({ error: err instanceof Error ? err.message : String(err) }));
  }
});

server.listen(PORT, () => {
  console.log(`\nNorthwind Mutual (embedded-signing demo) running at ${ORIGIN}`);
  console.log(
    `\n>> Before the iframe will render, allow-list this origin in the signer's org:\n     ${ORIGIN}\n   (TurboDocx E-Signature settings -> Identity & embedding -> Allowed origins.)\n`,
  );
});
