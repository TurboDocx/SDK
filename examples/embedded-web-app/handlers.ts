/**
 * Server-side handlers for the embedded-signing demo. These hold no HTTP concerns and no key config —
 * they just call @turbodocx/sdk and shape the response — so they're unit-testable with the SDK mocked.
 * server.ts configures TurboSign and wires these to POST /api/* routes.
 */
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

import { TurboSign } from "@turbodocx/sdk";

// A PDF with signature/date anchors ({signature1}, {date1}, {signature2}). Ships with the SDK.
const PDF_PATH = fileURLToPath(new URL("../../ExampleAssets/sample-contract.pdf", import.meta.url));

export interface SingleResult {
  url: string;
  mode: "otp" | "external_idv" | "override" | null;
}

/** Path 1 — single signer with email OTP. Returns the minted embed URL. */
export async function single({ name, email }: { name: string; email: string }): Promise<SingleResult> {
  const pdf = await readFile(PDF_PATH);
  const { recipients } = await TurboSign.createEmbeddedSignature({
    file: pdf,
    fileName: "sample-contract.pdf",
    documentName: `Auto Policy - ${name}`,
    recipients: [{ name, email, auth: { emailOtp: true }, fields: { signature: "{signature1}", date: "{date1}" } }],
  });
  const r = recipients[0];
  if (!r.embedUrl) throw new Error(`Cannot start signing: recipient is ${r.status}.`);
  return { url: r.embedUrl, mode: r.identityVerificationMode };
}

export interface KioskSigner {
  recipientId: string;
  name: string;
  email: string;
  embedUrl: string | null;
  status: "ready" | "pending" | "completed";
}

/** Path 2 — sequential kiosk: create the document for all signers in order (turn-aware). */
export async function kioskStart(
  signers: Array<{ name: string; email: string }>,
): Promise<{ documentId: string; recipients: KioskSigner[] }> {
  const pdf = await readFile(PDF_PATH);
  const { documentId, recipients } = await TurboSign.createEmbeddedSignature({
    file: pdf,
    fileName: "sample-contract.pdf",
    documentName: "Kiosk Purchase Agreement",
    recipients: signers.map((s, i) => ({
      name: s.name,
      email: s.email,
      signingOrder: i + 1,
      auth: { emailOtp: true },
      fields: { signature: `{signature${i + 1}}` },
    })),
  });
  return {
    documentId,
    recipients: recipients.map((r) => ({
      recipientId: r.recipientId,
      name: r.name,
      email: r.email,
      embedUrl: r.embedUrl,
      status: r.status,
    })),
  };
}

/** Mint the next signer's URL once it's their turn. */
export async function kioskNext({
  documentId,
  recipientId,
}: {
  documentId: string;
  recipientId: string;
}): Promise<{ url: string }> {
  const link = await TurboSign.createSigningUrl(documentId, { recipientId });
  return { url: link.url };
}
