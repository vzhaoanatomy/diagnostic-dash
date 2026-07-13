"use client";

import { useState } from "react";
import { KeyRound } from "lucide-react";
import { verifyCaptainPin } from "@/lib/actions/captain";
import { storeCaptainToken } from "@/lib/captain-client";
import { buildViewerUrl } from "@/lib/view-url";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function CaptainPinGate({
  teamId,
  teamName,
  onUnlocked,
}: {
  teamId: string;
  teamName: string;
  onUnlocked: () => void;
}) {
  const [pin, setPin] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const { captainToken } = await verifyCaptainPin(teamId, pin);
      storeCaptainToken(teamId, captainToken);
      onUnlocked();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not verify PIN");
    } finally {
      setLoading(false);
    }
  }

  return (
    <MedicalShellCenter>
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <KeyRound className="mx-auto mb-2 h-8 w-8 text-medical-teal" />
          <CardTitle>Captain device</CardTitle>
          <CardDescription>
            Enter the captain PIN for <strong>{teamName}</strong> to order clues and submit on this
            iPad.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="captain-pin">Captain PIN</Label>
              <Input
                id="captain-pin"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={4}
                value={pin}
                onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 4))}
                className="text-center font-mono text-2xl tracking-[0.3em]"
                placeholder="••••"
                required
                autoFocus
              />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button type="submit" className="medical-btn-student w-full" disabled={loading || pin.length < 4}>
              {loading ? "Verifying…" : "Unlock captain mode"}
            </Button>
          </form>
          <div className="border-t pt-4 text-center text-sm text-muted-foreground">
            <p>Teammate with your own iPad?</p>
            <a href={buildViewerUrl(teamId)} className="font-medium text-medical-teal hover:underline">
              Open view-only mode →
            </a>
          </div>
        </CardContent>
      </Card>
    </MedicalShellCenter>
  );
}

function MedicalShellCenter({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4 py-8">{children}</div>
  );
}
