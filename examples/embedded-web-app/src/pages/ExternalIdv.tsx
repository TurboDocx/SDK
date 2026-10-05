import { useEffect, useRef, useState } from "react";
import { CheckCircle2, FlaskConical } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { IdentityCheck, type IdentityCheckResult } from "@/components/IdentityCheck";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { startExternalIdv, type SimulatedAssertion } from "@/lib/turbosign";

// In production, pin this to your known TurboSign origin. Left null here, the listener instead pins to
// the origin of the URL it framed, so a forged `turbosign:completed` from another frame/extension/ad
// on the page can't flip the UI to "signed".
const TURBOSIGN_ORIGIN: string | null = null;

type Phase = "form" | "signing" | "done";

// A prominent, always-visible banner so it is never ambiguous that this path fakes the identity check.
function SimulationBanner() {
  return (
    <div className="flex items-start gap-3 rounded-xl border border-amber-300 bg-amber-50 p-4 text-amber-900 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-200">
      <FlaskConical className="mt-0.5 size-5 shrink-0" />
      <div className="space-y-1">
        <p className="text-sm font-semibold">Simulated identity verification</p>
        <p className="text-sm">
          This demo does not contact a real identity verification vendor. It fabricates the
          verification assertion so you can see the no-passcode flow and how the assertion lands on the
          certificate and audit trail. In production, your identity verification vendor verifies the
          signer and your backend asserts that real result.
        </p>
      </div>
    </div>
  );
}

export function ExternalIdv() {
  const [phase, setPhase] = useState<Phase>("form");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [embedUrl, setEmbedUrl] = useState<string | null>(null);
  const [assertion, setAssertion] = useState<SimulatedAssertion | null>(null);
  const [status, setStatus] = useState("");

  // The simulated identity check and whether its result is being sent to the server.
  const [dialogOpen, setDialogOpen] = useState(false);
  const [verifying, setVerifying] = useState(false);

  // The origin of the framed signing URL — the only origin we accept a completion from.
  const expectedOriginRef = useRef<string | null>(null);

  useEffect(() => {
    const handler = (event: MessageEvent) => {
      const expected = TURBOSIGN_ORIGIN ?? expectedOriginRef.current;
      if (!expected || event.origin !== expected) return;
      if (event.data && (event.data as { type?: string }).type === "turbosign:completed") {
        setPhase("done");
        setStatus("");
      }
    };
    window.addEventListener("message", handler);
    return () => window.removeEventListener("message", handler);
  }, []);

  // Step 1: open the simulator once we have a signer, prefilling its fields from the tab.
  function openSimulator(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !email.trim()) return;
    setStatus("");
    setDialogOpen(true);
  }

  // Step 2: "run" the simulated verification, then pass the collected result back to the BFF.
  async function runVerification(result: IdentityCheckResult) {
    const { verifiedName, subjectEmail, method, methodDetail, assuranceLevel } = result;
    setVerifying(true);
    try {
      // The asserted email differs from the signer's, so record an explicit override.
      const overrideEmailMatching =
        subjectEmail.trim().length > 0 &&
        subjectEmail.trim().toLowerCase() !== email.trim().toLowerCase();
      const { url, simulatedAssertion } = await startExternalIdv({
        name: name.trim(),
        email: email.trim(),
        verification: {
          verifiedName: verifiedName.trim() || undefined,
          subjectEmail: subjectEmail.trim() || undefined,
          method,
          methodDetail: method === "other" ? methodDetail.trim() : undefined,
          assuranceLevel: assuranceLevel || undefined,
          overrideEmailMatching,
        },
      });
      try {
        expectedOriginRef.current = new URL(url).origin;
      } catch {
        /* leave unset — the listener then accepts nothing until an origin is known */
      }
      setAssertion(simulatedAssertion);
      setEmbedUrl(url);
      setDialogOpen(false);
      setPhase("signing");
      // No passcode gate: the (simulated) vendor already verified this signer, so the signing page
      // opens straight to the document. The verification is recorded on the certificate and audit trail.
      setStatus("");
    } catch (err) {
      setStatus(`Could not start signing: ${err instanceof Error ? err.message : String(err)}`);
      setDialogOpen(false);
    } finally {
      setVerifying(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">Complete your auto policy</CardTitle>
        <CardDescription>
          One signer, verified by an external identity verification vendor. This app asserts the
          signer's verified identity to TurboSign, so there is no one-time passcode to enter. The
          verification is recorded on the certificate and audit trail. We mint an embeddable signing
          URL and frame it here.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <SimulationBanner />

        {phase === "form" && (
          <form onSubmit={openSimulator} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full name</Label>
              <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Alex Rivera" autoComplete="name" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" autoComplete="email" required />
            </div>
            <Button type="submit">Verify identity to sign</Button>
          </form>
        )}

        {phase === "signing" && embedUrl && (
          <div className="space-y-4">
            {assertion && (
              <div className="rounded-xl border border-dashed border-amber-300 bg-amber-50/60 p-4 text-sm dark:border-amber-800 dark:bg-amber-950/40">
                <p className="mb-2 font-semibold text-amber-900 dark:text-amber-200">
                  Simulated assertion sent to TurboSign
                </p>
                <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 font-mono text-xs text-amber-900/90 dark:text-amber-200/90">
                  <dt className="text-amber-700 dark:text-amber-400">provider</dt>
                  <dd>{assertion.provider}</dd>
                  <dt className="text-amber-700 dark:text-amber-400">verificationId</dt>
                  <dd>{assertion.verificationId}</dd>
                  <dt className="text-amber-700 dark:text-amber-400">verifiedAt</dt>
                  <dd>{assertion.verifiedAt}</dd>
                  <dt className="text-amber-700 dark:text-amber-400">subjectEmail</dt>
                  <dd>{assertion.subjectEmail}</dd>
                  {assertion.verifiedName && (
                    <>
                      <dt className="text-amber-700 dark:text-amber-400">verifiedName</dt>
                      <dd>{assertion.verifiedName}</dd>
                    </>
                  )}
                  {assertion.method && (
                    <>
                      <dt className="text-amber-700 dark:text-amber-400">method</dt>
                      <dd>{assertion.method}</dd>
                    </>
                  )}
                  {assertion.methodDetail && (
                    <>
                      <dt className="text-amber-700 dark:text-amber-400">methodDetail</dt>
                      <dd>{assertion.methodDetail}</dd>
                    </>
                  )}
                  {assertion.assuranceLevel && (
                    <>
                      <dt className="text-amber-700 dark:text-amber-400">assuranceLevel</dt>
                      <dd>{assertion.assuranceLevel}</dd>
                    </>
                  )}
                  {assertion.evidenceUrl && (
                    <>
                      <dt className="text-amber-700 dark:text-amber-400">evidenceUrl</dt>
                      <dd className="break-all">{assertion.evidenceUrl}</dd>
                    </>
                  )}
                  {assertion.overrideEmailMatching && (
                    <>
                      <dt className="text-amber-700 dark:text-amber-400">overrideEmailMatching</dt>
                      <dd>true</dd>
                    </>
                  )}
                </dl>
                <p className="mt-2 text-xs text-amber-800/80 dark:text-amber-300/80">
                  A real integration passes the reference its identity verification vendor returned. No
                  passcode gate appears because the identity was asserted here.
                </p>
              </div>
            )}
            <div className="overflow-hidden rounded-xl border">
              <iframe src={embedUrl} title="Sign your policy" allow="clipboard-write" className="block h-[720px] w-full" />
            </div>
          </div>
        )}

        {phase === "done" && (
          <div className="flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-5 text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-200">
            <CheckCircle2 className="mt-0.5 size-5 shrink-0" />
            <div>
              <p className="font-semibold">All set. Your policy is signed.</p>
              <p className="text-sm">We recorded your signature and your (simulated) external identity verification on the certificate.</p>
            </div>
          </div>
        )}

        {status && <p className="text-sm text-muted-foreground">{status}</p>}
      </CardContent>

      {/* The identity check stands in for a verification vendor's hosted flow (simulated). */}
      <IdentityCheck
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        signerName={name.trim()}
        signerEmail={email.trim()}
        busy={verifying}
        onComplete={runVerification}
      />
    </Card>
  );
}
