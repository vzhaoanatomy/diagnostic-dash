import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { LiveSessionView } from "@/components/teacher/live-session-view";
import type { Case, CaseMenuItem, GameSession, Team, TeamPurchase } from "@/lib/types/database";

export default async function SessionPage({
  params,
}: {
  params: Promise<{ sessionId: string }>;
}) {
  const { sessionId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: session } = await supabase
    .from("game_sessions")
    .select("*")
    .eq("id", sessionId)
    .eq("teacher_id", user!.id)
    .single();

  if (!session) notFound();

  const { data: caseData } = await supabase
    .from("cases")
    .select("*")
    .eq("id", session.case_id)
    .single();

  if (!caseData) notFound();

  const { data: teams } = await supabase
    .from("teams")
    .select("*, purchases:team_purchases(*, menu_item:case_menu_items(*))")
    .eq("session_id", sessionId)
    .order("created_at");

  return (
    <LiveSessionView
      initialData={{
        session: session as GameSession,
        caseData: caseData as Case,
        teams: (teams ?? []) as (Team & { purchases: (TeamPurchase & { menu_item: CaseMenuItem })[] })[],
      }}
    />
  );
}
