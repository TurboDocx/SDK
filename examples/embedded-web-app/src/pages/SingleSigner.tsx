import { useEffect, useState } from "react";
import { CheckCircle2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { startSingleSigner } from "@/lib/turbosign";

// In production, pin this to your known TurboSign origin so only the real signing page can report
// completion. null = accept any origin (fine for a local demo).
const TURBOSIGN_ORIGIN: string | null = null;

type Phase = "form" | "signing" | "done";

export function SingleSigner() {
  const [phase, setPhase] = useState<Phase>("form");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [embedUrl, setEmbedUrl] = useState<string | null>(null);
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const handler = (event: MessageEvent) => {
      if (TURBOSIGN_ORIGIN && event.origin !== TURBOSIGN_ORIGIN) return;
      if (event.data && (event.data as { type?: string }).type === "turbosign:completed") {
        setPhase("done");
        setStatus("");
      }
    };
    window.addEventListener("message", handler);
    return () => window.removeEventListener("message", handler);
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !email.trim()) return;
    setBusy(true);
    setStatus("Preparing your document and emailing your verification code…");
    try {
      const { url, mode } = await startSingleSigner({ name: name.trim(), email: email.trim() });
      setEmbedUrl(url);
      setPhase("signing");
      setStatus(
        mode === "otp"
          ? `We emailed a 6-digit code to ${email.trim()}. Enter it below to verify, then sign.`
          : "Sign the document below.",
      );
    } catch (err) {
      setStatus(`Could not start signing: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">Complete your auto policy</CardTitle>
        <CardDescription>
          One signer, verified with an email one-time passcode. We create the document, mint an embeddable
          signing URL, and frame it here. Your completed copy is emailed to the same address.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        {phase === "form" && (
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full name</Label>
              <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Alex Rivera" autoComplete="name" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" autoComplete="email" required />
            </div>
            <Button type="submit" disabled={busy}>
              {busy ? "Starting…" : "Start signing"}
            </Button>
          </form>
        )}

        {phase === "signing" && embedUrl && (
          <div className="overflow-hidden rounded-xl border">
            <iframe src={embedUrl} title="Sign your policy" allow="clipboard-write" className="block h-[720px] w-full" />
          </div>
        )}

        {phase === "done" && (
          <div className="flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-5 text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-200">
            <CheckCircle2 className="mt-0.5 size-5 shrink-0" />
            <div>
              <p className="font-semibold">All set. Your policy is signed.</p>
              <p className="text-sm">We recorded your signature and emailed your completed copy to {email}.</p>
            </div>
          </div>
        )}

        {status && <p className="text-sm text-muted-foreground">{status}</p>}
      </CardContent>
    </Card>
  );
}
