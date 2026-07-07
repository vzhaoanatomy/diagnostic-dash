"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import type { GameSession, Team, TeamPurchase, CaseMenuItem, Case } from "@/lib/types/database";
import { updateSessionStatus, markDiagnosis, autoGradeDiagnosis } from "@/lib/actions/game";
import { formatCurrency, sessionStatusLabel, sessionStatusColor } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CheckCircle, XCircle, Pause, Play, Square } from "lucide-react";

interface TeamWithPurchases extends Team {
  purchases: (TeamPurchase & { menu_item: CaseMenuItem })[];
}

interface SessionData {
  session: GameSession;
  caseData: Case;
  teams: TeamWithPurchases[];
}

export function LiveSessionView({ initialData }: { initialData: SessionData }) {
  const [data, setData] = useState(initialData);
  const [loading, setLoading] = useState<string | null>(null);

  const refreshData = useCallback(async () => {
    const supabase = createClient();

    const { data: teams } = await supabase
      .from("teams")
      .select("*, purchases:team_purchases(*, menu_item:case_menu_items(*))")
      .eq("session_id", data.session.id)
      .order("created_at");

    if (teams) setData((prev) => ({ ...prev, teams: teams as TeamWithPurchases[] }));
  }, [data.session.id]);

  useEffect(() => {
    const supabase = createClient();

    const channel = supabase
      .channel(`session-${data.session.id}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "teams", filter: `session_id=eq.${data.session.id}` },
        () => refreshData()
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "team_purchases" },
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
  }, [data.session.id, refreshData]);

  async function handleStatusChange(status: "waiting" | "active" | "paused" | "ended") {
    setLoading(status);
    try {
      await updateSessionStatus(data.session.id, status);
      setData((prev) => ({ ...prev, session: { ...prev.session, status } }));
    } finally {
      setLoading(null);
    }
  }

  async function handleMark(teamId: string, status: "correct" | "incorrect") {
    setLoading(teamId);
    try {
      await markDiagnosis(teamId, data.session.id, status);
      await refreshData();
    } finally {
      setLoading(null);
    }
  }

  async function handleAutoGrade(teamId: string) {
    setLoading(teamId);
    try {
      await autoGradeDiagnosis(teamId, data.session.id);
      await refreshData();
    } finally {
      setLoading(null);
    }
  }

  const submittedTeams = data.teams.filter((t) => t.submitted_at);
  const pendingTeams = data.teams.filter((t) => !t.submitted_at);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">{data.caseData.title}</h1>
          <p className="mt-1 text-muted-foreground">Live Session</p>
        </div>
        <div className="flex items-center gap-3">
          <Badge className={`text-sm ${sessionStatusColor(data.session.status)}`}>
            {sessionStatusLabel(data.session.status)}
          </Badge>
          <div className="text-right">
            <p className="text-xs text-muted-foreground">Join Code</p>
            <p className="font-mono text-3xl font-bold tracking-widest">{data.session.join_code}</p>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {data.session.status === "waiting" && (
          <Button onClick={() => handleStatusChange("active")} disabled={!!loading}>
            <Play className="h-4 w-4" />
            Start Session
          </Button>
        )}
        {data.session.status === "active" && (
          <Button variant="outline" onClick={() => handleStatusChange("paused")} disabled={!!loading}>
            <Pause className="h-4 w-4" />
            Pause
          </Button>
        )}
        {data.session.status === "paused" && (
          <Button onClick={() => handleStatusChange("active")} disabled={!!loading}>
            <Play className="h-4 w-4" />
            Resume
          </Button>
        )}
        {data.session.status !== "ended" && (
          <Button variant="destructive" onClick={() => handleStatusChange("ended")} disabled={!!loading}>
            <Square className="h-4 w-4" />
            End Session
          </Button>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Teams Joined</CardDescription>
            <CardTitle className="text-2xl">{data.teams.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Submitted</CardDescription>
            <CardTitle className="text-2xl">{submittedTeams.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Pending</CardDescription>
            <CardTitle className="text-2xl">{pendingTeams.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Starting Budget</CardDescription>
            <CardTitle className="text-2xl">{formatCurrency(data.caseData.starting_budget)}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      <Tabs defaultValue="teams">
        <TabsList>
          <TabsTrigger value="teams">Teams ({data.teams.length})</TabsTrigger>
          <TabsTrigger value="submissions">Submissions ({submittedTeams.length})</TabsTrigger>
          {data.session.status === "ended" && (
            <TabsTrigger value="debrief">Debrief</TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="teams" className="mt-4">
          {data.teams.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                Waiting for teams to join with code <strong>{data.session.join_code}</strong>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {data.teams.map((team) => (
                <Card key={team.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{team.team_name}</CardTitle>
                      {team.submitted_at ? (
                        <Badge className="bg-blue-100 text-blue-800">Submitted</Badge>
                      ) : (
                        <Badge variant="outline">In Progress</Badge>
                      )}
                    </div>
                    <CardDescription>
                      Budget: {formatCurrency(team.budget_remaining)} · {team.purchases.length} purchases
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {team.purchases.length > 0 && (
                      <div className="mb-3">
                        <p className="mb-1 text-xs font-medium text-muted-foreground">Purchased:</p>
                        <div className="flex flex-wrap gap-1">
                          {team.purchases.map((p) => (
                            <Badge key={p.id} variant="outline" className="text-xs">
                              {p.menu_item.name}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="submissions" className="mt-4 space-y-4">
          {submittedTeams.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                No submissions yet
              </CardContent>
            </Card>
          ) : (
            submittedTeams.map((team) => (
              <Card key={team.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{team.team_name}</CardTitle>
                    <div className="flex items-center gap-2">
                      {team.diagnosis_status === "correct" && (
                        <Badge className="bg-green-100 text-green-800">
                          <CheckCircle className="mr-1 h-3 w-3" /> Correct
                        </Badge>
                      )}
                      {team.diagnosis_status === "incorrect" && (
                        <Badge className="bg-red-100 text-red-800">
                          <XCircle className="mr-1 h-3 w-3" /> Incorrect
                        </Badge>
                      )}
                      {team.diagnosis_status === "pending" && (
                        <Badge variant="outline">Pending Review</Badge>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <p className="text-sm font-medium">Diagnosis</p>
                    <p className="text-lg">{team.diagnosis}</p>
                  </div>
                  {team.evidence.length > 0 && (
                    <div>
                      <p className="text-sm font-medium">Evidence</p>
                      <ul className="list-inside list-disc text-sm">
                        {team.evidence.map((e, i) => (
                          <li key={i}>{e}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {team.alternate_diagnosis && (
                    <div>
                      <p className="text-sm font-medium">Alternate Diagnosis</p>
                      <p>{team.alternate_diagnosis}</p>
                    </div>
                  )}
                  {team.diagnosis_status === "pending" && (
                    <div className="flex gap-2 pt-2">
                      <Button size="sm" onClick={() => handleAutoGrade(team.id)} disabled={loading === team.id}>
                        Auto-Grade
                      </Button>
                      <Button size="sm" variant="outline" className="text-green-700" onClick={() => handleMark(team.id, "correct")} disabled={loading === team.id}>
                        <CheckCircle className="h-4 w-4" /> Correct
                      </Button>
                      <Button size="sm" variant="outline" className="text-red-700" onClick={() => handleMark(team.id, "incorrect")} disabled={loading === team.id}>
                        <XCircle className="h-4 w-4" /> Incorrect
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        {data.session.status === "ended" && (
          <TabsContent value="debrief" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Debrief</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="prose prose-sm max-w-none whitespace-pre-wrap">
                  {data.caseData.debrief_content}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
