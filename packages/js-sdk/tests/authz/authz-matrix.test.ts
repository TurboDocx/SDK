// Full role x method authorization matrix, run against a live backend.
//
// For every SDK method and every role we assert the backend's authorization outcome:
//   - role allowed  -> the call reaches the handler, so the status is anything BUT 403
//   - role forbidden -> the gate rejects with 403 before the handler runs
//
// Because the gate runs before body validation, forbidden roles 403 on bogus args and allowed roles
// 400/404 on them; both outcomes are conclusive about authorization without any fixtures. If ANYONE
// changes a role gate on the backend, the corresponding cell here flips and the suite fails, which is
// exactly the regression guard we want.
//
// Live-only: needs the backend on AUTHZ_BASE_URL and the four seeded role keys. Gated by AUTHZ_LIVE=1.

import * as fs from "fs";
import * as path from "path";

import { configureFor, isAllowed, ROLES, statusOf, substituteSentinels } from "./harness";
import { MODULE } from "./harness";

type OracleRow = { module: string; name: string; http: string; path: string; allowed_roles: string[] };
type Binding = { args: unknown[]; note?: string; guard?: string };

const ORACLE: OracleRow[] = JSON.parse(fs.readFileSync(path.join(__dirname, "role-matrix.json"), "utf8"));
const BINDINGS: Record<string, Binding> = JSON.parse(fs.readFileSync(path.join(__dirname, "bindings.json"), "utf8"));

// Partner routes authenticate with a TDXP- partner key gated by partner scopes, not org roles. Our
// four keys are TDX- org keys, so partner is a separate auth universe (and untouched by the role
// changes under test). It gets its own scoped-key suite; here we surface it as a documented skip so
// coverage stays honest rather than silently dropping 25 methods.
const ORG_ROLE_MODULES = new Set(["sign", "deliverable", "webhooks", "quote"]);

const describeIfLive = process.env.AUTHZ_LIVE === "1" ? describe : describe.skip;

describeIfLive("SDK authorization matrix (live)", () => {
  for (const row of ORACLE) {
    const key = `${row.module}.${row.name}`;
    const binding = BINDINGS[key];

    if (!ORG_ROLE_MODULES.has(row.module)) {
      it.skip(`${key} [partner-scoped: covered by the partner-key suite, not org roles]`, () => undefined);
      continue;
    }

    describe(`${key} (${row.http} ${row.path}) allows [${row.allowed_roles.join(",")}]`, () => {
      for (const role of ROLES) {
        const allowed = isAllowed(row.allowed_roles, role);
        it(`${role} -> ${allowed ? "allowed (not 403)" : "forbidden (403)"}`, async () => {
          expect(binding).toBeDefined();
          configureFor(row.module, role);
          const args = substituteSentinels(binding.args);
          // Call the static method ON the class so `this` stays bound to it. Extracting the method
          // into a bare variable would drop `this`, and `this.getClient()` inside the SDK would throw
          // a TypeError (no statusCode), which reads as a binding failure rather than a real result.
          const cls = MODULE[row.module] as unknown as Record<string, (...a: unknown[]) => Promise<unknown>>;
          const status = await statusOf(() => cls[row.name](...args));

          // -1 means the call never reached the backend (a client-side throw in the binding). That is
          // a binding bug, never a valid result, so fail loudly instead of counting it as a pass.
          expect(status).not.toBe(-1);

          if (allowed) {
            expect(status).not.toBe(403);
          } else {
            expect(status).toBe(403);
          }
        });
      }
    });
  }
});
