import { describe, expect, it } from "vitest";

import { PREPARING_MESSAGE, otpTurnMessage } from "./statusCopy";

// The verification code is only sent when the signer clicks "Send Code" in the signing panel, so the
// host's status line must never claim it was already emailed (found live: "We emailed a 6-digit
// code…" showed before any code existed).
describe("host status copy", () => {
  it("does not claim a code was sent while the document is being prepared", () => {
    expect(PREPARING_MESSAGE).toBe("Preparing your document…");
    expect(PREPARING_MESSAGE).not.toMatch(/email/i);
  });

  it("tells the signer to request the code from the panel, without claiming it was already sent", () => {
    const message = otpTurnMessage();
    expect(message).toBe('Click "Send Code" in the signing panel to get a 6-digit code by email, enter it, then sign.');
    expect(message).not.toMatch(/we emailed|check your email/i);
  });

  it("names the signer whose turn it is (kiosk)", () => {
    expect(otpTurnMessage("Kiosk One")).toBe(
      'Kiosk One: click "Send Code" in the signing panel to get a 6-digit code by email, enter it, then sign.',
    );
  });
});
