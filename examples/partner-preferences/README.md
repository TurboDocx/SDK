# Example: partner-settable org preferences

Small runnable scripts that show **what a partner sees** when managing a child
organization's TurboSign display preferences through the SDK — and prove the
change actually persists.

Each script does the same three steps:

1. **Read** the tenant's current preferences (`getOrganizationPreferences`)
2. **Flip** the locked-fields background (`updateOrganizationPreferences`)
3. **Read back** to confirm the value stuck

The three preferences a partner can set per tenant:

| Preference | Meaning |
|------------|---------|
| `hideSignatureOutline` | hide the outline/label on signed fields in the finished PDF |
| `hideSignatureHash` | hide the verification hash on signed fields |
| `lockedFieldsBackground` | show locked fields as a grey box (`true`) or plain text (`false`) |

The API returns **only** these keys (never the org's other integration settings),
each with its effective value (defaults applied for keys the org never set).

## Setup

You need a **partner API key** (`TDXP-…`), the partner's id, and the UUID of a
child org that partner owns. Point the SDK at your backend with `TURBODOCX_BASE_URL`.

```bash
export TURBODOCX_BASE_URL=http://localhost:3001
export TURBODOCX_PARTNER_API_KEY=TDXP-your-key
export TURBODOCX_PARTNER_ID=your-partner-uuid
export ORG_ID=a-child-org-uuid
```

## JavaScript

```bash
# build the SDK once
(cd ../../packages/js-sdk && npm ci && npm run build)

node js/read-and-set-preferences.mjs
```

## Python

```bash
(cd ../../packages/py-sdk && pip install -e .)

python3 python/read_and_set_preferences.py
```

## Expected output

```
BEFORE: outline=true hash=true lockedGreyBackground=true
UPDATED: outline=true hash=true lockedGreyBackground=false
AFTER : outline=true hash=true lockedGreyBackground=false

OK — the partner changed lockedFieldsBackground to false and it stuck.
```

If the partner isn't allowed to set a given key (its grant doesn't cover it), the
API responds 403 and the SDK raises a typed authorization error — try it by
requesting a key outside the partner's `allowedFields`.
