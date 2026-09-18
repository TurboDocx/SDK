/**
 * Backend-for-frontend for the embedded-signing demo. This is the SECURE pattern real integrators use:
 *
 *     React SPA  ──/api/*──▶  THIS server (holds the API key)  ──▶  TurboDocx
 *
 * The browser never sees the API key and never calls TurboDocx directly. This server holds the key,
 * uses @turbodocx/sdk (via handlers.ts) to create documents and mint embeddable signing URLs, and
 * returns just those URLs to the SPA, which frames them (or hands them to <TurboSignForm>).
 *
 *   POST /api/single       { name, email }                   -> { url, mode }
 *   POST /api/kiosk/start  { signers: [{ name, email }, …] }  -> { documentId, recipients: [...] }
 *   POST /api/kiosk/next   { documentId, recipientId }        -> { url }
 *
 * Run (dev): `npm run server` here, and `npm run dev` in another terminal — Vite proxies /api to this.
 * Config comes from `.env` (see .env.example). The API key stays server-side.
 */
import "dotenv/config";

import { createServer, type IncomingMessage, type ServerResponse } from "node:http";

import { TurboSign } from "@turbodocx/sdk";

import { kioskNext, kioskStart, single } from "./handlers";

const PORT = Number(process.env.PORT || 4000);

TurboSign.configure({
  apiKey: process.env.TURBODOCX_API_KEY || "your-api-key-here",
  orgId: process.env.TURBODOCX_ORG_ID || "your-org-id-here",
  senderEmail: process.env.TURBODOCX_SENDER_EMAIL || "support@yourcompany.com",
  senderName: process.env.TURBODOCX_SENDER_NAME || "Embedded Signing Demo",
  ...(process.env.TURBODOCX_API_URL ? { baseUrl: process.env.TURBODOCX_API_URL } : {}),
});

async function readBody(req: IncomingMessage): Promise<Record<string, unknown>> {
  const chunks: Buffer[] = [];
  for await (const c of req) chunks.push(c as Buffer);
  try {
    return JSON.parse(Buffer.concat(chunks).toString("utf8") || "{}");
  } catch {
    return {};
  }
}

function send(res: ServerResponse, status: number, body: unknown) {
  res.writeHead(status, { "content-type": "application/json" });
  res.end(JSON.stringify(body));
}

const server = createServer(async (req, res) => {
  try {
    const url = new URL(req.url || "/", `http://localhost:${PORT}`);
    if (req.method !== "POST" || !url.pathname.startsWith("/api/")) {
      return send(res, 404, { error: "Not found. POST /api/single, /api/kiosk/start, or /api/kiosk/next." });
    }
    const body = await readBody(req);

    if (url.pathname === "/api/single") {
      const name = String(body.name || "").trim();
      const email = String(body.email || "").trim();
      if (!name || !email) return send(res, 400, { error: "name and email are required." });
      return send(res, 200, await single({ name, email }));
    }

    if (url.pathname === "/api/kiosk/start") {
      const raw = Array.isArray(body.signers) ? (body.signers as Array<{ name: string; email: string }>) : [];
      const signers = raw.map((s) => ({ name: String(s.name || "").trim(), email: String(s.email || "").trim() }));
      if (signers.length < 2 || signers.some((s) => !s.name || !s.email)) {
        return send(res, 400, { error: "Provide at least two signers, each with a name and email." });
      }
      return send(res, 200, await kioskStart(signers));
    }

    if (url.pathname === "/api/kiosk/next") {
      const documentId = String(body.documentId || "").trim();
      const recipientId = String(body.recipientId || "").trim();
      if (!documentId || !recipientId) return send(res, 400, { error: "documentId and recipientId are required." });
      return send(res, 200, await kioskNext({ documentId, recipientId }));
    }

    return send(res, 404, { error: "Unknown endpoint." });
  } catch (err) {
    return send(res, 500, { error: err instanceof Error ? err.message : String(err) });
  }
});

server.listen(PORT, () => {
  console.log(`\nEmbedded-signing demo API on http://localhost:${PORT} (holds the API key; call it from the SPA via /api/*)`);
});
