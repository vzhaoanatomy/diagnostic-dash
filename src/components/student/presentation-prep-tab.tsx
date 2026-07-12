"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Download, FileText } from "lucide-react";
import { updateTeamPresentationPrep } from "@/lib/actions/presentation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { Team } from "@/lib/types/database";

type SaveStatus = "idle" | "saving" | "saved" | "error";

function buildSnapshot(
  pathophys: string,
  treatment: string[],
  keyOrders: string,
  journey: string,
  notes: string
) {
  return JSON.stringify({ pathophys, treatment, keyOrders, journey, notes });
}

function snapshotFromTeam(team: Team) {
  const treatment =
    team.treatment_plan?.length >= 3
      ? team.treatment_plan
      : [...(team.treatment_plan ?? []), "", "", ""].slice(0, 3);
  return buildSnapshot(
    team.pathophys_explanation ?? "",
    treatment,
    team.key_orders_reflection ?? "",
    team.purchase_journey ?? "",
    team.presentation_notes ?? ""
  );
}

export function PresentationPrepTab({
  teamId,
  team,
  sessionEnded,
  isActive,
}: {
  teamId: string;
  team: Team;
  sessionEnded: boolean;
  isActive: boolean;
}) {
  const initialTreatment =
    team.treatment_plan?.length >= 3
      ? team.treatment_plan
      : [...(team.treatment_plan ?? []), "", "", ""].slice(0, 3);

  const [pathophys, setPathophys] = useState(team.pathophys_explanation ?? "");
  const [treatment, setTreatment] = useState<string[]>(initialTreatment);
  const [keyOrders, setKeyOrders] = useState(team.key_orders_reflection ?? "");
  const [journey, setJourney] = useState(team.purchase_journey ?? "");
  const [notes, setNotes] = useState(team.presentation_notes ?? "");
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const [error, setError] = useState<string | null>(null);

  const lastSavedRef = useRef(snapshotFromTeam(team));
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const savingRef = useRef(false);
  const valuesRef = useRef({ pathophys, treatment, keyOrders, journey, notes });

  const hasSubmitted = !!team.submitted_at;

  valuesRef.current = { pathophys, treatment, keyOrders, journey, notes };

  const saveNow = useCallback(async () => {
    if (!hasSubmitted || savingRef.current) return;

    const { pathophys: p, treatment: t, keyOrders: k, journey: j, notes: n } = valuesRef.current;
    const snapshot = buildSnapshot(p, t, k, j, n);
    if (snapshot === lastSavedRef.current) return;

    savingRef.current = true;
    setSaveStatus("saving");
    setError(null);

    try {
      await updateTeamPresentationPrep(teamId, {
        pathophys_explanation: p,
        treatment_plan: t,
        key_orders_reflection: k,
        purchase_journey: j,
        presentation_notes: n,
      });
      lastSavedRef.current = snapshot;
      setSaveStatus("saved");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
      setSaveStatus("error");
    } finally {
      savingRef.current = false;
    }
  }, [hasSubmitted, teamId]);

  // Debounced auto-save while typing
  useEffect(() => {
    if (!hasSubmitted) return;

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      void saveNow();
    }, 900);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [pathophys, treatment, keyOrders, journey, notes, hasSubmitted, saveNow]);

  // Save immediately when leaving this tab
  useEffect(() => {
    if (!isActive && hasSubmitted) {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
        debounceRef.current = null;
      }
      void saveNow();
    }
  }, [isActive, hasSubmitted, saveNow]);

  // Flush on unmount (tab hidden / page leave)
  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      void saveNow();
    };
  }, [saveNow]);

  if (!hasSubmitted) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          Submit your diagnosis first, then complete this workbook for your class presentation.
        </CardContent>
      </Card>
    );
  }

  const saveLabel =
    saveStatus === "saving"
      ? "Saving..."
      : saveStatus === "saved"
        ? "All changes saved"
        : saveStatus === "error"
          ? "Save failed — still trying as you type"
          : "Auto-saves as you work";

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-medical-teal/30 bg-medical-mint/15 p-3 text-sm">
        Your work auto-saves when you switch tabs.{" "}
        {sessionEnded
          ? "Session ended — finish your presentation for next class."
          : "Use Case File and Order Clues to gather details, then come back here."}
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <CardTitle>Presentation Prep</CardTitle>
              <CardDescription>
                Post-diagnosis workbook — prepare to present your thought process and purchase
                journey to other teams.
              </CardDescription>
            </div>
            <p
              className={`text-xs ${
                saveStatus === "error" ? "text-destructive" : "text-muted-foreground"
              }`}
              aria-live="polite"
            >
              {saveLabel}
            </p>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Connect the dots — why does this diagnosis fit?</Label>
            <Textarea
              value={pathophys}
              onChange={(e) => setPathophys(e.target.value)}
              rows={4}
              placeholder="Explain the pathophysiology in 2–4 sentences..."
            />
          </div>

          <div className="space-y-2">
            <Label>Treatment plan (3 items)</Label>
            {treatment.map((item, i) => (
              <Input
                key={i}
                value={item}
                onChange={(e) => {
                  const updated = [...treatment];
                  updated[i] = e.target.value;
                  setTreatment(updated);
                }}
                placeholder={`Treatment / next step ${i + 1}`}
              />
            ))}
          </div>

          <div className="space-y-2">
            <Label>Most important orders — which 2–3 clues mattered most? Why?</Label>
            <Textarea
              value={keyOrders}
              onChange={(e) => setKeyOrders(e.target.value)}
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label>
              Purchase journey — what did you order, in what order, and how did your thinking
              change?
            </Label>
            <Textarea value={journey} onChange={(e) => setJourney(e.target.value)} rows={4} />
          </div>

          <div className="space-y-2">
            <Label>Presentation notes (for presenting to other teams)</Label>
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} />
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <div className="border-t pt-4">
            <p className="mb-3 text-sm font-medium">Download your presentation</p>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" size="sm" asChild>
                <a href={`/play/${teamId}/print`} target="_blank" rel="noopener noreferrer">
                  <FileText className="mr-1 h-4 w-4" />
                  PDF / Print
                </a>
              </Button>
              <Button size="sm" className="medical-btn-student" asChild>
                <a href={`/api/play/${teamId}/export/pptx`}>
                  <Download className="mr-1 h-4 w-4" />
                  PowerPoint
                </a>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
