"use client";

import { useTransition, useState } from "react";
import { Play } from "lucide-react";
import { launchSession } from "@/lib/actions/game";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

export function LaunchSessionButton({ caseId }: { caseId: string }) {
  const [isPending, startTransition] = useTransition();
  const [strictMode, setStrictMode] = useState(false);

  return (
    <div className="flex flex-col items-end gap-2">
      <label className="flex cursor-pointer items-center gap-2 text-xs text-muted-foreground">
        <input
          type="checkbox"
          checked={strictMode}
          onChange={(e) => setStrictMode(e.target.checked)}
          className="rounded border-input"
        />
        <Label className="cursor-pointer font-normal">Strict mode (interview before tests)</Label>
      </label>
      <Button
        size="sm"
        disabled={isPending}
        onClick={() => startTransition(() => launchSession(caseId, strictMode))}
      >
        <Play className="h-4 w-4" />
        {isPending ? "Launching..." : "Launch"}
      </Button>
    </div>
  );
}
