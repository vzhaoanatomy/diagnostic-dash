import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { TeamGameView } from "@/components/student/team-game-view";
import type { Team, Case, CaseMenuItem, GameSession, TeamPurchase } from "@/lib/types/database";

import type { MenuItemType } from "@/lib/menu-item-types";

type PublicMenuItem = {
  id: string;
  case_id: string;
  name: string;
  cost: number;
  description: string;
  item_type: string;
  sort_order: number;
};

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

  const { data: menuItemsRaw, error: menuError } = await supabase.rpc("get_team_menu_items", {
    p_team_id: teamId,
  });

  if (menuError) {
    console.error("Failed to load menu items:", menuError.message);
  }

  let menuItemsFinal: PublicMenuItem[] = (menuItemsRaw ?? []) as PublicMenuItem[];
  if (menuItemsFinal.length === 0 || menuError) {
    const { data: directItems } = await supabase
      .from("case_menu_items")
      .select("id, case_id, name, cost, description, item_type, sort_order")
      .eq("case_id", session.case_id)
      .order("sort_order");
    if (directItems && directItems.length > 0) {
      menuItemsFinal = directItems as PublicMenuItem[];
    }
  }

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
        menuItems: menuItemsFinal.map((item: PublicMenuItem) => ({
          ...item,
          item_type: (item.item_type ?? "test") as MenuItemType,
          clue_content: "",
          clue_image_url: null,
          created_at: "",
        })) as CaseMenuItem[],
        purchases: (purchases ?? []) as (TeamPurchase & { menu_item: CaseMenuItem })[],
      }}
    />
  );
}
