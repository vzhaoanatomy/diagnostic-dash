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
  readOnly = false,
  captainToken = null,
}: {
  teamId: string;
  team: Team;
  sessionEnded: boolean;
  isActive: boolean;
  readOnly?: boolean;
  captainToken?: string | null;
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

  useEffect(() => {
    const nextTreatment =
      team.treatment_plan?.length >= 3
        ? team.treatment_plan
        : [...(team.treatment_plan ?? []), "", "", ""].slice(0, 3);
    setPathophys(team.pathophys_explanation ?? "");
    setTreatment(nextTreatment);
    setKeyOrders(team.key_orders_reflection ?? "");
    setJourney(team.purchase_journey ?? "");
    setNotes(team.presentation_notes ?? "");
    lastSavedRef.current = snapshotFromTeam(team);
  }, [team]);

  const saveNow = useCallback(async () => {
    if (!hasSubmitted || savingRef.current || readOnly) return;

    const { pathophys: p, treatment: t, keyOrders: k, journey: j, notes: n } = valuesRef.current;
    const snapshot = buildSnapshot(p, t, k, j, n);
    if (snapshot === lastSavedRef.current) return;

    savingRef.current = true;
    setSaveStatus("saving");
    setError(null);

    try {
      await updateTeamPresentationPrep(
        teamId,
        {
          pathophys_explanation: p,
          treatment_plan: t,
          key_orders_reflection: k,
          purchase_journey: j,
          presentation_notes: n,
        },
        captainToken
      );
      lastSavedRef.current = snapshot;
      setSaveStatus("saved");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
      setSaveStatus("error");
    } finally {
      savingRef.current = false;
    }
  }, [hasSubmitted, teamId, captainToken, readOnly]);

  // Debounced auto-save while typing
  useEffect(() => {
    if (!hasSubmitted || readOnly) return;

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      void saveNow();
    }, 900);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [pathophys, treatment, keyOrders, journey, notes, hasSubmitted, saveNow, readOnly]);

  // Save immediately when leaving this tab
  useEffect(() => {
    if (!isActive && hasSubmitted && !readOnly) {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
        debounceRef.current = null;
      }
      void saveNow();
    }
  }, [isActive, hasSubmitted, saveNow, readOnly]);

  // Flush on unmount (tab hidden / page leave)
  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      if (!readOnly) void saveNow();
    };
  }, [saveNow, readOnly]);

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
        {readOnly
          ? "View only — your captain edits this workbook on the ordering iPad."
          : sessionEnded
            ? "Session ended — finish your presentation for next class."
            : "Your work auto-saves when you switch tabs. Use Case File to gather details."}
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
              {readOnly
                ? "Read-only"
                : saveLabel}
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
              readOnly={readOnly}
              disabled={readOnly}
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
                readOnly={readOnly}
                disabled={readOnly}
              />
            ))}
          </div>

          <div className="space-y-2">
            <Label>Most important orders — which 2–3 clues mattered most? Why?</Label>
            <Textarea
              value={keyOrders}
              onChange={(e) => setKeyOrders(e.target.value)}
              rows={3}
              readOnly={readOnly}
              disabled={readOnly}
            />
          </div>

          <div className="space-y-2">
            <Label>
              Purchase journey — what did you order, in what order, and how did your thinking
              change?
            </Label>
            <Textarea value={journey} onChange={(e) => setJourney(e.target.value)} rows={4} readOnly={readOnly} disabled={readOnly} />
          </div>

          <div className="space-y-2">
            <Label>Presentation notes (for presenting to other teams)</Label>
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} readOnly={readOnly} disabled={readOnly} />
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
