import { useState } from "react";
import { Layers, PenLine, Users } from "lucide-react";

import { cn } from "@/lib/utils";
import { Kiosk } from "@/pages/Kiosk";
import { SingleSigner } from "@/pages/SingleSigner";
import { Widget } from "@/pages/Widget";

type Path = "single" | "kiosk" | "widget";

const PATHS: Array<{ id: Path; label: string; blurb: string; icon: typeof PenLine }> = [
  { id: "single", label: "Single signer", blurb: "One recipient, email OTP, hand-rolled iframe", icon: PenLine },
  { id: "kiosk", label: "Sequential kiosk", blurb: "Two signers in order on one device (turn-aware)", icon: Users },
  { id: "widget", label: "Widget", blurb: "Same flow via the <TurboSignForm> drop-in", icon: Layers },
];

export default function App() {
  const [path, setPath] = useState<Path>("single");

  return (
    <div className="min-h-svh bg-muted/30">
      <header className="border-b bg-background">
        <div className="mx-auto flex max-w-4xl items-center gap-3 px-4 py-4">
          <div className="size-7 rounded-lg bg-primary" aria-hidden />
          <div>
            <p className="text-sm font-semibold leading-tight tracking-tight">TurboDocx · Embedded Signing</p>
            <p className="text-xs text-muted-foreground">Three ways to embed TurboSign, one app</p>
          </div>
        </div>
        <nav className="mx-auto flex max-w-4xl gap-2 px-4 pb-3">
          {PATHS.map((p) => {
            const Icon = p.icon;
            const active = p.id === path;
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => setPath(p.id)}
                className={cn(
                  "flex flex-1 flex-col items-start gap-0.5 rounded-lg border px-3 py-2 text-left transition-colors",
                  active ? "border-primary bg-primary/5" : "hover:bg-accent",
                )}
                aria-current={active ? "page" : undefined}
              >
                <span className="flex items-center gap-1.5 text-sm font-medium">
                  <Icon className="size-4" />
                  {p.label}
                </span>
                <span className="text-xs text-muted-foreground">{p.blurb}</span>
              </button>
            );
          })}
        </nav>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-8">
        {path === "single" && <SingleSigner />}
        {path === "kiosk" && <Kiosk />}
        {path === "widget" && <Widget />}

        <p className="mt-4 text-xs text-muted-foreground">
          The API key never reaches the browser: this app calls its own backend
          (<code className="rounded bg-muted px-1">server.ts</code>) over <code className="rounded bg-muted px-1">/api</code>,
          and that server holds the key and talks to TurboDocx. The iframe renders only if this app&apos;s origin is on
          your org&apos;s embedded-signing allowed origins.
        </p>
      </main>
    </div>
  );
}
