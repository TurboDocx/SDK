// Live authorization test harness for the TurboDocx JS SDK.
//
// Purpose: catch ANY change to the role gating on the backend. For every SDK method and every
// role, we call the real backend and assert the HTTP status is 403 (role forbidden) or NOT 403
// (role allowed). The backend runs `requireOrgRole` BEFORE request-body validation, so a call
// only has to REACH the gate; it never needs valid data. That makes the whole matrix fixture-free:
// a forbidden role 403s before the handler, an allowed role passes the gate and then 400s/404s on
// the bogus payload, and 400/404 both prove authorization succeeded.
//
// This is an INTEGRATION suite. It needs a running backend and the four seeded role keys, so it is
// gated behind AUTHZ_LIVE=1 and never runs in the unit-test CI lane.

import { Deliverable, TurboPartner, TurboQuote, TurboSign, TurboWebhooks } from "../../src";

export type Role = "admin" | "contributor" | "user" | "viewer";
export const ROLES: Role[] = ["admin", "contributor", "user", "viewer"];

// Where the four role keys come from, in order:
//   1. AUTHZ_KEYS_FILE  - an absolute path, for pointing at an ad-hoc dev DB's keys.
//   2. e2e-role-keys.json - the committed fixed hermetic keys for the seeded E2E org. These match
//      the backend e2e seed (fixed base + computed sha256, same pattern as the existing E2E_API_KEY),
//      so CI and this file share one source of truth and a rerun never invalidates a key.
// Shape: [{ role, key }].
// eslint-disable-next-line @typescript-eslint/no-var-requires
const KEYS_PATH = process.env.AUTHZ_KEYS_FILE || require("path").join(__dirname, "e2e-role-keys.json");
// eslint-disable-next-line @typescript-eslint/no-var-requires
const ROLE_KEYS: Array<{ role: Role; key: string }> = require(KEYS_PATH);
export const KEY_FOR: Record<Role, string> = ROLE_KEYS.reduce(
  (acc, k) => ({ ...acc, [k.role]: k.key }),
  {} as Record<Role, string>
);

// Defaults target the seeded E2E org that owns the committed fixed keys. Override for a dev DB.
export const ORG_ID = process.env.AUTHZ_ORG_ID || "e2e00000-0000-4000-8000-000000000001";
export const BASE_URL = process.env.AUTHZ_BASE_URL || "http://127.0.0.1:3000";
// Any address works: it only exists so the SDK's client-side senderEmail guard does not throw
// before a TurboSign send reaches the gate.
export const SENDER_EMAIL = "authz-bed@turbodocx.test";

// The SDK modules are static singletons, so we reconfigure the one under test before each call and
// run the suite in-band (see jest.authz.config). One map keyed by the oracle's module name.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type StaticModule = { configure: (c: any) => void };
export const MODULE: Record<string, StaticModule> = {
  sign: TurboSign,
  deliverable: Deliverable,
  webhooks: TurboWebhooks,
  quote: TurboQuote,
  partner: TurboPartner,
};

export function configureFor(moduleName: string, role: Role): void {
  MODULE[moduleName].configure({
    apiKey: KEY_FOR[role],
    orgId: ORG_ID,
    senderEmail: SENDER_EMAIL,
    baseUrl: BASE_URL,
  });
}

const BOGUS_UUID = "00000000-0000-4000-8000-000000000000";

// Replace the "__BOGUS_UUID__" sentinel the bindings use with a syntactically valid, non-existent id.
export function substituteSentinels<T>(value: T): T {
  if (typeof value === "string") return (value === "__BOGUS_UUID__" ? BOGUS_UUID : value) as unknown as T;
  if (Array.isArray(value)) return value.map(substituteSentinels) as unknown as T;
  if (value && typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value)) out[k] = substituteSentinels(v);
    return out as unknown as T;
  }
  return value;
}

// The only outcome that matters is the HTTP status the gate produced. Returns:
//   - the SDK error's statusCode when the call rejects with a TurboDocxError
//   - 200 when the call resolves (allowed, and the bogus request happened to succeed)
//   - -1 for a client-side / non-HTTP failure (a binding that never reached the backend). We treat
//     -1 as a binding bug, never as a passing negative, so a bad binding can't fake a 403.
export async function statusOf(invoke: () => Promise<unknown>): Promise<number> {
  try {
    await invoke();
    return 200;
  } catch (err) {
    // Duck-type on statusCode rather than `instanceof TurboDocxError`: ts-jest can load the SDK's
    // errors module under a second module identity, so instanceof fails across that boundary even
    // though the thrown error carries a numeric statusCode. Reading the field directly is robust.
    const code = (err as { statusCode?: unknown } | null)?.statusCode;
    if (typeof code === "number") return code;
    return -1;
  }
}

// The oracle names the admin role "administrator" (the enum), while the DB literal and our keys
// use "admin". Treat them as one.
const ORACLE_ALIAS: Record<Role, string[]> = {
  admin: ["admin", "administrator"],
  contributor: ["contributor"],
  user: ["user"],
  viewer: ["viewer"],
};

export function isAllowed(allowedRoles: string[], role: Role): boolean {
  if (allowedRoles.includes("ANY_AUTHENTICATED")) return true;
  return ORACLE_ALIAS[role].some((r) => allowedRoles.includes(r));
}
