import { useState } from "react";
import { CheckCircle2 } from "lucide-react";
import { TurboSignForm } from "@turbodocx/embed/react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { startSingleSigner } from "@/lib/turbosign";

// The exact origin the signing page is served from, for postMessage origin pinning. Leave null in a
// local demo; set your TurboSign origin (e.g. "https://app.turbodocx.com") in production.
const TURBOSIGN_ORIGIN: string | null = null;

export function Widget() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [embedUrl, setEmbedUrl] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !email.trim()) return;
    setBusy(true);
    setStatus("Preparing your document and emailing your verification code…");
    try {
      const { url } = await startSingleSigner({ name: name.trim(), email: email.trim() });
      setEmbedUrl(url);
      setStatus(`We emailed a 6-digit code to ${email.trim()}. Verify it in the widget below, then sign.`);
    } catch (err) {
      setStatus(`Could not start signing: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">Same flow, using the drop-in widget</CardTitle>
        <CardDescription>
          Identical to the single-signer path, but instead of hand-rolling the <code>&lt;iframe&gt;</code> and a
          <code> window.addEventListener("message", …)</code> listener, the host renders the{" "}
          <code>&lt;TurboSignForm&gt;</code> component from <code>@turbodocx/embed</code>. It owns the iframe,
          origin pinning, and completion event for you.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        {!embedUrl && !done && (
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="w-name">Full name</Label>
              <Input id="w-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Alex Rivera" autoComplete="name" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="w-email">Email</Label>
              <Input id="w-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" autoComplete="email" required />
            </div>
            <Button type="submit" disabled={busy}>
              {busy ? "Starting…" : "Start signing"}
            </Button>
          </form>
        )}

        {embedUrl && !done && (
          <TurboSignForm
            embedUrl={embedUrl}
            origin={TURBOSIGN_ORIGIN}
            onCompleted={() => {
              setDone(true);
              setEmbedUrl(null);
              setStatus("");
            }}
            className="rounded-xl border"
          />
        )}

        {done && (
          <div className="flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-5 text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-200">
            <CheckCircle2 className="mt-0.5 size-5 shrink-0" />
            <div>
              <p className="font-semibold">Signed via the widget.</p>
              <p className="text-sm">The <code>onCompleted</code> callback fired and your copy was emailed to {email}.</p>
            </div>
          </div>
        )}

        {status && <p className="text-sm text-muted-foreground">{status}</p>}
      </CardContent>
    </Card>
  );
}
