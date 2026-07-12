"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { PresentationPrepData } from "@/lib/types/database";

async function getTeacherId() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  return { supabase, userId: user.id };
}

export async function updateTeamPresentationPrep(
  teamId: string,
  data: PresentationPrepData
) {
  const supabase = await createClient();

  const { data: team } = await supabase
    .from("teams")
    .select("submitted_at")
    .eq("id", teamId)
    .single();

  if (!team?.submitted_at) {
    throw new Error("Complete your diagnosis submission first.");
  }

  const treatment = data.treatment_plan.map((t) => t.trim()).filter(Boolean);

  const { error } = await supabase
    .from("teams")
    .update({
      pathophys_explanation: data.pathophys_explanation.trim(),
      treatment_plan: treatment,
      key_orders_reflection: data.key_orders_reflection.trim(),
      purchase_journey: data.purchase_journey.trim(),
      presentation_notes: data.presentation_notes.trim(),
    })
    .eq("id", teamId);

  if (error) throw new Error(error.message);
}

export async function updateTeamFinalBudget(
  teamId: string,
  sessionId: string,
  finalAmount: number
) {
  const { supabase, userId } = await getTeacherId();

  const { data: session } = await supabase
    .from("game_sessions")
    .select("id")
    .eq("id", sessionId)
    .eq("teacher_id", userId)
    .single();

  if (!session) throw new Error("Session not found");

  const { data: team } = await supabase
    .from("teams")
    .select("budget_remaining, speed_bonus, teacher_budget_adjustment")
    .eq("id", teamId)
    .single();

  if (!team) throw new Error("Team not found");

  const adjustment =
    finalAmount - team.budget_remaining - (team.speed_bonus ?? 0);

  const { error } = await supabase
    .from("teams")
    .update({ teacher_budget_adjustment: adjustment })
    .eq("id", teamId);

  if (error) throw new Error(error.message);
  revalidatePath(`/teacher/sessions/${sessionId}`);
}

export async function startRoundTimer(sessionId: string, seconds: number) {
  const { supabase, userId } = await getTeacherId();

  const endsAt = new Date(Date.now() + seconds * 1000).toISOString();

  const { error } = await supabase
    .from("game_sessions")
    .update({
      round_timer_ends_at: endsAt,
      round_timer_seconds: seconds,
    })
    .eq("id", sessionId)
    .eq("teacher_id", userId);

  if (error) throw new Error(error.message);
  revalidatePath(`/teacher/sessions/${sessionId}`);
}

export async function clearRoundTimer(sessionId: string) {
  const { supabase, userId } = await getTeacherId();

  const { error } = await supabase
    .from("game_sessions")
    .update({
      round_timer_ends_at: null,
      round_timer_seconds: null,
    })
    .eq("id", sessionId)
    .eq("teacher_id", userId);

  if (error) throw new Error(error.message);
  revalidatePath(`/teacher/sessions/${sessionId}`);
}
