// Example: what a partner sees when managing a tenant's TurboSign display
// preferences through the SDK. Reads a child org's preferences, flips the
// locked-fields background, and reads them back to prove the change stuck.
//
// Run:
//   TURBODOCX_BASE_URL=http://localhost:3001 \
//   TURBODOCX_PARTNER_API_KEY=TDXP-... \
//   TURBODOCX_PARTNER_ID=<partner-uuid> \
//   ORG_ID=<child-org-uuid> \
//   node examples/partner-preferences/js/read-and-set-preferences.mjs
//
// Uses the locally-built SDK (packages/js-sdk/dist). Run `npm run build` in
// packages/js-sdk first.

import { TurboPartner } from "../../../packages/js-sdk/dist/index.js";

const ORG_ID = process.env.ORG_ID;
if (!ORG_ID) {
  console.error("Set ORG_ID to a child org UUID this partner owns.");
  process.exit(1);
}

// Config comes from env vars (TURBODOCX_PARTNER_API_KEY / _PARTNER_ID / _BASE_URL).
TurboPartner.configure({
  partnerApiKey: process.env.TURBODOCX_PARTNER_API_KEY,
  partnerId: process.env.TURBODOCX_PARTNER_ID,
  baseUrl: process.env.TURBODOCX_BASE_URL,
});

const show = (label, prefs) =>
  console.log(
    `${label}: outline=${!prefs.hideSignatureOutline} hash=${!prefs.hideSignatureHash} ` +
      `lockedGreyBackground=${prefs.lockedFieldsBackground}`,
  );

async function main() {
  // 1. What does the partner see right now for this tenant?
  const before = (await TurboPartner.getOrganizationPreferences(ORG_ID)).data.preferences;
  show("BEFORE", before);

  // 2. Flip the locked-fields background to the opposite of its current value.
  const next = !before.lockedFieldsBackground;
  const updated = (
    await TurboPartner.updateOrganizationPreferences(ORG_ID, { lockedFieldsBackground: next })
  ).data.preferences;
  show("UPDATED", updated);

  // 3. Read it back fresh to prove it persisted.
  const after = (await TurboPartner.getOrganizationPreferences(ORG_ID)).data.preferences;
  show("AFTER ", after);

  if (after.lockedFieldsBackground !== next) {
    throw new Error("Round-trip mismatch: the value did not persist.");
  }
  console.log(`\nOK — the partner changed lockedFieldsBackground to ${next} and it stuck.`);
}

main().catch((err) => {
  console.error("FAILED:", err.code || "", err.message);
  process.exit(1);
});
