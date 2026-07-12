"use server";

import { defineMedicalTermWithGemini } from "@/lib/ai/define-term";
import {
  responseContainsBlockedTerm,
  validateLookupQuery,
} from "@/lib/term-lookup-validation";
import { createClient } from "@/lib/supabase/server";
import type { Case, CaseMenuItem, TeamPurchase } from "@/lib/types/database";

export async function lookupMedicalTerm(
  teamId: string,
  rawQuery: string
): Promise<{ success: true; definition: string } | { success: false; error: string }> {
  try {
    const supabase = await createClient();

    const { data: team } = await supabase
      .from("teams")
      .select("*, session:game_sessions(*, case:cases(*))")
      .eq("id", teamId)
      .single();

    if (!team) {
      return { success: false, error: "Team not found." };
    }

    const session = team.session as {
      case: Case;
    };
    const caseData = session.case;

    const { data: menuItems } = await supabase
      .from("case_menu_items")
      .select("*")
      .eq("case_id", caseData.id)
      .order("sort_order");

    const { data: purchases } = await supabase
      .from("team_purchases")
      .select("*, menu_item:case_menu_items(*)")
      .eq("team_id", teamId);

    const visibleCaseText = buildVisibleCaseText(
      caseData,
      (menuItems ?? []) as CaseMenuItem[],
      (purchases ?? []) as (TeamPurchase & { menu_item: CaseMenuItem })[]
    );

    const blockedTerms = [
      ...caseData.accepted_diagnoses,
      ...caseData.alternate_accepted_answers,
    ];

    const validation = validateLookupQuery(rawQuery, {
      visibleCaseText,
      blockedTerms,
    });

    if (!validation.ok) {
      return { success: false, error: validation.error };
    }

    let definition = await defineMedicalTermWithGemini(validation.term);

    if (responseContainsBlockedTerm(definition, blockedTerms)) {
      definition =
        "I can only provide general medical vocabulary definitions, not case-specific diagnoses.";
    }

    return { success: true, definition };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Lookup failed. Try again.",
    };
  }
}

function buildVisibleCaseText(
  caseData: Case,
  menuItems: CaseMenuItem[],
  purchases: (TeamPurchase & { menu_item: CaseMenuItem })[]
): string {
  const parts = [
    caseData.title,
    caseData.chief_complaint,
    caseData.case_intro,
    ...menuItems.map((item) => `${item.name} ${item.description}`),
    ...purchases.flatMap((purchase) => [
      purchase.menu_item.name,
      purchase.menu_item.description,
      purchase.menu_item.clue_content,
    ]),
  ];

  return parts.filter(Boolean).join("\n");
}
