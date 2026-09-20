// Frontend data layer. The browser NEVER talks to TurboDocx or holds the API key — it calls this
// app's own backend (server.ts), which holds the key and uses @turbodocx/sdk to mint embed URLs.
// In dev, Vite proxies /api -> the server (see vite.config.ts). This is the pattern real integrators
// use in production, and the one the embed widget is designed for: your server mints the URL, the
// frontend just frames it.

/** An Error carrying the backend's machine-readable error `code` (e.g. "RecipientNotInTurn"). */
class ApiError extends Error {
  constructor(
    message: string,
    readonly code?: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

async function postJson<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(path, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = (await res.json().catch(() => ({}))) as { error?: string; code?: string };
    throw new ApiError(err.error || `Request failed (HTTP ${res.status})`, err.code);
  }
  return res.json() as Promise<T>;
}

export type IdentityMode = "otp" | "external_idv" | "override" | null;

export interface SingleSignerResult {
  url: string;
  mode: IdentityMode;
}

/** Path 1 — single signer: server creates an email-OTP recipient and returns the minted embed URL. */
export function startSingleSigner(input: { name: string; email: string }): Promise<SingleSignerResult> {
  return postJson<SingleSignerResult>("/api/single", input);
}

/** The verification method the (simulated) vendor used. */
export type SimulatedIdvMethod = "id_document" | "id_document_liveness" | "kba" | "database" | "sso" | "other";

/** Path 3, external IdV: server asserts the signer's identity via its own provider, no OTP gate. */
/** The fabricated assertion the demo sent in place of a real identity verification vendor's response. */
export interface SimulatedAssertion {
  provider: string;
  verificationId: string;
  verifiedAt: string;
  subjectEmail: string;
  /** How the (simulated) vendor verified the signer. */
  method?: SimulatedIdvMethod;
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

export interface ExternalIdvResult extends SingleSignerResult {
  simulatedAssertion: SimulatedAssertion;
}

/** What the Identity Verification Simulator dialog collected when the operator "ran" the check. */
export interface SimulatedVerificationInput {
  verifiedName?: string;
  subjectEmail?: string;
  method?: SimulatedIdvMethod;
  methodDetail?: string;
  assuranceLevel?: string;
  overrideEmailMatching?: boolean;
}

export function startExternalIdv(input: {
  name: string;
  email: string;
  verification?: SimulatedVerificationInput;
}): Promise<ExternalIdvResult> {
  return postJson<ExternalIdvResult>("/api/external-idv", input);
}

export interface KioskSigner {
  recipientId: string;
  name: string;
  email: string;
  embedUrl: string | null;
  status: "ready" | "pending" | "completed";
}

export interface KioskStartResult {
  documentId: string;
  recipients: KioskSigner[];
}

/** Path 2 — sequential kiosk: server creates the document for all signers in order (turn-aware). */
export function startKiosk(signers: Array<{ name: string; email: string }>): Promise<KioskStartResult> {
  return postJson<KioskStartResult>("/api/kiosk/start", { signers });
}

/** Mint the next signer's embed URL once it's their turn (server calls createSigningUrl). */
export async function mintNext(input: { documentId: string; recipientId: string }): Promise<string> {
  const { url } = await postJson<{ url: string }>("/api/kiosk/next", input);
  return url;
}

// The backend's turn-race codes (from signingEligibility). Matching the machine-readable code is
// robust to copy changes / localization; the message regex is only a fallback for older backends
// that don't echo a code.
const NOT_IN_TURN_CODES = new Set(["RecipientNotInTurn", "NotSignersTurn"]);
const NOT_IN_TURN_MSG = /not (your|their|in) turn/i;

function isTurnRace(err: unknown): boolean {
  if (!(err instanceof Error)) return false;
  const code = (err as ApiError).code;
  if (code) return NOT_IN_TURN_CODES.has(code);
  return NOT_IN_TURN_MSG.test(err.message);
}

/**
 * Mint the next signer's URL, tolerating the brief window right after the previous signer completes.
 * The signing page fires `turbosign:completed` as soon as it shows its success screen, but the
 * backend advances the signing turn a beat later (once the signature is committed). So a mint fired
 * on the completion event can momentarily get "not their turn" — retry a few times before giving up.
 * Any other error (a real failure) is rethrown immediately.
 */
export async function mintNextWithRetry(
  input: { documentId: string; recipientId: string },
  { retries = 6, delayMs = 1500 }: { retries?: number; delayMs?: number } = {},
): Promise<string> {
  let lastErr: unknown;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await mintNext(input);
    } catch (err) {
      lastErr = err;
      if (!isTurnRace(err)) throw err;
      if (attempt < retries) await new Promise((r) => setTimeout(r, delayMs));
    }
  }
  throw lastErr;
}
