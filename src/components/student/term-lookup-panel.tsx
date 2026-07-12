"use client";

import { useState } from "react";
import { BookMarked, X } from "lucide-react";
import { lookupMedicalTerm } from "@/lib/actions/lookup-term";
import { MAX_LOOKUP_WORDS } from "@/lib/game-rules";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function TermLookupPanel({
  teamId,
  disabled,
}: {
  teamId: string;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [definition, setDefinition] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleLookup(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setDefinition(null);

    const result = await lookupMedicalTerm(teamId, query);
    if (result.success) {
      setDefinition(result.definition);
    } else {
      setError(result.error);
    }
    setLoading(false);
  }

  if (!open) {
    return (
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="border-medical-teal/30 bg-white/80"
        onClick={() => setOpen(true)}
        disabled={disabled}
      >
        <BookMarked className="mr-1 h-4 w-4" />
        Term Lookup
      </Button>
    );
  }

  return (
    <Card className="fixed bottom-4 right-4 z-50 w-[min(100vw-2rem,22rem)] shadow-lg">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-base">Term Lookup</CardTitle>
        <Button type="button" variant="ghost" size="sm" onClick={() => setOpen(false)}>
          <X className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-xs text-muted-foreground">
          Free vocabulary help — max {MAX_LOOKUP_WORDS} words. Won&apos;t diagnose the case.
        </p>
        <form onSubmit={handleLookup} className="space-y-2">
          <Label htmlFor="term-lookup" className="sr-only">
            Medical term
          </Label>
          <Input
            id="term-lookup"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder='e.g. "bradycardia" or "what is TSH"'
            disabled={disabled || loading}
            maxLength={80}
          />
          <Button type="submit" size="sm" className="w-full medical-btn-student" disabled={disabled || loading}>
            {loading ? "Looking up..." : "Define term"}
          </Button>
        </form>
        {error && <p className="text-xs text-destructive">{error}</p>}
        {definition && (
          <div className="rounded-md bg-medical-mint/15 p-3 text-sm leading-relaxed">{definition}</div>
        )}
      </CardContent>
    </Card>
  );
}
