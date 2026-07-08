"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import type {
  Team,
  Case,
  CaseMenuItem,
  GameSession,
  TeamPurchase,
} from "@/lib/types/database";
import { purchaseItem, updateTeamNotes, submitDiagnosis } from "@/lib/actions/game";
import { formatCurrency, sessionStatusLabel } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { MedicalShell, MedicalIconBadge } from "@/components/layout/medical-shell";
import {
  Stethoscope,
  ShoppingCart,
  FileText,
  Send,
  DollarSign,
  AlertCircle,
  CheckCircle,
} from "lucide-react";

interface PlayData {
  team: Team;
  session: GameSession;
  caseData: Case;
  menuItems: CaseMenuItem[];
  purchases: (TeamPurchase & { menu_item: CaseMenuItem })[];
}

export function TeamGameView({ teamId, initialData }: { teamId: string; initialData: PlayData }) {
  const [data, setData] = useState(initialData);
  const [notes, setNotes] = useState(initialData.team.shared_notes);
  const [diagnosis, setDiagnosis] = useState(initialData.team.diagnosis ?? "");
  const [evidence, setEvidence] = useState<string[]>(
    initialData.team.evidence.length > 0
      ? initialData.team.evidence
      : ["", "", ""]
  );
  const [alternateDiagnosis, setAlternateDiagnosis] = useState(
    initialData.team.alternate_diagnosis ?? ""
  );
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notesSaved, setNotesSaved] = useState(false);

  const purchasedIds = new Set(data.purchases.map((p) => p.menu_item_id));
  const isPaused = data.session.status === "paused";
  const isEnded = data.session.status === "ended";
  const isActive = data.session.status === "active" || data.session.status === "waiting";
  const hasSubmitted = !!data.team.submitted_at;

  const refreshData = useCallback(async () => {
    const supabase = createClient();

    const { data: team } = await supabase
      .from("teams")
      .select("*")
      .eq("id", teamId)
      .single();

    const { data: purchases } = await supabase
      .from("team_purchases")
      .select("*, menu_item:case_menu_items(*)")
      .eq("team_id", teamId)
      .order("purchased_at");

    const { data: session } = await supabase
      .from("game_sessions")
      .select("*")
      .eq("id", data.session.id)
      .single();

    if (team) setData((prev) => ({ ...prev, team, purchases: purchases ?? [] }));
    if (session) setData((prev) => ({ ...prev, session }));
  }, [teamId, data.session.id]);

  useEffect(() => {
    const supabase = createClient();

    const channel = supabase
      .channel(`team-${teamId}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "teams", filter: `id=eq.${teamId}` },
        () => refreshData()
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "team_purchases", filter: `team_id=eq.${teamId}` },
        () => refreshData()
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "game_sessions", filter: `id=eq.${data.session.id}` },
        (payload) => {
          setData((prev) => ({ ...prev, session: payload.new as GameSession }));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [teamId, data.session.id, refreshData]);

  async function handlePurchase(menuItemId: string) {
    setLoading(menuItemId);
    setError(null);
    try {
      await purchaseItem(teamId, menuItemId);
      await refreshData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Purchase failed");
    } finally {
      setLoading(null);
    }
  }

  async function handleSaveNotes() {
    setLoading("notes");
    try {
      await updateTeamNotes(teamId, notes);
      setNotesSaved(true);
      setTimeout(() => setNotesSaved(false), 2000);
    } finally {
      setLoading(null);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!diagnosis.trim()) return;
    setLoading("submit");
    setError(null);
    try {
      await submitDiagnosis(teamId, diagnosis, evidence, alternateDiagnosis);
      await refreshData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Submit failed");
    } finally {
      setLoading(null);
    }
  }

  return (
    <MedicalShell theme="student">
      <header className="medical-nav medical-nav-student">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <MedicalIconBadge variant="teal" className="h-9 w-9 rounded-lg">
              <Stethoscope className="h-5 w-5" />
            </MedicalIconBadge>
            <span className="medical-nav-brand-student font-bold">{data.team.team_name}</span>
          </div>
          <div className="flex items-center gap-4">
            <Badge variant="outline" className="border-medical-teal/30 bg-white/70">
              {sessionStatusLabel(data.session.status)}
            </Badge>
            <div className="flex items-center gap-1 rounded-full bg-white/80 px-3 py-1 text-sm font-semibold text-medical-teal shadow-sm">
              <DollarSign className="h-4 w-4" />
              {formatCurrency(data.team.budget_remaining)}
            </div>
          </div>
        </div>
      </header>

      {isPaused && (
        <div className="bg-amber-50 px-4 py-2 text-center text-sm text-amber-800">
          <AlertCircle className="mr-1 inline h-4 w-4" />
          Session is paused by your teacher
        </div>
      )}

      {isEnded && (
        <div className="bg-gray-100 px-4 py-2 text-center text-sm text-gray-700">
          Session has ended
        </div>
      )}

      <main className="mx-auto max-w-5xl px-4 py-6">
        {error && (
          <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</div>
        )}

        <Tabs defaultValue="case">
          <TabsList className="w-full justify-start">
            <TabsTrigger value="case">Case</TabsTrigger>
            <TabsTrigger value="menu">
              <ShoppingCart className="mr-1 h-4 w-4" />
              Order Tests
            </TabsTrigger>
            <TabsTrigger value="file">
              <FileText className="mr-1 h-4 w-4" />
              Case File ({data.purchases.length})
            </TabsTrigger>
            <TabsTrigger value="submit">
              <Send className="mr-1 h-4 w-4" />
              Submit
            </TabsTrigger>
          </TabsList>

          <TabsContent value="case" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>{data.caseData.title}</CardTitle>
                <CardDescription>
                  {data.caseData.patient_age}yo {data.caseData.patient_sex} · {data.caseData.category}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Chief Complaint</p>
                  <p className="text-lg">{data.caseData.chief_complaint}</p>
                </div>
                <Separator />
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Presentation</p>
                  <p className="whitespace-pre-wrap leading-relaxed">{data.caseData.case_intro}</p>
                </div>
                <div className="rounded-lg border border-medical-teal/20 bg-medical-mint/15 p-3 text-sm">
                  Budget: {formatCurrency(data.caseData.starting_budget)} · Spent:{" "}
                  {formatCurrency(data.caseData.starting_budget - data.team.budget_remaining)}
                </div>
              </CardContent>
            </Card>

            <Card className="mt-4">
              <CardHeader>
                <CardTitle className="text-base">Team Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Shared notes for your team..."
                  rows={4}
                  disabled={isEnded}
                />
                <Button
                  size="sm"
                  className="mt-2"
                  onClick={handleSaveNotes}
                  disabled={loading === "notes" || isEnded}
                >
                  {notesSaved ? "Saved!" : "Save Notes"}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="menu" className="mt-4">
            {!isActive || isPaused ? (
              <Card>
                <CardContent className="py-8 text-center text-muted-foreground">
                  {isPaused ? "Purchases paused — waiting for teacher to resume" : "Waiting for session to start"}
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                {data.menuItems.map((item) => {
                  const purchased = purchasedIds.has(item.id);
                  const canAfford = data.team.budget_remaining >= item.cost;

                  return (
                    <Card key={item.id} className={purchased ? "border-medical-teal/40 bg-medical-mint/10" : ""}>
                      <CardHeader className="pb-2">
                        <div className="flex items-start justify-between">
                          <CardTitle className="text-base">{item.name}</CardTitle>
                          <Badge variant={purchased ? "default" : "outline"}>
                            {formatCurrency(item.cost)}
                          </Badge>
                        </div>
                        <CardDescription>{item.description}</CardDescription>
                      </CardHeader>
                      <CardContent>
                        {purchased ? (
                          <Badge className="bg-medical-mint/30 text-medical-teal">
                            <CheckCircle className="mr-1 h-3 w-3" /> Purchased
                          </Badge>
                        ) : (
                          <Button
                            size="sm"
                            disabled={!canAfford || !!loading || hasSubmitted}
                            onClick={() => handlePurchase(item.id)}
                            className="medical-btn-student"
                          >
                            {loading === item.id ? "Ordering..." : canAfford ? "Order" : "Insufficient funds"}
                          </Button>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>

          <TabsContent value="file" className="mt-4 space-y-4">
            {data.purchases.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center text-muted-foreground">
                  No clues yet. Order tests from the menu to build your case file.
                </CardContent>
              </Card>
            ) : (
              data.purchases.map((purchase) => (
                <Card key={purchase.id}>
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base">{purchase.menu_item.name}</CardTitle>
                      <span className="text-xs text-muted-foreground">
                        {formatCurrency(purchase.cost_paid)}
                      </span>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="whitespace-pre-wrap text-sm leading-relaxed">
                      {purchase.menu_item.clue_content}
                    </div>
                    {purchase.menu_item.clue_image_url && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={purchase.menu_item.clue_image_url}
                        alt={purchase.menu_item.name}
                        className="mt-3 max-h-64 rounded-lg"
                      />
                    )}
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>

          <TabsContent value="submit" className="mt-4">
            {hasSubmitted ? (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-medical-teal" />
                    Diagnosis Submitted
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <p className="text-sm font-medium">Your Diagnosis</p>
                    <p className="text-lg">{data.team.diagnosis}</p>
                  </div>
                  {data.team.evidence.length > 0 && (
                    <div>
                      <p className="text-sm font-medium">Evidence</p>
                      <ul className="list-inside list-disc">
                        {data.team.evidence.map((e, i) => (
                          <li key={i}>{e}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {data.team.alternate_diagnosis && (
                    <div>
                      <p className="text-sm font-medium">Alternate Diagnosis</p>
                      <p>{data.team.alternate_diagnosis}</p>
                    </div>
                  )}
                  {data.team.diagnosis_status !== "pending" && (
                    <Badge
                      className={
                        data.team.diagnosis_status === "correct"
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
                      }
                    >
                      {data.team.diagnosis_status === "correct" ? "Correct!" : "Incorrect"}
                    </Badge>
                  )}
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle>Submit Your Diagnosis</CardTitle>
                  <CardDescription>
                    Provide your final diagnosis with supporting evidence
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="diagnosis">Primary Diagnosis</Label>
                      <Input
                        id="diagnosis"
                        value={diagnosis}
                        onChange={(e) => setDiagnosis(e.target.value)}
                        placeholder="e.g. Hypothyroidism"
                        required
                        disabled={!isActive || isPaused || isEnded}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Supporting Evidence (2-3 pieces)</Label>
                      {evidence.map((ev, i) => (
                        <Input
                          key={i}
                          value={ev}
                          onChange={(e) => {
                            const updated = [...evidence];
                            updated[i] = e.target.value;
                            setEvidence(updated);
                          }}
                          placeholder={`Evidence ${i + 1}`}
                          disabled={!isActive || isPaused || isEnded}
                        />
                      ))}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="alt">Alternative Diagnosis (optional)</Label>
                      <Input
                        id="alt"
                        value={alternateDiagnosis}
                        onChange={(e) => setAlternateDiagnosis(e.target.value)}
                        placeholder="e.g. Depression"
                        disabled={!isActive || isPaused || isEnded}
                      />
                    </div>
                    <Button
                      type="submit"
                      className="medical-btn-student w-full"
                      disabled={!isActive || isPaused || isEnded || loading === "submit"}
                    >
                      {loading === "submit" ? "Submitting..." : "Submit Diagnosis"}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            )}

            {isEnded && data.caseData.debrief_content && (
              <Card className="mt-4">
                <CardHeader>
                  <CardTitle>Debrief</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="whitespace-pre-wrap text-sm leading-relaxed">
                    {data.caseData.debrief_content}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </main>
    </MedicalShell>
  );
}
