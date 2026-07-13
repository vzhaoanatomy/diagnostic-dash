"use client";

import { useEffect, useState } from "react";
import QRCode from "react-qr-code";
import { Check, Copy, Eye } from "lucide-react";
import { buildViewerUrl } from "@/lib/view-url";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function TeamSharePanel({
  teamId,
  teamName,
  captainPin,
}: {
  teamId: string;
  teamName: string;
  captainPin?: string | null;
}) {
  const [viewerUrl, setViewerUrl] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setViewerUrl(buildViewerUrl(teamId));
  }, [teamId]);

  async function handleCopy() {
    if (!viewerUrl) return;
    try {
      await navigator.clipboard.writeText(viewerUrl);
    } catch {
      const input = document.createElement("textarea");
      input.value = viewerUrl;
      document.body.appendChild(input);
      input.select();
      document.execCommand("copy");
      document.body.removeChild(input);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <Card className="border-medical-teal/30 bg-medical-mint/10">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <Eye className="h-4 w-4" />
          Share with teammates (view only)
        </CardTitle>
        <CardDescription>
          Other students at your table scan this on their iPads — they can follow along but cannot
          order or submit.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start">
          <div className="rounded-lg border bg-white p-3">
            {viewerUrl ? (
              <QRCode value={viewerUrl} size={160} level="M" />
            ) : (
              <div className="flex h-[160px] w-[160px] items-center justify-center text-sm text-muted-foreground">
                Loading…
              </div>
            )}
          </div>
          <div className="min-w-0 flex-1 space-y-3">
            {captainPin && (
              <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm">
                <span className="font-medium text-amber-900">Captain PIN: </span>
                <span className="font-mono text-lg font-bold tracking-widest text-amber-950">
                  {captainPin}
                </span>
                <p className="mt-1 text-xs text-amber-800">
                  Save this PIN — needed if another device must become captain.
                </p>
              </div>
            )}
            <p className="break-all rounded-md border bg-background px-3 py-2 font-mono text-xs">
              {viewerUrl || "…"}
            </p>
            <Button type="button" size="sm" variant="outline" onClick={handleCopy} disabled={!viewerUrl}>
              {copied ? (
                <>
                  <Check className="h-4 w-4" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4" />
                  Copy viewer link
                </>
              )}
            </Button>
            <p className="text-xs text-muted-foreground">
              Team: <strong>{teamName}</strong> · Only this device orders clues and submits.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
