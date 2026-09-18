import { useEffect, useRef, useState } from "react";
import { CheckCircle2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { type KioskSigner, mintNextWithRetry, startKiosk } from "@/lib/turbosign";

// In production, pin this to your known TurboSign origin. Left null here, the listener instead pins to
// the origin of the URL it just framed (derived below), so a forged `turbosign:completed` from any
// other frame/extension/ad on the page is ignored.
const TURBOSIGN_ORIGIN: string | null = null;

const BLANK = [
  { name: "", email: "" },
  { name: "", email: "" },
];

export function Kiosk() {
  const [inputs, setInputs] = useState(BLANK);
  const [documentId, setDocumentId] = useState("");
  const [queue, setQueue] = useState<KioskSigner[]>([]);
  const [embedUrl, setEmbedUrl] = useState<string | null>(null);
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);
  const [allDone, setAllDone] = useState(false);
  const currentRef = useRef<KioskSigner | null>(null);
  // The origin of the currently-framed signing URL — the only origin we accept a completion from.
  const expectedOriginRef = useRef<string | null>(null);

  // Frame a signer: a `ready` signer already has a URL; a `pending` one is minted on demand.
  async function frame(signer: KioskSigner, docId: string) {
    currentRef.current = signer;
    let url = signer.embedUrl;
    if (!url) {
      setStatus(`Preparing ${signer.name}'s turn…`);
      // Retry: the backend advances the signing turn a beat after the previous signer's
      // `turbosign:completed` event, so the first mint can momentarily be "not their turn".
      url = await mintNextWithRetry({ documentId: docId, recipientId: signer.recipientId });
    }
    try {
      expectedOriginRef.current = new URL(url).origin;
    } catch {
      /* keep the prior expected origin */
    }
    setEmbedUrl(url);
    setQueue((q) => q.map((s) => (s.recipientId === signer.recipientId ? { ...s, status: "ready" } : s)));
    setStatus(`${signer.name}: check your email for a 6-digit code, verify it, then sign.`);
  }

  useEffect(() => {
    const handler = async (event: MessageEvent) => {
      const expected = TURBOSIGN_ORIGIN ?? expectedOriginRef.current;
      if (!expected || event.origin !== expected) return;
      if (!event.data || (event.data as { type?: string }).type !== "turbosign:completed") return;

      const done = currentRef.current;
      const next = queue.find((s) => s.recipientId !== done?.recipientId && s.status !== "completed");
      setQueue((q) => q.map((s) => (s.recipientId === done?.recipientId ? { ...s, status: "completed" } : s)));
      setEmbedUrl(null);
      if (!next) {
        setStatus("");
        setAllDone(true);
        return;
      }
      try {
        await frame(next, documentId);
      } catch (err) {
        setStatus(`Could not load the next signer: ${err instanceof Error ? err.message : String(err)}`);
      }
    };
    window.addEventListener("message", handler);
    return () => window.removeEventListener("message", handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queue, documentId]);

  async function onStart(e: React.FormEvent) {
    e.preventDefault();
    const signers = inputs.map((s) => ({ name: s.name.trim(), email: s.email.trim() }));
    if (signers.some((s) => !s.name || !s.email)) return;
    setBusy(true);
    setStatus("Creating the document and preparing the first signer…");
    try {
      const res = await startKiosk(signers);
      setDocumentId(res.documentId);
      setQueue(res.recipients);
      // Pass documentId explicitly — the `documentId` state set just above hasn't committed for this
      // render yet, so `frame` must not read it from state on the first call.
      await frame(res.recipients[0], res.documentId);
    } catch (err) {
      setStatus(`Could not start signing: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setBusy(false);
    }
  }

  const started = queue.length > 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">Everyone signs, one after another</CardTitle>
        <CardDescription>
          One document, two signers, in order, on the same device. The first signs now; when they finish, the
          kiosk mints the next signer's URL just-in-time and loads their turn automatically. A later signer's URL
          isn't created until it's genuinely their turn.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        {!started && (
          <form onSubmit={onStart} className="space-y-4">
            {inputs.map((s, i) => (
              <div key={i} className="space-y-2 rounded-lg border p-3">
                <p className="text-sm font-medium">Signer {i + 1} {i === 0 ? "(signs first)" : "(signs next)"}</p>
                <div className="space-y-2">
                  <Label htmlFor={`name-${i}`}>Full name</Label>
                  <Input
                    id={`name-${i}`}
                    value={s.name}
                    onChange={(e) => setInputs((v) => v.map((x, j) => (j === i ? { ...x, name: e.target.value } : x)))}
                    placeholder={i === 0 ? "Alex Rivera" : "Sam Chen"}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor={`email-${i}`}>Email</Label>
                  <Input
                    id={`email-${i}`}
                    type="email"
                    value={s.email}
                    onChange={(e) => setInputs((v) => v.map((x, j) => (j === i ? { ...x, email: e.target.value } : x)))}
                    placeholder={i === 0 ? "alex@example.com" : "sam@example.com"}
                    required
                  />
                </div>
              </div>
            ))}
            <Button type="submit" disabled={busy}>
              {busy ? "Starting…" : "Start signing"}
            </Button>
          </form>
        )}

        {started && (
          <ul className="space-y-1 text-sm">
            {queue.map((s) => (
              <li
                key={s.recipientId}
                className={
                  s.status === "ready"
                    ? "font-medium text-primary"
                    : s.status === "completed"
                      ? "text-emerald-600 dark:text-emerald-400"
                      : "text-muted-foreground"
                }
              >
                {s.name} &lt;{s.email}&gt;
                {s.status === "ready" ? " — signing now" : s.status === "completed" ? " — done" : " — waiting"}
              </li>
            ))}
          </ul>
        )}

        {embedUrl && (
          <div className="overflow-hidden rounded-xl border">
            <iframe src={embedUrl} title="Sign the document" allow="clipboard-write" className="block h-[720px] w-full" />
          </div>
        )}

        {allDone && (
          <div className="flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-5 text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-200">
            <CheckCircle2 className="mt-0.5 size-5 shrink-0" />
            <div>
              <p className="font-semibold">All signers are done.</p>
              <p className="text-sm">The completed document has been recorded and emailed to everyone.</p>
            </div>
          </div>
        )}

        {status && <p className="text-sm text-muted-foreground">{status}</p>}
      </CardContent>
    </Card>
  );
}
