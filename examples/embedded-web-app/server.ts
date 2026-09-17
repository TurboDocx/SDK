/**
 * Example host web-app: "Northwind Mutual" embeds TurboSign signing inside its own page, with the
 * signer's EMAIL collected in the host UI and EMAIL OTP as the identity check.
 *
 * The integrator's side of embedded signing, end to end:
 *   1. The host page collects the signer's name + email (public/index.html).
 *   2. This server (no framework) holds the TurboDocx API key and, per request, creates a signing
 *      document for that email with `identityVerification: { mode: 'otp', channel: 'email' }`, then
 *      mints an embeddable signing URL with the SDK. The API key stays SERVER-SIDE.
 *   3. The host frames the URL. Inside the iframe TurboSign emails a 6-digit code to the signer, they
 *      verify it, then sign. On completion the signing page posts `turbosign:completed` to the parent.
 *   4. The COMPLETED SIGNED COPY is emailed to that same recipient email (plus any CC configured on the
 *      document, plus a completion notification to the sender).
 *
 * IMPORTANT — the org must allow-list THIS app's origin (default-deny frame-ancestors). For this demo
 * add `http://localhost:4000` to the org's embedded-signing allowed origins (dev-only http override;
 * production embedders must be https). Without it the browser refuses to render the iframe.
 *
 * Run (from this example's directory, with @turbodocx/sdk installed):
 *   cd examples/embedded-web-app
 *   cp .env.example .env   # then fill in your credentials
 *   npx tsx server.ts
 * then open http://localhost:4000
 *
 * Config is loaded from `.env` via `dotenv/config` (imported first, below). Running from this
 * directory matters: dotenv reads `.env` from the current working directory.
 */
import 'dotenv/config';

import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

import { TurboSign } from '@turbodocx/sdk';

const HERE = dirname(fileURLToPath(import.meta.url));
const PORT = Number(process.env.PORT || 4000);
const ORIGIN = `http://localhost:${PORT}`;
// A PDF with signature/date anchors ({signature1}, {date1}). Ships with the SDK (repo ExampleAssets).
const PDF_PATH = fileURLToPath(new URL('../../ExampleAssets/sample-contract.pdf', import.meta.url));

TurboSign.configure({
  apiKey: process.env.TURBODOCX_API_KEY || 'your-api-key-here',
  orgId: process.env.TURBODOCX_ORG_ID || 'your-org-id-here',
  senderEmail: process.env.TURBODOCX_SENDER_EMAIL || 'support@yourcompany.com',
  senderName: process.env.TURBODOCX_SENDER_NAME || 'Northwind Mutual',
  // Point at your API if not the default (e.g. a local backend during development).
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

/** Create a document for this signer (email OTP) and mint the embeddable signing URL. */
async function startSigning(name: string, email: string): Promise<{ url: string; mode: string | null }> {
  const pdf = await readFile(PDF_PATH);

  // Create + send the document with ONE recipient who must clear an EMAIL OTP before signing.
  const sent = await TurboSign.sendSignature({
    file: pdf,
    documentName: `Northwind Auto Policy - ${name}`,
    recipients: [
      {
        name,
        email, // <-- collected in the UI; the completed copy is emailed here
        signingOrder: 1,
        identityVerification: { mode: 'otp', channel: 'email' }, // email OTP step-up before signing
      },
    ],
    fields: [
      { type: 'signature', recipientEmail: email, template: { anchor: '{signature1}', placement: 'replace', size: { width: 100, height: 30 } } },
      { type: 'date', recipientEmail: email, template: { anchor: '{date1}', placement: 'replace', size: { width: 75, height: 30 } } },
    ],
  });

  // Mint the embeddable URL for that recipient. `identityVerificationMode` comes back as 'otp'.
  const link = await TurboSign.createSigningUrl(sent.documentId, {
    recipientId: sent.recipients[0].id,
    // returnUrl must be an https URL. Include it only when this host is served over https (production);
    // running locally over http, rely on the turbosign:completed postMessage for completion instead.
    ...(ORIGIN.startsWith('https://') ? { returnUrl: `${ORIGIN}/signed` } : {}),
  });
  return { url: link.url, mode: link.identityVerificationMode ?? null };
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
    `\n>> Allow-list this origin in the signer's org first, or the iframe will be blocked:\n     ${ORIGIN}\n   (TurboDocx E-Signature settings -> Identity & embedding -> Allowed origins.)\n`,
  );
});
