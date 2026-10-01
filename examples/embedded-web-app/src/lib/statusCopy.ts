// Host status-line copy for the OTP signing paths. The verification code is only sent when the
// signer clicks "Send Code" inside the signing panel, so none of this may claim a code was already
// emailed.

export const PREPARING_MESSAGE = "Preparing your document…";

const REQUEST_CODE = 'click "Send Code" in the signing panel to get a 6-digit code by email, enter it, then sign.';

/** What the signer does next in an email-OTP flow; `name` prefixes it for a kiosk turn. */
export function otpTurnMessage(name?: string): string {
  if (name) return `${name}: ${REQUEST_CODE}`;
  return REQUEST_CODE.charAt(0).toUpperCase() + REQUEST_CODE.slice(1);
}
