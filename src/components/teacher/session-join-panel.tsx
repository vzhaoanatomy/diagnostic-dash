"use client";

import { useEffect, useState } from "react";
import QRCode from "react-qr-code";
import { Check, Copy, Link2 } from "lucide-react";
import { buildJoinUrl } from "@/lib/join-url";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function SessionJoinPanel({ joinCode }: { joinCode: string }) {
  const [joinUrl, setJoinUrl] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setJoinUrl(buildJoinUrl(joinCode));
  }, [joinCode]);

  async function handleCopy() {
    if (!joinUrl) return;
    try {
      await navigator.clipboard.writeText(joinUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for older browsers / non-HTTPS
      const input = document.createElement("textarea");
      input.value = joinUrl;
      document.body.appendChild(input);
      input.select();
      document.execCommand("copy");
      document.body.removeChild(input);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  return (
    <Card className="border-primary/20 bg-primary/5">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">Students join here</CardTitle>
        <CardDescription>
          Scan the QR code or open the link — then enter a team name. Code:{" "}
          <span className="font-mono font-semibold tracking-widest">{joinCode}</span>
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-start">
          <div className="rounded-xl border bg-white p-4 shadow-sm">
            {joinUrl ? (
              <QRCode value={joinUrl} size={200} level="M" />
            ) : (
              <div className="flex h-[200px] w-[200px] items-center justify-center text-sm text-muted-foreground">
                Loading…
              </div>
            )}
          </div>

          <div className="min-w-0 flex-1 space-y-4">
            <div>
              <p className="mb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Join link
              </p>
              <p className="break-all rounded-md border bg-background px-3 py-2 font-mono text-sm">
                {joinUrl || "…"}
              </p>
            </div>

            <Button type="button" variant="outline" onClick={handleCopy} disabled={!joinUrl}>
              {copied ? (
                <>
                  <Check className="h-4 w-4" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4" />
                  Copy join link
                </>
              )}
            </Button>

            <div className="flex items-start gap-2 text-sm text-muted-foreground">
              <Link2 className="mt-0.5 h-4 w-4 shrink-0" />
              <p>
                Students can scan the QR or tap the link. The session code fills in automatically;
                they only need to pick a team name.
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
