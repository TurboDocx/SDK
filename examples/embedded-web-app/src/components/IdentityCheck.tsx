import { useEffect, useState } from "react";
import {
  BadgeCheck,
  Check,
  CreditCard,
  Database,
  FlaskConical,
  KeyRound,
  ListChecks,
  Loader2,
  Lock,
  PenLine,
  ScanFace,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import type { SimulatedIdvMethod } from "@/lib/turbosign";

// A guided, phone-style identity check that stands in for an identity verification vendor's hosted
// flow. Every result is SIMULATED: nothing is captured, uploaded or sent to a vendor. The collected
// values are only what the demo asserts to TurboSign when it mints the signing URL.

export interface IdentityCheckResult {
  verifiedName: string;
  subjectEmail: string;
  method: SimulatedIdvMethod;
  methodDetail: string;
  assuranceLevel: string;
}

const METHODS: Array<{
  value: SimulatedIdvMethod;
  label: string;
  hint: string;
  icon: typeof CreditCard;
}> = [
  { value: "id_document", label: "Photo ID", hint: "Driver's license, passport or ID card", icon: CreditCard },
  { value: "id_document_liveness", label: "Photo ID and selfie", hint: "ID plus a quick liveness check", icon: ScanFace },
  { value: "kba", label: "Security questions", hint: "Questions only you can answer", icon: ListChecks },
  { value: "database", label: "Records lookup", hint: "Match against trusted data sources", icon: Database },
  { value: "sso", label: "Sign in", hint: "Your organization's single sign-on", icon: KeyRound },
  { value: "other", label: "Something else", hint: "Describe the method", icon: PenLine },
];

const ASSURANCE_LEVELS: Array<{ value: string; label: string }> = [
  { value: "", label: "Not specified" },
  { value: "ial2_aal2", label: "IAL2 / AAL2" },
  { value: "eidas_substantial", label: "eIDAS Substantial" },
  { value: "eidas_high", label: "eIDAS High" },
];

// What the "Checking" step reports for each method. A real vendor runs these; here they only animate.
const CHECKS: Record<SimulatedIdvMethod, string[]> = {
  id_document: ["Document is authentic", "Details read from the document", "Document is not expired"],
  id_document_liveness: ["Document is authentic", "Selfie is a live person", "Face matches the document"],
  kba: ["Answers match records", "Session risk is low"],
  database: ["Name and address found", "Records are consistent"],
  sso: ["Signed in to your organization", "Account is active"],
  other: ["Verification completed"],
};

type Step = "method" | "capture" | "checking" | "result";
const STEPS: Step[] = ["method", "capture", "checking", "result"];

const ink = "#13293D";
const verified = "#0F9D84";

const selectClassName =
  "flex h-9 w-full min-w-0 rounded-md border bg-transparent px-3 py-1 text-base shadow-xs outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] md:text-sm";

function usesCamera(method: SimulatedIdvMethod) {
  return method === "id_document" || method === "id_document_liveness";
}

/** The document or face frame with corner brackets and a sweeping scan line. */
function CaptureFrame({ face, scanning }: { face: boolean; scanning: boolean }) {
  return (
    <div
      className="relative mx-auto flex items-center justify-center overflow-hidden rounded-2xl"
      style={{ background: ink, width: "100%", maxWidth: 340, aspectRatio: face ? "1 / 1" : "1.586 / 1" }}
      aria-hidden
    >
      {face ? (
        <div className="h-[78%] w-[58%] rounded-[50%] border-2 border-dashed" style={{ borderColor: "rgba(255,255,255,0.55)" }} />
      ) : (
        <div className="relative h-[72%] w-[84%] rounded-lg" style={{ background: "rgba(255,255,255,0.06)" }}>
          {/* Corner brackets: where to line up the card. */}
          {["top-0 left-0 border-t-2 border-l-2", "top-0 right-0 border-t-2 border-r-2", "bottom-0 left-0 border-b-2 border-l-2", "bottom-0 right-0 border-b-2 border-r-2"].map(
            (pos) => (
              <span key={pos} className={cn("absolute size-5 rounded-[3px]", pos)} style={{ borderColor: verified }} />
            ),
          )}
          <div className="absolute top-[22%] left-[8%] h-[48%] w-[26%] rounded-md" style={{ background: "rgba(255,255,255,0.12)" }} />
          <div className="absolute top-[26%] left-[40%] right-[10%] space-y-2">
            {[70, 52, 60].map((w) => (
              <div key={w} className="h-1.5 rounded-full" style={{ width: `${w}%`, background: "rgba(255,255,255,0.18)" }} />
            ))}
          </div>
        </div>
      )}
      {scanning && (
        <div
          className="idv-scan pointer-events-none absolute inset-x-0 h-16"
          style={{ background: `linear-gradient(to bottom, transparent, ${verified}55, transparent)` }}
        />
      )}
    </div>
  );
}

export function IdentityCheck({
  open,
  onOpenChange,
  signerName,
  signerEmail,
  busy,
  onComplete,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  signerName: string;
  signerEmail: string;
  busy: boolean;
  onComplete: (result: IdentityCheckResult) => void;
}) {
  const [step, setStep] = useState<Step>("method");
  const [method, setMethod] = useState<SimulatedIdvMethod>("id_document");
  const [methodDetail, setMethodDetail] = useState("");
  const [verifiedName, setVerifiedName] = useState(signerName);
  const [subjectEmail, setSubjectEmail] = useState(signerEmail);
  const [assuranceLevel, setAssuranceLevel] = useState("");
  const [capturing, setCapturing] = useState(false);
  const [checksDone, setChecksDone] = useState(0);

  // Start fresh each time the check opens, prefilled from the signer.
  useEffect(() => {
    if (!open) return;
    setStep("method");
    setMethod("id_document");
    setMethodDetail("");
    setVerifiedName(signerName);
    setSubjectEmail(signerEmail);
    setAssuranceLevel("");
    setCapturing(false);
    setChecksDone(0);
  }, [open, signerName, signerEmail]);

  // Tick the checks off one at a time, then show the result.
  const checks = CHECKS[method];
  useEffect(() => {
    if (step !== "checking") return;
    if (checksDone >= checks.length) {
      const t = setTimeout(() => setStep("result"), 450);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => setChecksDone((n) => n + 1), 650);
    return () => clearTimeout(t);
  }, [step, checksDone, checks.length]);

  const emailMismatch =
    subjectEmail.trim().length > 0 && subjectEmail.trim().toLowerCase() !== signerEmail.trim().toLowerCase();
  const canContinueMethod = method !== "other" || methodDetail.trim().length > 0;
  const methodLabel = METHODS.find((m) => m.value === method)?.label ?? "";
  const stepIndex = STEPS.indexOf(step);

  function startCheck() {
    setChecksDone(0);
    setStep("checking");
  }

  function capture() {
    setCapturing(true);
    setTimeout(() => {
      setCapturing(false);
      startCheck();
    }, 1400);
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !busy && !capturing && onOpenChange(o)}>
      <DialogContent className="gap-0 overflow-hidden p-0 sm:max-w-md [&>button:last-child]:text-white/80 [&>button:last-child]:hover:text-white">
        <div className="px-6 pt-5 pb-4 text-white" style={{ background: ink }}>
          <div className="flex items-center justify-between gap-3">
            <DialogTitle className="flex items-center gap-2 text-base font-semibold">
              <Lock className="size-4" style={{ color: verified }} />
              Secure identity check
            </DialogTitle>
            <span className="mr-6 inline-flex items-center gap-1 rounded-full bg-amber-400/15 px-2 py-0.5 text-xs font-medium text-amber-300">
              <FlaskConical className="size-3" />
              Simulated
            </span>
          </div>
          <DialogDescription className="mt-1 text-sm text-white/70">
            Verify who you are before signing. Takes about a minute.
          </DialogDescription>
          <ol className="mt-4 grid grid-cols-4 gap-1.5" aria-label={`Step ${stepIndex + 1} of ${STEPS.length}`}>
            {STEPS.map((s, i) => (
              <li
                key={s}
                className="h-1 rounded-full transition-colors motion-reduce:transition-none"
                style={{ background: i <= stepIndex ? verified : "rgba(255,255,255,0.18)" }}
              />
            ))}
          </ol>
        </div>

        <div className="px-6 py-5">
          {step === "method" && (
            <div className="space-y-4">
              <h3 className="text-sm font-semibold">How would you like to verify?</h3>
              <div className="grid grid-cols-2 gap-2" role="radiogroup" aria-label="Verification method">
                {METHODS.map(({ value, label, hint, icon: Icon }) => {
                  const selected = method === value;
                  return (
                    <button
                      key={value}
                      type="button"
                      role="radio"
                      aria-checked={selected}
                      onClick={() => setMethod(value)}
                      className={cn(
                        "flex flex-col items-start gap-1.5 rounded-xl border p-3 text-left outline-none transition-colors focus-visible:ring-[3px] focus-visible:ring-ring/50 motion-reduce:transition-none",
                        selected ? "border-transparent" : "hover:bg-muted/60",
                      )}
                      style={selected ? { boxShadow: `inset 0 0 0 2px ${verified}`, background: `${verified}0F` } : undefined}
                    >
                      <Icon className="size-5" style={{ color: selected ? verified : "#5B6B7B" }} />
                      <span className="text-sm font-medium leading-tight">{label}</span>
                      <span className="text-xs leading-snug text-muted-foreground">{hint}</span>
                    </button>
                  );
                })}
              </div>
              {method === "other" && (
                <div className="space-y-1.5">
                  <Label htmlFor="idv-method-detail">Describe the method</Label>
                  <Input
                    id="idv-method-detail"
                    value={methodDetail}
                    onChange={(e) => setMethodDetail(e.target.value)}
                    placeholder="e.g. notary video session"
                  />
                </div>
              )}
              <Button
                className="w-full text-white"
                style={{ background: ink }}
                disabled={!canContinueMethod}
                onClick={() => (usesCamera(method) ? setStep("capture") : startCheck())}
              >
                Continue
              </Button>
            </div>
          )}

          {step === "capture" && (
            <div className="space-y-4 text-center">
              <div className="space-y-1">
                <h3 className="text-sm font-semibold">
                  {method === "id_document_liveness" ? "Take a quick selfie" : "Scan the front of your ID"}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {method === "id_document_liveness"
                    ? "Center your face in the oval and hold still."
                    : "Place the card inside the frame, in good light."}
                </p>
              </div>
              <CaptureFrame face={method === "id_document_liveness"} scanning={capturing} />
              <p className="text-xs text-muted-foreground">
                Demo only: no camera is used and nothing is uploaded.
              </p>
              <Button className="w-full text-white" style={{ background: ink }} disabled={capturing} onClick={capture}>
                {capturing ? (
                  <>
                    <Loader2 className="size-4 animate-spin motion-reduce:animate-none" /> Capturing
                  </>
                ) : method === "id_document_liveness" ? (
                  "Use sample selfie"
                ) : (
                  "Use sample ID"
                )}
              </Button>
            </div>
          )}

          {step === "checking" && (
            <div className="space-y-4">
              <h3 className="text-sm font-semibold">Checking {methodLabel.toLowerCase()}</h3>
              <ul className="space-y-2.5" aria-live="polite">
                {checks.map((c, i) => {
                  const done = i < checksDone;
                  const active = i === checksDone;
                  return (
                    <li key={c} className="flex items-center gap-3 text-sm">
                      <span
                        className="flex size-6 shrink-0 items-center justify-center rounded-full border"
                        style={done ? { background: verified, borderColor: verified, color: "white" } : undefined}
                      >
                        {done ? (
                          <Check className="size-3.5" />
                        ) : active ? (
                          <Loader2 className="size-3.5 animate-spin text-muted-foreground motion-reduce:animate-none" />
                        ) : null}
                      </span>
                      <span className={done ? "" : "text-muted-foreground"}>{c}</span>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}

          {step === "result" && (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <BadgeCheck className="size-9 shrink-0" style={{ color: verified }} />
                <div>
                  <h3 className="text-base font-semibold">Identity verified</h3>
                  <p className="text-sm text-muted-foreground">
                    Confirm the details we'll attach to your signature.
                  </p>
                </div>
              </div>

              <div className="space-y-3 rounded-xl border p-4">
                <div className="space-y-1.5">
                  <Label htmlFor="idv-verified-name">Verified name</Label>
                  <Input id="idv-verified-name" value={verifiedName} onChange={(e) => setVerifiedName(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="idv-subject-email">Verified email</Label>
                  <Input
                    id="idv-subject-email"
                    type="email"
                    value={subjectEmail}
                    onChange={(e) => setSubjectEmail(e.target.value)}
                  />
                  {emailMismatch && (
                    <p className="text-xs text-amber-700 dark:text-amber-400">
                      This email differs from the signer's, so the override is recorded on the audit trail.
                    </p>
                  )}
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="idv-assurance">Assurance level</Label>
                  <select
                    id="idv-assurance"
                    className={selectClassName}
                    value={assuranceLevel}
                    onChange={(e) => setAssuranceLevel(e.target.value)}
                  >
                    {ASSURANCE_LEVELS.map((a) => (
                      <option key={a.value} value={a.value}>
                        {a.label}
                      </option>
                    ))}
                  </select>
                </div>
                <p className="text-xs text-muted-foreground">Method: {methodLabel}</p>
              </div>

              <Button
                className="w-full text-white"
                style={{ background: verified }}
                disabled={busy}
                onClick={() =>
                  onComplete({ verifiedName, subjectEmail, method, methodDetail, assuranceLevel })
                }
              >
                {busy ? (
                  <>
                    <Loader2 className="size-4 animate-spin motion-reduce:animate-none" /> Opening document
                  </>
                ) : (
                  "Continue to sign"
                )}
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
