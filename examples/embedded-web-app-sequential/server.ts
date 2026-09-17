/**
 * Example host web-app: an in-person KIOSK where MULTIPLE people sign the SAME document in order,
 * one after another on the same device (think a dealership desk, a clinic check-in, a closing table).
 *
 * This is the SEQUENTIAL / turn-aware side of embedded signing:
 *   1. The host creates ONE document with several recipients in `signingOrder` and calls
 *      `createEmbeddedSignature`. Because signing is sequential, the backend only mints a URL for the
 *      signer whose turn it is: recipient #1 comes back `status: 'ready'` (with `embedUrl`), everyone
 *      after them comes back `status: 'pending'` with `embedUrl: null`.
 *   2. The host frames the ready signer's URL. When they finish, the signing page posts
 *      `turbosign:completed` to the parent.
 *   3. The host asks this server to mint the NEXT signer's URL (`/api/next` -> `createSigningUrl`),
 *      swaps the iframe, and hands the device to the next person. Repeat until the roster is done.
 *
 * The API key stays SERVER-SIDE the whole time; the browser only ever gets embed URLs.
 *
 * IMPORTANT — the org must allow-list THIS app's origin (default-deny frame-ancestors). For this demo
 * add `http://localhost:4100` to the org's embedded-signing allowed origins (dev-only http override;
 * production embedders must be https). Without it the browser refuses to render the iframe.
 *
 * Run (from this example's directory, with @turbodocx/sdk installed):
 *   cd examples/embedded-web-app-sequential
 *   cp .env.example .env   # then fill in your credentials
 *   npx tsx server.ts
 * then open http://localhost:4100
 */
import 'dotenv/config';

import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

import { TurboSign } from '@turbodocx/sdk';

const HERE = dirname(fileURLToPath(import.meta.url));
const PORT = Number(process.env.PORT || 4100);
const ORIGIN = `http://localhost:${PORT}`;
// A PDF with two signature anchors ({signature1}, {signature2}). Ships with the SDK (repo ExampleAssets).
const PDF_PATH = fileURLToPath(new URL('../../ExampleAssets/sample-contract.pdf', import.meta.url));

TurboSign.configure({
  apiKey: process.env.TURBODOCX_API_KEY || 'your-api-key-here',
  orgId: process.env.TURBODOCX_ORG_ID || 'your-org-id-here',
  senderEmail: process.env.TURBODOCX_SENDER_EMAIL || 'support@yourcompany.com',
  senderName: process.env.TURBODOCX_SENDER_NAME || 'Kiosk Demo',
  ...(process.env.TURBODOCX_API_URL ? { baseUrl: process.env.TURBODOCX_API_URL } : {}),
});

async function readBody(req: import('node:http').IncomingMessage): Promise<Record<string, unknown>> {
  const chunks: Buffer[] = [];
  for await (const c of req) chunks.push(c as Buffer);
  try {
    return JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}');
  } catch {
    return {};
  }
}

/**
 * Create ONE document for two in-order signers and mint whatever URLs the backend will give us now.
 * Returns the documentId plus the full roster: the in-turn signer carries an embedUrl, the rest are
 * `pending` (embedUrl: null) — the host mints those later via /api/next as each signer finishes.
 */
async function startSigning(signers: Array<{ name: string; email: string }>) {
  const pdf = await readFile(PDF_PATH);

  const { documentId, recipients } = await TurboSign.createEmbeddedSignature({
    file: pdf,
    documentName: 'Kiosk Purchase Agreement',
    // Two signers, explicit order. Each signs their own anchor. Email OTP as the identity check.
    recipients: signers.map((s, i) => ({
      name: s.name,
      email: s.email,
      signingOrder: i + 1,
      auth: { emailOtp: true },
      fields: { signature: `{signature${i + 1}}` },
    })),
  });

  return { documentId, recipients };
}

const server = createServer(async (req, res) => {
  try {
    const url = new URL(req.url || '/', ORIGIN);

    if (url.pathname === '/api/start' && req.method === 'POST') {
      const body = await readBody(req);
      const signers = Array.isArray(body.signers) ? (body.signers as Array<{ name: string; email: string }>) : [];
      const clean = signers.map((s) => ({ name: String(s.name || '').trim(), email: String(s.email || '').trim() }));
      if (clean.length < 2 || clean.some((s) => !s.name || !s.email)) {
        res.writeHead(400, { 'content-type': 'application/json' });
        res.end(JSON.stringify({ error: 'Provide at least two signers, each with a name and email.' }));
        return;
      }
      const result = await startSigning(clean);
      res.writeHead(200, { 'content-type': 'application/json' });
      res.end(JSON.stringify(result));
      return;
    }

    // Mint the URL for the next signer once the previous one has finished. The host calls this with the
    // documentId + the pending recipientId; if it's genuinely their turn now, createSigningUrl succeeds.
    if (url.pathname === '/api/next' && req.method === 'POST') {
      const body = await readBody(req);
      const documentId = String(body.documentId || '').trim();
      const recipientId = String(body.recipientId || '').trim();
      if (!documentId || !recipientId) {
        res.writeHead(400, { 'content-type': 'application/json' });
        res.end(JSON.stringify({ error: 'documentId and recipientId are required.' }));
        return;
      }
      const link = await TurboSign.createSigningUrl(documentId, { recipientId });
      res.writeHead(200, { 'content-type': 'application/json' });
      res.end(JSON.stringify({ url: link.url, identityVerificationMode: link.identityVerificationMode }));
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
  console.log(`\nKiosk (sequential embedded-signing demo) running at ${ORIGIN}`);
  console.log(
    `\n>> Allow-list this origin in the signer's org first, or the iframe will be blocked:\n     ${ORIGIN}\n   (TurboDocx E-Signature settings -> Identity & embedding -> Allowed origins.)\n`,
  );
});
