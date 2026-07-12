import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Case, CaseMenuItem, Team, TeamPurchase } from "@/lib/types/database";
import { PrintReportClient } from "./print-report";

export default async function TeamPrintReportPage({
  params,
}: {
  params: Promise<{ sessionId: string; teamId: string }>;
}) {
  const { sessionId, teamId } = await params;
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

  const { data: team } = await supabase
    .from("teams")
    .select("*")
    .eq("id", teamId)
    .eq("session_id", sessionId)
    .single();

  if (!team) notFound();

  const { data: purchases } = await supabase
    .from("team_purchases")
    .select("*, menu_item:case_menu_items(*)")
    .eq("team_id", teamId)
    .order("purchased_at");

  const purchaseList = (purchases ?? []) as (TeamPurchase & { menu_item: CaseMenuItem })[];

  return (
    <PrintReportClient team={team as Team} caseData={caseData} purchases={purchaseList} />
  );
}
