"use client";

import { useEffect, useState } from "react";
import { clearRoundTimer, startRoundTimer } from "@/lib/actions/presentation";
import { Button } from "@/components/ui/button";

const PRESETS = [
  { label: "90 sec", seconds: 90 },
  { label: "2 min", seconds: 120 },
  { label: "3 min", seconds: 180 },
];

export function SessionRoundTimer({
  sessionId,
  endsAt,
}: {
  sessionId: string;
  endsAt: string | null;
}) {
  const [remaining, setRemaining] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!endsAt) {
      setRemaining(null);
      return;
    }
    function tick() {
      const ms = new Date(endsAt!).getTime() - Date.now();
      setRemaining(ms > 0 ? Math.ceil(ms / 1000) : 0);
    }
    tick();
    const id = setInterval(tick, 500);
    return () => clearInterval(id);
  }, [endsAt]);

  async function handleStart(seconds: number) {
    setLoading(true);
    try {
      await startRoundTimer(sessionId, seconds);
    } finally {
      setLoading(false);
    }
  }

  async function handleClear() {
    setLoading(true);
    try {
      await clearRoundTimer(sessionId);
    } finally {
      setLoading(false);
    }
  }

  const display =
    remaining !== null && remaining > 0
      ? `${Math.floor(remaining / 60)}:${(remaining % 60).toString().padStart(2, "0")}`
      : null;

  return (
    <div className="rounded-lg border bg-white p-4 shadow-sm">
      <p className="mb-2 text-sm font-semibold">Round timer (project this screen)</p>
      {display ? (
        <p className="mb-3 font-mono text-5xl font-bold tabular-nums text-primary">{display}</p>
      ) : (
        <p className="mb-3 text-sm text-muted-foreground">No timer running</p>
      )}
      <div className="flex flex-wrap gap-2">
        {PRESETS.map((p) => (
          <Button
            key={p.seconds}
            size="sm"
            variant="outline"
            disabled={loading}
            onClick={() => handleStart(p.seconds)}
          >
            {p.label}
          </Button>
        ))}
        {endsAt && (
          <Button size="sm" variant="ghost" disabled={loading} onClick={handleClear}>
            Clear
          </Button>
        )}
      </div>
    </div>
  );
}
