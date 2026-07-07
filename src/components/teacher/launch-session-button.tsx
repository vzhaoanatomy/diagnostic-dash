"use client";

import { useTransition } from "react";
import { Play } from "lucide-react";
import { launchSession } from "@/lib/actions/game";
import { Button } from "@/components/ui/button";

export function LaunchSessionButton({ caseId }: { caseId: string }) {
  const [isPending, startTransition] = useTransition();

  return (
    <Button
      size="sm"
      disabled={isPending}
      onClick={() => startTransition(() => launchSession(caseId))}
    >
      <Play className="h-4 w-4" />
      {isPending ? "Launching..." : "Launch"}
    </Button>
  );
}
