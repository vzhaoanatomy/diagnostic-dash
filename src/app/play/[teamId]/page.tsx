import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { TeamGameView } from "@/components/student/team-game-view";
import type { Team, Case, CaseMenuItem, GameSession, TeamPurchase } from "@/lib/types/database";

export default async function PlayPage({
  params,
}: {
  params: Promise<{ teamId: string }>;
}) {
  const { teamId } = await params;
  const supabase = await createClient();

  const { data: teamData, error: teamError } = await supabase
    .from("teams")
    .select("*")
    .eq("id", teamId)
    .single();

  if (teamError || !teamData) notFound();
  const team = teamData as Team;

  const { data: sessionData } = await supabase
    .from("game_sessions")
    .select("*")
    .eq("id", team.session_id)
    .single();

  if (!sessionData) notFound();
  const session = sessionData as GameSession;

  const { data: caseData } = await supabase
    .from("cases")
    .select("*")
    .eq("id", session.case_id)
    .single();

  if (!caseData) notFound();

  const { data: menuItems } = await supabase
    .from("case_menu_items")
    .select("*")
    .eq("case_id", session.case_id)
    .order("sort_order");

  const { data: purchases } = await supabase
    .from("team_purchases")
    .select("*, menu_item:case_menu_items(*)")
    .eq("team_id", teamId)
    .order("purchased_at");

  return (
    <TeamGameView
      teamId={teamId}
      initialData={{
        team,
        session,
        caseData: caseData as Case,
        menuItems: ((menuItems ?? []) as CaseMenuItem[]).map((item) => ({
          ...item,
          item_type: item.item_type ?? "test",
          clue_content: "",
          clue_image_url: null,
        })),
        purchases: (purchases ?? []) as (TeamPurchase & { menu_item: CaseMenuItem })[],
      }}
    />
  );
}
