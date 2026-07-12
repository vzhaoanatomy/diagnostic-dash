import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { buildTeamPresentationPptx } from "@/lib/export/presentation-pptx";
import type { Case, CaseMenuItem, Team, TeamPurchase } from "@/lib/types/database";

export async function GET(
  request: Request,
  context: { params: Promise<{ sessionId: string; teamId: string }> }
) {
  const { sessionId, teamId } = await context.params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: session } = await supabase
    .from("game_sessions")
    .select("*, case:cases(*)")
    .eq("id", sessionId)
    .eq("teacher_id", user.id)
    .single();

  if (!session) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }

  const { data: team } = await supabase
    .from("teams")
    .select("*")
    .eq("id", teamId)
    .eq("session_id", sessionId)
    .single();

  if (!team) {
    return NextResponse.json({ error: "Team not found" }, { status: 404 });
  }

  const { data: purchases } = await supabase
    .from("team_purchases")
    .select("*, menu_item:case_menu_items(*)")
    .eq("team_id", teamId)
    .order("purchased_at");

  const buffer = await buildTeamPresentationPptx({
    team: team as Team,
    caseData: session.case as Case,
    purchases: (purchases ?? []) as (TeamPurchase & { menu_item: CaseMenuItem })[],
  });

  const filename = `${team.team_name.replace(/\s+/g, "-")}-presentation.pptx`;

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.presentationml.presentation",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
