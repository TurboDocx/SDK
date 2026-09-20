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

// The sample document never changes for the life of the process — read it once, not per request.
let pdfPromise: Promise<Buffer> | null = null;
function loadSamplePdf(): Promise<Buffer> {
  if (!pdfPromise) pdfPromise = readFile(PDF_PATH);
  return pdfPromise;
}

export interface SingleResult {
  url: string;
  mode: "otp" | "external_idv" | "override" | null;
}

/** Path 1 — single signer with email OTP. Returns the minted embed URL. */
export async function single({ name, email }: { name: string; email: string }): Promise<SingleResult> {
  const pdf = await loadSamplePdf();
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
  const pdf = await loadSamplePdf();
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

// SIMULATED identity provider. This demo does NOT talk to a real IdP: it fabricates the verification
// assertion below so you can see the no-passcode flow and how the assertion lands on the audit trail.
// In production this is your real IdP (SSO / KYC vendor), and you assert ITS real verification id.
// The name is deliberately "simulated-idp" so the simulation is evident even on the certificate/audit
// trail ("Identity Verified via simulated-idp"), not just in this UI.
const PROVIDER = "simulated-idp";

/** The fabricated assertion this demo sends in place of a real IdP's response. */
export interface SimulatedAssertion {
  provider: string;
  verificationId: string;
  verifiedAt: string;
  subjectEmail: string;
  /** How the (simulated) vendor verified the signer. */
  method?: "id_document" | "id_document_liveness" | "kba" | "database" | "sso" | "other";
  /** Free text describing the method; set when method is "other". */
  methodDetail?: string;
  /** Assurance level label, e.g. "ial2_aal2" | "eidas_substantial" | "eidas_high". */
  assuranceLevel?: string;
  /** The verified legal name the (simulated) vendor returned. */
  verifiedName?: string;
  /** An https link to the (simulated) vendor's verification record. */
  evidenceUrl?: string;
  /** True when the asserted subjectEmail differs from the signer's email and the check was bypassed. */
  overrideEmailMatching?: boolean;
}

/** The simulated verification the operator "ran" in the Identity Verification Simulator dialog. */
export interface SimulatedVerificationInput {
  verifiedName?: string;
  subjectEmail?: string;
  method?: SimulatedAssertion["method"];
  methodDetail?: string;
  assuranceLevel?: string;
  overrideEmailMatching?: boolean;
}

/** externalIdv also returns the simulated assertion so the UI can show exactly what was faked. */
export interface ExternalIdvResult extends SingleResult {
  simulatedAssertion: SimulatedAssertion;
}

/**
 * Path 3: external identity verification (SIMULATED). Instead of TurboSign emailing an OTP, YOUR
 * provider verifies the signer and you assert that verification when minting the URL, so the signer
 * skips the OTP passcode gate. Because createEmbeddedSignature's `auth` shorthand only does OTP, this
 * path uses the lower-level sendSignature (with sendEmail: false) to set the recipient's
 * identityVerification, then createSigningUrl with a matching identityAssertion. Here the assertion is
 * FABRICATED (no real IdP is contacted). Returns the minted embed URL plus the simulated assertion.
 */
export async function externalIdv({
  name,
  email,
  verification,
}: {
  name: string;
  email: string;
  verification?: SimulatedVerificationInput;
}): Promise<ExternalIdvResult> {
  const pdf = await loadSamplePdf();
  const sent = await TurboSign.sendSignature({
    file: pdf,
    fileName: "sample-contract.pdf",
    documentName: `External IdV Demo (Simulated) - ${name}`,
    sendEmail: false,
    recipients: [{ name, email, signingOrder: 1, identityVerification: { mode: "external_idv", provider: PROVIDER } }],
    fields: [{ type: "signature", recipientEmail: email, template: { anchor: "{signature1}", placement: "replace", size: { width: 100, height: 30 } } }],
  });
  const recipientId = (sent.recipients ?? []).find((r) => r.email === email)?.id;
  if (!recipientId) throw new Error("sendSignature did not return the recipient; cannot mint a signing URL.");
  // A real integration passes the real reference the IdP returned. This is fabricated for the demo.
  // Capture the id once so the evidenceUrl points at the same verification record it names.
  const verificationId = `sim-idv-${Date.now()}`;
  // The dialog lets the operator assert a different subjectEmail; fall back to the signer's email.
  const subjectEmail = verification?.subjectEmail?.trim() || email;
  const simulatedAssertion: SimulatedAssertion = {
    provider: PROVIDER,
    verificationId,
    verifiedAt: new Date().toISOString(),
    subjectEmail,
    evidenceUrl: `https://simulated-idp.example/verifications/${verificationId}`,
    ...(verification?.method ? { method: verification.method } : {}),
    ...(verification?.methodDetail ? { methodDetail: verification.methodDetail } : {}),
    ...(verification?.assuranceLevel ? { assuranceLevel: verification.assuranceLevel } : {}),
    ...(verification?.verifiedName ? { verifiedName: verification.verifiedName } : {}),
    ...(verification?.overrideEmailMatching ? { overrideEmailMatching: true } : {}),
  };
  const link = await TurboSign.createSigningUrl(sent.documentId, {
    recipientId,
    identityAssertion: simulatedAssertion,
  });
  return { url: link.url, mode: link.identityVerificationMode, simulatedAssertion };
}
