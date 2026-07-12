import type { SupabaseClient } from "@supabase/supabase-js";
import type { Case, CaseMenuItem, Team, TeamPurchase } from "@/lib/types/database";

export interface TeamReportBundle {
  team: Team;
  caseData: Case;
  purchases: (TeamPurchase & { menu_item: CaseMenuItem })[];
  sessionId: string;
  teacherId: string;
}

export async function fetchTeamReportByTeamId(
  supabase: SupabaseClient,
  teamId: string
): Promise<TeamReportBundle | null> {
  const { data: team } = await supabase.from("teams").select("*").eq("id", teamId).single();

  if (!team?.submitted_at) return null;

  const { data: session } = await supabase
    .from("game_sessions")
    .select("*, case:cases(*)")
    .eq("id", team.session_id)
    .single();

  if (!session?.case) return null;

  const { data: purchases } = await supabase
    .from("team_purchases")
    .select("*, menu_item:case_menu_items(*)")
    .eq("team_id", teamId)
    .order("purchased_at");

  return {
    team: team as Team,
    caseData: session.case as Case,
    purchases: (purchases ?? []) as (TeamPurchase & { menu_item: CaseMenuItem })[],
    sessionId: session.id,
    teacherId: session.teacher_id,
  };
}
