"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
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
  const [mounted, setMounted] = useState(false);
  const [query, setQuery] = useState("");
  const [definition, setDefinition] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!open) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open]);

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

  function closePanel() {
    setOpen(false);
  }

  const panel =
    open && mounted
      ? createPortal(
          <>
            <button
              type="button"
              className="fixed inset-0 z-[200] bg-black/30"
              aria-label="Close term lookup"
              onClick={closePanel}
            />
            <Card
              role="dialog"
              aria-modal="true"
              aria-labelledby="term-lookup-title"
              className="fixed left-1/2 top-1/2 z-[201] w-[min(calc(100vw-2rem),24rem)] -translate-x-1/2 -translate-y-1/2 shadow-xl"
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle id="term-lookup-title" className="text-base">
                  Term Lookup
                </CardTitle>
                <Button type="button" variant="ghost" size="sm" onClick={closePanel}>
                  <X className="h-4 w-4" />
                </Button>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-xs text-muted-foreground">
                  Free vocabulary help — max {MAX_LOOKUP_WORDS} words. Use this for terms in your
                  clues you don&apos;t understand.
                </p>
                <form onSubmit={handleLookup} className="space-y-2">
                  <Label htmlFor="term-lookup-input">Medical term</Label>
                  <Input
                    id="term-lookup-input"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder='e.g. bradycardia or "what is TSH"'
                    disabled={disabled || loading}
                    maxLength={80}
                    autoFocus
                  />
                  <Button
                    type="submit"
                    size="sm"
                    className="medical-btn-student w-full"
                    disabled={disabled || loading}
                  >
                    {loading ? "Looking up..." : "Define term"}
                  </Button>
                </form>
                {error && <p className="text-xs text-destructive">{error}</p>}
                {definition && (
                  <div className="rounded-md bg-medical-mint/15 p-3 text-sm leading-relaxed">
                    {definition}
                  </div>
                )}
              </CardContent>
            </Card>
          </>,
          document.body
        )
      : null;

  return (
    <>
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="shrink-0 border-medical-teal/30 bg-white/80"
        onClick={() => setOpen(true)}
        disabled={disabled}
      >
        <BookMarked className="mr-1 h-4 w-4" />
        Term Lookup
      </Button>
      {panel}
    </>
  );
}
