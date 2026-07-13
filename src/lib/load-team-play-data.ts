import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
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

export async function loadTeamPlayData(teamId: string) {
  const supabase = await createClient();

  const { data: teamData, error: teamError } = await supabase
    .from("teams")
    .select(
      "id, session_id, team_name, budget_remaining, shared_notes, diagnosis, evidence, alternate_diagnosis, diagnosis_status, submission_count, first_diagnosis, first_submitted_at, submitted_at, pathophys_explanation, treatment_plan, key_orders_reflection, purchase_journey, presentation_notes, speed_bonus, speed_rank, teacher_budget_adjustment, captain_pin, created_at"
    )
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

  return {
    team,
    session,
    caseData: caseData as Case,
    menuItems: menuItemsFinal.map((item: PublicMenuItem) => ({
      ...item,
      item_type: (item.item_type ?? "test") as MenuItemType,
      clue_content: "",
      clue_image_url: null,
      reference_range: "",
      interpretation: "",
      created_at: "",
    })) as CaseMenuItem[],
    purchases: (purchases ?? []) as (TeamPurchase & { menu_item: CaseMenuItem })[],
  };
}
