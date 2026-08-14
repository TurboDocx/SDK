# SDK authorization matrix (live integration)

A regression guard for the backend's role gating. For **every** SDK method and **every** org role it
calls a real backend and asserts the authorization outcome, so any change to a role gate makes a cell
here flip and the suite fail.

## What it asserts

For each `(method, role)`:

- **role allowed** -> the call reaches the handler, so the status is anything **but 403**
- **role forbidden** -> the gate rejects with **403** before the handler runs

The backend runs `requireOrgRole` *before* request-body validation, so a call only has to reach the
gate. A forbidden role 403s on bogus args; an allowed role 400/404s on them. Both are conclusive about
authorization with **no fixtures**, which is why all 94 org-role methods x 4 roles run fixture-free.

## Coverage

- `role-matrix.json` - the oracle: every SDK method -> HTTP route -> allowed roles (the frozen contract).
- `bindings.json` - minimal positional args per method so each call reaches the gate.
- 94 org-role methods (sign, deliverable, webhooks, quote) x 4 roles = 376 cases.
- 25 partner methods are **skipped** here: they authenticate with a `TDXP-` partner key gated by
  partner scopes, not org roles. They get their own scoped-key suite (TODO).

## Running it

Live-only. Needs a backend and the four seeded role keys. Dormant (skips) unless `AUTHZ_LIVE=1`, so it
never runs in the unit-test lane.

```bash
# against the seeded E2E org (fixed keys in e2e-role-keys.json)
AUTHZ_LIVE=1 npx jest tests/authz/authz-matrix.test.ts --runInBand

# against an ad-hoc dev DB: point at its keys + org + url
AUTHZ_LIVE=1 AUTHZ_KEYS_FILE=/path/to/role-keys.json \
  AUTHZ_ORG_ID=<org> AUTHZ_BASE_URL=http://127.0.0.1:3000 \
  npx jest tests/authz/authz-matrix.test.ts --runInBand
```

`--runInBand` is required: the SDK modules are static singletons, so the harness reconfigures the one
under test before each call and the suite must not run cases concurrently.

## Seed prerequisites (CI)

The seeded org must be provisioned enough that no **pre-gate** middleware short-circuits before the
role gate, or a forbidden role gets a 500/400 instead of the 403 the suite expects. Concretely:

- four API keys whose **service users** carry each role (`requireOrgRole` reads the service user's
  `UserOrgMap.role`, not `APIKey.role`),
- a `Features` row with the flags enabled,
- an `OrgStorage` row of type **TDM/S3** (a `LocalDisk/fs` row throws in `StorageLoaderMiddleware`,
  which sits in `.all()` ahead of the gate on the TurboSign prepare and quote routes).

The backend e2e seed provisions all three for the E2E org; `e2e-role-keys.json` here mirrors the fixed
keys it creates.
