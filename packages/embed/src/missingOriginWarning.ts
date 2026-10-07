/**
 * Internal (not exported from the package entry points): the one-time console warning both components
 * emit when no origin is configured, so every message is being ignored.
 */
export const MISSING_ORIGIN_WARNING =
  '[@turbodocx/embed] No origin is configured, so every TurboSign message is being ignored (fail closed). ' +
  'Set the origin to the exact TurboSign origin that serves your embed URL, for example ' +
  '"https://app.turbodocx.com". For local development only, opt out with allowAnyOrigin / allow-any-origin.';
