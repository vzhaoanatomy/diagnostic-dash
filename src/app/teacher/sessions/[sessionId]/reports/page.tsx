import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { computeFinalBudget, speedBonusLabel } from "@/lib/scoring";
import { getUnitLabel } from "@/lib/curriculum-units";
import type { Case, CaseMenuItem, Team, TeamPurchase } from "@/lib/types/database";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default async function SessionReportsPage({
  params,
}: {
  params: Promise<{ sessionId: string }>;
}) {
  const { sessionId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: session } = await supabase
    .from("game_sessions")
    .select("*, case:cases(*)")
    .eq("id", sessionId)
    .eq("teacher_id", user.id)
    .single();

  if (!session) notFound();
  const caseData = session.case as Case;

  const { data: teams } = await supabase
    .from("teams")
    .select("*, purchases:team_purchases(*, menu_item:case_menu_items(name, cost))")
    .eq("session_id", sessionId)
    .order("created_at");

  const teamList = (teams ?? []) as (Team & {
    purchases: (TeamPurchase & { menu_item: Pick<CaseMenuItem, "name" | "cost"> })[];
  })[];

  const ranked = [...teamList]
    .filter((t) => t.submitted_at)
    .sort((a, b) => computeFinalBudget(b) - computeFinalBudget(a));

  return (
    <div className="space-y-6 print:block">
      <div className="flex flex-wrap items-start justify-between gap-4 print:hidden">
        <div>
          <h1 className="text-3xl font-bold">Session Reports</h1>
          <p className="mt-1 text-muted-foreground">
            {caseData.title} · {getUnitLabel(caseData.primary_unit ?? "mixed")}
          </p>
        </div>
        <Button variant="outline" asChild>
          <Link href={`/teacher/sessions/${sessionId}`}>← Back to session</Link>
        </Button>
      </div>

      <Card className="print:hidden">
        <CardHeader>
          <CardTitle className="text-lg">Download presentations</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {teamList.map((team) => (
            <div key={team.id} className="flex flex-wrap items-center justify-between gap-2 border-b pb-3 last:border-0">
              <span className="font-medium">{team.team_name}</span>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" asChild>
                  <Link href={`/teacher/sessions/${sessionId}/reports/${team.id}/print`} target="_blank">
                    PDF / Print
                  </Link>
                </Button>
                <Button size="sm" asChild>
                  <a href={`/api/teacher/sessions/${sessionId}/export/${team.id}/pptx`}>
                    PowerPoint
                  </a>
                </Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Final standings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {ranked.length === 0 ? (
            <p className="text-muted-foreground">No submissions yet.</p>
          ) : (
            ranked.map((team, index) => (
              <div key={team.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border p-3">
                <div>
                  <span className="font-semibold">
                    #{index + 1} {team.team_name}
                  </span>
                  {team.diagnosis_status === "correct" ? (
                    <Badge className="ml-2 bg-green-100 text-green-800">Correct</Badge>
                  ) : (
                    <Badge className="ml-2 bg-red-100 text-red-800">Incorrect</Badge>
                  )}
                  {speedBonusLabel(team.speed_rank) && (
                    <Badge variant="outline" className="ml-2">
                      {speedBonusLabel(team.speed_rank)}
                    </Badge>
                  )}
                </div>
                <div className="text-right text-sm">
                  <p className="font-bold text-lg">${computeFinalBudget(team)}</p>
                  <p className="text-muted-foreground">
                    Budget ${team.budget_remaining}
                    {(team.speed_bonus ?? 0) > 0 && ` + $${team.speed_bonus} speed`}
                    {(team.teacher_budget_adjustment ?? 0) !== 0 &&
                      ` + $${team.teacher_budget_adjustment} adj`}
                  </p>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
