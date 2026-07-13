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
import {
  canResubmitDiagnosis,
  canSubmitDiagnosis,
  isDiagnosisLocked,
  MIN_PURCHASES_BEFORE_SUBMIT,
  MIN_EVIDENCE_PIECES,
  purchasesRemainingForSubmit,
  validateEvidence,
} from "@/lib/game-rules";
import { computeFinalBudget, speedBonusLabel } from "@/lib/scoring";
import { isInterviewType } from "@/lib/menu-item-types";
import { formatCurrency, sessionStatusLabel } from "@/lib/utils";
import { HowToPlayTab } from "@/components/student/how-to-play-tab";
import { TermLookupPanel } from "@/components/student/term-lookup-panel";
import { PresentationPrepTab } from "@/components/student/presentation-prep-tab";
import { LabInterpretationPanel, RoundTimerBanner } from "@/components/student/lab-interpretation-panel";
import { CaptainPinGate } from "@/components/student/captain-pin-gate";
import { TeamSharePanel } from "@/components/student/team-share-panel";
import { getCaptainToken } from "@/lib/captain-client";
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
  MessageSquare,
  ImageIcon,
  BookOpen,
  ClipboardList,
  Eye,
  ArrowRight,
} from "lucide-react";
import {
  menuItemGroupLabel,
  type MenuItemType,
} from "@/lib/menu-item-types";

interface PlayData {
  team: Team;
  session: GameSession;
  caseData: Case;
  menuItems: CaseMenuItem[];
  purchases: (TeamPurchase & { menu_item: CaseMenuItem })[];
}

export function TeamGameView({
  teamId,
  initialData,
  mode = "captain",
}: {
  teamId: string;
  initialData: PlayData;
  mode?: "captain" | "viewer";
}) {
  const readOnly = mode === "viewer";
  const [captainReady, setCaptainReady] = useState(readOnly);
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
  const [activeTab, setActiveTab] = useState("instructions");
  const [storedCaptainPin, setStoredCaptainPin] = useState<string | null>(
    initialData.team.captain_pin
  );

  const purchasedIds = new Set(data.purchases.map((p) => p.menu_item_id));
  const menuGroups = groupMenuItems(data.menuItems);
  const purchaseCount = data.purchases.length;
  const submissionCount = data.team.submission_count ?? 0;
  const diagnosisLocked = isDiagnosisLocked(data.team);
  const canResubmit = canResubmitDiagnosis(data.team);
  const canSubmit = canSubmitDiagnosis(data.team, purchaseCount);
  const showSubmitForm = !diagnosisLocked && (submissionCount === 0 || canResubmit);
  const hasInterviewPurchase = data.purchases.some((p) =>
    isInterviewType((p.menu_item.item_type ?? "test") as MenuItemType)
  );
  const strictMode = data.session.strict_mode ?? false;
  const isPaused = data.session.status === "paused";
  const isEnded = data.session.status === "ended";
  const sessionStarted = data.session.status === "active";
  const canOrder = sessionStarted && !isPaused && !isEnded && !diagnosisLocked;
  const finalScore = computeFinalBudget(data.team);
  const orderStatusMessage = isEnded
    ? "Session has ended — ordering is closed."
    : isPaused
      ? "Session is paused — ordering will resume when your teacher continues."
      : !sessionStarted
        ? "Your teacher hasn't started the session yet. You can preview clues below."
        : null;

  useEffect(() => {
    const seen = localStorage.getItem(`instructions-seen-${teamId}`);
    setActiveTab(seen ? "case" : "instructions");
  }, [teamId]);

  useEffect(() => {
    if (mode === "captain") {
      setCaptainReady(!!getCaptainToken(teamId));
    }
  }, [mode, teamId]);

  useEffect(() => {
    setNotes(data.team.shared_notes);
  }, [data.team.shared_notes]);

  useEffect(() => {
    const fromSession =
      typeof window !== "undefined"
        ? sessionStorage.getItem(`captain-pin-${teamId}`)
        : null;
    setStoredCaptainPin(data.team.captain_pin ?? fromSession);
  }, [data.team.captain_pin, teamId]);

  function handleStartCase() {
    localStorage.setItem(`instructions-seen-${teamId}`, "1");
    setActiveTab("case");
  }

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
      await purchaseItem(teamId, menuItemId, getCaptainToken(teamId));
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
      await updateTeamNotes(teamId, notes, getCaptainToken(teamId));
      setNotesSaved(true);
      setTimeout(() => setNotesSaved(false), 2000);
    } finally {
      setLoading(null);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!diagnosis.trim()) return;

    const evidenceError = validateEvidence(evidence);
    if (evidenceError && !canResubmit) {
      setError(evidenceError);
      return;
    }

    setLoading("submit");
    setError(null);
    try {
      await submitDiagnosis(
        teamId,
        diagnosis,
        evidence,
        alternateDiagnosis,
        getCaptainToken(teamId)
      );
      await refreshData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Submit failed");
    } finally {
      setLoading(null);
    }
  }

  if (mode === "captain" && !captainReady) {
    return (
      <MedicalShell theme="student">
        <CaptainPinGate
          teamId={teamId}
          teamName={data.team.team_name}
          onUnlocked={() => setCaptainReady(true)}
        />
      </MedicalShell>
    );
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
            {readOnly && (
              <Badge variant="outline" className="border-blue-300 bg-blue-50 text-blue-800">
                <Eye className="mr-1 h-3 w-3" />
                View only
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-3">
            <TermLookupPanel teamId={teamId} disabled={isEnded} />
            <Badge variant="outline" className="border-medical-teal/30 bg-white/70">
              {sessionStatusLabel(data.session.status)}
            </Badge>
            <div className="flex items-center gap-1 rounded-full bg-white/80 px-3 py-1 text-sm font-semibold text-medical-teal shadow-sm">
              <DollarSign className="h-4 w-4" />
              {formatCurrency(finalScore)}
              {(data.team.speed_bonus ?? 0) > 0 && (
                <span className="text-xs font-normal text-muted-foreground">
                  ({formatCurrency(data.team.budget_remaining)} + {speedBonusLabel(data.team.speed_rank)})
                </span>
              )}
            </div>
          </div>
        </div>
      </header>

      {readOnly && (
        <div className="bg-blue-50 px-4 py-2 text-center text-sm text-blue-900">
          Following along with your team — ordering and submissions happen on the captain iPad.
        </div>
      )}

      {isPaused && (
        <div className="bg-amber-50 px-4 py-2 text-center text-sm text-amber-800">
          <AlertCircle className="mr-1 inline h-4 w-4" />
          Session is paused by your teacher
        </div>
      )}

      <RoundTimerBanner endsAt={data.session.round_timer_ends_at} />

      {isEnded && (
        <div className="bg-gray-100 px-4 py-2 text-center text-sm text-gray-700">
          Session has ended
        </div>
      )}

      <main className="mx-auto max-w-5xl px-4 py-6">
        {error && (
          <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</div>
        )}

        {!readOnly && (
          <div className="mb-4">
            <TeamSharePanel
              teamId={teamId}
              teamName={data.team.team_name}
              captainPin={storedCaptainPin}
            />
          </div>
        )}

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="w-full justify-start overflow-x-auto">
            <TabsTrigger value="instructions">
              <BookOpen className="mr-1 h-4 w-4" />
              How to Play
            </TabsTrigger>
            <TabsTrigger value="case">Case</TabsTrigger>
            {!readOnly && (
              <TabsTrigger value="menu">
                <ShoppingCart className="mr-1 h-4 w-4" />
                Order Clues
              </TabsTrigger>
            )}
            <TabsTrigger value="file">
              <FileText className="mr-1 h-4 w-4" />
              Case File ({data.purchases.length})
            </TabsTrigger>
            <TabsTrigger value="submit">
              <Send className="mr-1 h-4 w-4" />
              Submit
            </TabsTrigger>
            {(data.team.submitted_at || isEnded) && (
              <TabsTrigger value="prep">
                <ClipboardList className="mr-1 h-4 w-4" />
                Presentation Prep
              </TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="instructions" className="mt-4">
            <HowToPlayTab
              strictMode={strictMode}
              startingBudget={data.caseData.starting_budget}
              onStartCase={handleStartCase}
            />
          </TabsContent>

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
                <div className="rounded-lg border border-amber-200/80 bg-amber-50/80 p-3 text-sm text-amber-900">
                  <MessageSquare className="mr-1 inline h-4 w-4" />
                  Need more details? Order <strong>Symptom History</strong>,{" "}
                  <strong>Medical Background</strong>, and <strong>Lifestyle Background</strong> from
                  the Order Clues tab.
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
                  disabled={isEnded || readOnly}
                  readOnly={readOnly}
                />
                {!readOnly && (
                  <Button
                    size="sm"
                    className="mt-2"
                    onClick={handleSaveNotes}
                    disabled={loading === "notes" || isEnded}
                  >
                    {notesSaved ? "Saved!" : "Save Notes"}
                  </Button>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {!readOnly && (
          <TabsContent value="menu" className="mt-4">
            {orderStatusMessage && (
              <div className="mb-4 rounded-lg border border-amber-200/80 bg-amber-50/80 p-3 text-sm text-amber-900">
                {orderStatusMessage}
              </div>
            )}

            {data.menuItems.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center text-muted-foreground">
                  No clues are set up for this case yet. Ask your teacher to add menu items in the
                  case editor.
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-6">
                {menuGroups.map((group) => (
                  <div key={group.label}>
                    <h3 className="mb-3 text-sm font-semibold text-muted-foreground">{group.label}</h3>
                    <div className="grid gap-3 sm:grid-cols-2">
                      {group.items.map((item) => {
                        const purchased = purchasedIds.has(item.id);
                        const canAfford = data.team.budget_remaining >= item.cost;
                        const isImage = item.item_type === "image";
                        const itemType = (item.item_type ?? "test") as MenuItemType;
                        const lockedByStrict =
                          strictMode &&
                          !hasInterviewPurchase &&
                          !isInterviewType(itemType) &&
                          (itemType === "test" || itemType === "image") &&
                          !purchased;
                        const purchaseDisabled =
                          !canOrder ||
                          !canAfford ||
                          !!loading ||
                          lockedByStrict;

                        return (
                          <Card
                            key={item.id}
                            className={
                              purchased
                                ? "border-medical-teal/40 bg-medical-mint/10"
                                : lockedByStrict
                                  ? "opacity-60"
                                  : ""
                            }
                          >
                            <CardHeader className="pb-2">
                              <div className="flex items-start justify-between">
                                <CardTitle className="flex items-center gap-1.5 text-base">
                                  {isImage && <ImageIcon className="h-4 w-4 text-muted-foreground" />}
                                  {item.name}
                                </CardTitle>
                                <Badge variant={purchased ? "default" : "outline"}>
                                  {formatCurrency(item.cost)}
                                </Badge>
                              </div>
                              <CardDescription>{item.description}</CardDescription>
                              {lockedByStrict && (
                                <p className="text-xs text-amber-700">
                                  Order a Patient Interview clue first (strict mode)
                                </p>
                              )}
                            </CardHeader>
                            <CardContent>
                              {purchased ? (
                                <Badge className="bg-medical-mint/30 text-medical-teal">
                                  <CheckCircle className="mr-1 h-3 w-3" /> Purchased
                                </Badge>
                              ) : (
                                <Button
                                  size="sm"
                                  disabled={purchaseDisabled}
                                  onClick={() => handlePurchase(item.id)}
                                  className="medical-btn-student"
                                >
                                  {loading === item.id
                                    ? "Ordering..."
                                    : !canOrder
                                      ? "Not open yet"
                                      : lockedByStrict
                                        ? "Locked"
                                        : canAfford
                                          ? "Order"
                                          : "Insufficient funds"}
                                </Button>
                              )}
                            </CardContent>
                          </Card>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
          )}

          <TabsContent value="file" className="mt-4 space-y-4">
            {data.purchases.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center text-muted-foreground">
                  No clues yet. Order patient history or tests from Order Clues to build your case file.
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
                    {purchase.menu_item.clue_image_url && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={purchase.menu_item.clue_image_url}
                        alt={purchase.menu_item.name}
                        className="mb-3 max-h-72 rounded-lg border"
                      />
                    )}
                    {purchase.menu_item.clue_content && (
                      <div className="whitespace-pre-wrap text-sm leading-relaxed">
                        {purchase.menu_item.clue_content}
                      </div>
                    )}
                    <LabInterpretationPanel item={purchase.menu_item} />
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>

          <TabsContent value="submit" className="mt-4">
            {canResubmit && (
              <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
                Your first diagnosis was incorrect. You have <strong>one revision</strong> left — buy
                more clues if you need them, then submit your final answer.
              </div>
            )}

            {!showSubmitForm && submissionCount > 0 ? (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-medical-teal" />
                    {submissionCount >= 2 ? "Final Diagnosis Submitted" : "Diagnosis Submitted"}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {data.team.first_diagnosis &&
                    data.team.first_diagnosis !== data.team.diagnosis && (
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">First attempt</p>
                        <p>{data.team.first_diagnosis}</p>
                      </div>
                    )}
                  <div>
                    <p className="text-sm font-medium">
                      {submissionCount >= 2 ? "Final diagnosis" : "Your diagnosis"}
                    </p>
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
                      {data.team.diagnosis_status === "correct"
                        ? "Correct!"
                        : submissionCount >= 2
                          ? "Incorrect — no more attempts"
                          : "Incorrect"}
                    </Badge>
                  )}
                  {!readOnly && (
                    <Button
                      className="medical-btn-student mt-4 w-full"
                      onClick={() => setActiveTab("prep")}
                    >
                      <ClipboardList className="mr-2 h-4 w-4" />
                      Continue to Presentation Prep
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  )}
                </CardContent>
              </Card>
            ) : readOnly ? (
              <Card>
                <CardContent className="py-8 text-center text-muted-foreground">
                  Waiting for your captain to submit a diagnosis.
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle>
                    {canResubmit ? "Revise Your Diagnosis" : "Submit Your Diagnosis"}
                  </CardTitle>
                  <CardDescription>
                    Provide your diagnosis with supporting evidence from clues you purchased.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {submissionCount === 0 && purchaseCount < MIN_PURCHASES_BEFORE_SUBMIT && (
                    <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
                      Purchase at least {MIN_PURCHASES_BEFORE_SUBMIT} clues before submitting (
                      {purchaseCount}/{MIN_PURCHASES_BEFORE_SUBMIT} so far —{" "}
                      {purchasesRemainingForSubmit(purchaseCount)} more needed).
                    </div>
                  )}
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="diagnosis">Primary Diagnosis</Label>
                      <Input
                        id="diagnosis"
                        value={diagnosis}
                        onChange={(e) => setDiagnosis(e.target.value)}
                        placeholder="e.g. Hypothyroidism"
                        required
                        disabled={!sessionStarted || isPaused || isEnded || !canSubmit}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Supporting Evidence ({MIN_EVIDENCE_PIECES} required)</Label>
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
                          disabled={!sessionStarted || isPaused || isEnded || !canSubmit}
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
                        disabled={!sessionStarted || isPaused || isEnded || !canSubmit}
                      />
                    </div>
                    <Button
                      type="submit"
                      className="medical-btn-student w-full"
                      disabled={!sessionStarted || isPaused || isEnded || loading === "submit" || !canSubmit}
                    >
                      {loading === "submit"
                        ? "Submitting..."
                        : canResubmit
                          ? "Submit Final Diagnosis"
                          : "Submit Diagnosis"}
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

          <TabsContent value="prep" className="mt-4" forceMount hidden={activeTab !== "prep"}>
            <PresentationPrepTab
              teamId={teamId}
              team={data.team}
              sessionEnded={isEnded}
              isActive={activeTab === "prep"}
              readOnly={readOnly}
              captainToken={readOnly ? null : getCaptainToken(teamId)}
            />
          </TabsContent>
        </Tabs>
      </main>
    </MedicalShell>
  );
}

function groupMenuItems(items: CaseMenuItem[]) {
  const groups = new Map<string, CaseMenuItem[]>();

  for (const item of items) {
    const type = (item.item_type ?? "test") as MenuItemType;
    const label = menuItemGroupLabel(type);
    const list = groups.get(label) ?? [];
    list.push(item);
    groups.set(label, list);
  }

  const order = ["Patient Interview", "Diagnostic Tests"];
  return order
    .filter((label) => groups.has(label))
    .map((label) => ({ label, items: groups.get(label)! }))
    .concat(
      [...groups.entries()]
        .filter(([label]) => !order.includes(label))
        .map(([label, groupItems]) => ({ label, items: groupItems }))
    );
}
