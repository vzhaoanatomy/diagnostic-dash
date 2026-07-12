"use client";

import { useState } from "react";
import { updateTeamFinalBudget } from "@/lib/actions/presentation";
import { computeFinalBudget } from "@/lib/scoring";
import type { Team } from "@/lib/types/database";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function TeamFinalBudgetEditor({
  team,
  sessionId,
  onUpdated,
}: {
  team: Team;
  sessionId: string;
  onUpdated?: () => void;
}) {
  const [value, setValue] = useState(String(computeFinalBudget(team)));
  const [loading, setLoading] = useState(false);

  async function handleSave() {
    const amount = parseInt(value, 10);
    if (Number.isNaN(amount)) return;
    setLoading(true);
    try {
      await updateTeamFinalBudget(team.id, sessionId, amount);
      onUpdated?.();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-muted-foreground">Final $</span>
      <Input
        type="number"
        className="h-8 w-20"
        value={value}
        onChange={(e) => setValue(e.target.value)}
      />
      <Button size="sm" variant="outline" className="h-8" disabled={loading} onClick={handleSave}>
        Set
      </Button>
    </div>
  );
}
