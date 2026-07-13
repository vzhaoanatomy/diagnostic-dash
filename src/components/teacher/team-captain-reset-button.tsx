"use client";

import { useState } from "react";
import { KeyRound } from "lucide-react";
import { resetTeamCaptain } from "@/lib/actions/captain";
import { Button } from "@/components/ui/button";

export function TeamCaptainResetButton({
  teamId,
  sessionId,
  teamName,
  captainPin,
  onReset,
}: {
  teamId: string;
  sessionId: string;
  teamName: string;
  captainPin?: string | null;
  onReset?: (newPin: string) => void;
}) {
  const [loading, setLoading] = useState(false);
  const [pin, setPin] = useState(captainPin ?? null);
  const [message, setMessage] = useState<string | null>(null);

  async function handleReset() {
    if (!confirm(`Reset captain PIN for ${teamName}? The current captain iPad will need the new PIN.`)) {
      return;
    }
    setLoading(true);
    setMessage(null);
    try {
      const { captainPin: newPin } = await resetTeamCaptain(teamId, sessionId);
      setPin(newPin);
      setMessage(`New captain PIN: ${newPin}`);
      onReset?.(newPin);
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Reset failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mt-3 space-y-2 border-t pt-3">
      <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
        <KeyRound className="h-3.5 w-3.5" />
        {pin ? (
          <span>
            Captain PIN:{" "}
            <span className="font-mono font-semibold tracking-widest text-foreground">{pin}</span>
          </span>
        ) : (
          <span>Captain PIN not set</span>
        )}
      </div>
      <Button size="sm" variant="outline" disabled={loading} onClick={handleReset}>
        {loading ? "Resetting…" : "Reset captain PIN"}
      </Button>
      {message && <p className="text-xs text-muted-foreground">{message}</p>}
    </div>
  );
}
