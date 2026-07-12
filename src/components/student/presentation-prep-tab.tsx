"use client";

import { useState } from "react";
import { updateTeamPresentationPrep } from "@/lib/actions/presentation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { Team } from "@/lib/types/database";

export function PresentationPrepTab({
  teamId,
  team,
  sessionEnded,
}: {
  teamId: string;
  team: Team;
  sessionEnded: boolean;
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
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const hasSubmitted = !!team.submitted_at;

  if (!hasSubmitted) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          Submit your diagnosis first, then complete this workbook for your class presentation.
        </CardContent>
      </Card>
    );
  }

  async function handleSave() {
    setLoading(true);
    setError(null);
    try {
      await updateTeamPresentationPrep(teamId, {
        pathophys_explanation: pathophys,
        treatment_plan: treatment,
        key_orders_reflection: keyOrders,
        purchase_journey: journey,
        presentation_notes: notes,
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      {sessionEnded && (
        <div className="rounded-lg border border-medical-teal/30 bg-medical-mint/15 p-3 text-sm">
          Session ended — finish your presentation prep for next class. Your teacher can download
          your report as PDF or PowerPoint.
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Presentation Prep</CardTitle>
          <CardDescription>
            Post-diagnosis workbook — prepare to present your thought process and purchase journey
            to other teams.
          </CardDescription>
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
            <Label>Purchase journey — what did you order, in what order, and how did your thinking change?</Label>
            <Textarea
              value={journey}
              onChange={(e) => setJourney(e.target.value)}
              rows={4}
            />
          </div>

          <div className="space-y-2">
            <Label>Presentation notes (for presenting to other teams)</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <Button className="medical-btn-student" onClick={handleSave} disabled={loading}>
            {saved ? "Saved!" : loading ? "Saving..." : "Save presentation prep"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
