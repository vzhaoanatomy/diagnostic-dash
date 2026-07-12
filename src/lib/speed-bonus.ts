import { createClient } from "@/lib/supabase/server";
import { SPEED_BONUS_FIRST, SPEED_BONUS_SECOND } from "@/lib/difficulty-budget";

/** Award speed bonus to first two correct teams in a session (once per team). */
export async function applySpeedBonusIfEligible(
  supabase: Awaited<ReturnType<typeof createClient>>,
  teamId: string,
  sessionId: string
) {
  const { data: team } = await supabase
    .from("teams")
    .select("speed_bonus")
    .eq("id", teamId)
    .single();

  if (!team || (team.speed_bonus ?? 0) > 0) return;

  const { count: priorCorrect } = await supabase
    .from("teams")
    .select("*", { count: "exact", head: true })
    .eq("session_id", sessionId)
    .eq("diagnosis_status", "correct")
    .neq("id", teamId);

  let bonus = 0;
  let rank: number | null = null;
  if ((priorCorrect ?? 0) === 0) {
    bonus = SPEED_BONUS_FIRST;
    rank = 1;
  } else if ((priorCorrect ?? 0) === 1) {
    bonus = SPEED_BONUS_SECOND;
    rank = 2;
  }

  if (bonus > 0) {
    await supabase
      .from("teams")
      .update({
        speed_bonus: bonus,
        speed_rank: rank,
      })
      .eq("id", teamId);
  }
}
