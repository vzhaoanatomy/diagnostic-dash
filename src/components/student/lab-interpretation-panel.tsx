"use client";

import { useEffect, useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import type { CaseMenuItem } from "@/lib/types/database";

export function LabInterpretationPanel({ item }: { item: CaseMenuItem }) {
  const [open, setOpen] = useState(false);
  const hasLabHelp =
    (item.reference_range?.trim() || item.interpretation?.trim()) &&
    (item.item_type === "test" || item.item_type === "image");

  if (!hasLabHelp) return null;

  return (
    <div className="mt-3 rounded-md border border-blue-200/80 bg-blue-50/50">
      <button
        type="button"
        className="flex w-full items-center justify-between px-3 py-2 text-left text-sm font-medium text-blue-900"
        onClick={() => setOpen(!open)}
      >
        How to read this (general — not specific to this patient)
        {open ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
      </button>
      {open && (
        <div className="space-y-2 border-t border-blue-200/80 px-3 py-2 text-sm text-blue-950">
          {item.reference_range?.trim() && (
            <p>
              <span className="font-medium">Reference: </span>
              {item.reference_range}
            </p>
          )}
          {item.interpretation?.trim() && <p>{item.interpretation}</p>}
        </div>
      )}
    </div>
  );
}

/** Student-facing countdown synced to session timer */
export function RoundTimerBanner({ endsAt }: { endsAt: string | null }) {
  const [remaining, setRemaining] = useState<number | null>(null);

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

  if (remaining === null || remaining <= 0) return null;

  const m = Math.floor(remaining / 60);
  const s = remaining % 60;

  return (
    <div className="bg-blue-50 px-4 py-2 text-center text-sm font-medium text-blue-900">
      Round timer: {m}:{s.toString().padStart(2, "0")} remaining
    </div>
  );
}
