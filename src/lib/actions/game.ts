"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { generateJoinCode, checkDiagnosis } from "@/lib/utils";
import type { CaseFormData } from "@/lib/types/database";

async function getTeacherId() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  return { supabase, userId: user.id };
}

export async function createCase(data: CaseFormData) {
  const { supabase, userId } = await getTeacherId();

  const { data: newCase, error } = await supabase
    .from("cases")
    .insert({
      teacher_id: userId,
      title: data.title,
      category: data.category,
      patient_age: data.patient_age,
      patient_sex: data.patient_sex,
      chief_complaint: data.chief_complaint,
      case_intro: data.case_intro,
      accepted_diagnoses: data.accepted_diagnoses,
      alternate_accepted_answers: data.alternate_accepted_answers,
      starting_budget: data.starting_budget,
      teacher_notes: data.teacher_notes,
      debrief_content: data.debrief_content,
    })
    .select()
    .single();

  if (error) throw new Error(error.message);

  if (data.menu_items.length > 0) {
    const items = data.menu_items.map((item, index) => ({
      case_id: newCase.id,
      name: item.name,
      cost: item.cost,
      description: item.description,
      clue_content: item.clue_content,
      clue_image_url: item.clue_image_url,
      item_type: item.item_type ?? "test",
      sort_order: item.sort_order ?? index,
    }));

    const { error: itemsError } = await supabase.from("case_menu_items").insert(items);
    if (itemsError) throw new Error(itemsError.message);
  }

  revalidatePath("/teacher/cases");
  redirect(`/teacher/cases/${newCase.id}/edit`);
}

export async function updateCase(caseId: string, data: CaseFormData) {
  const { supabase, userId } = await getTeacherId();

  const { error } = await supabase
    .from("cases")
    .update({
      title: data.title,
      category: data.category,
      patient_age: data.patient_age,
      patient_sex: data.patient_sex,
      chief_complaint: data.chief_complaint,
      case_intro: data.case_intro,
      accepted_diagnoses: data.accepted_diagnoses,
      alternate_accepted_answers: data.alternate_accepted_answers,
      starting_budget: data.starting_budget,
      teacher_notes: data.teacher_notes,
      debrief_content: data.debrief_content,
      updated_at: new Date().toISOString(),
    })
    .eq("id", caseId)
    .eq("teacher_id", userId);

  if (error) throw new Error(error.message);

  await supabase.from("case_menu_items").delete().eq("case_id", caseId);

  if (data.menu_items.length > 0) {
    const items = data.menu_items.map((item, index) => ({
      case_id: caseId,
      name: item.name,
      cost: item.cost,
      description: item.description,
      clue_content: item.clue_content,
      clue_image_url: item.clue_image_url,
      item_type: item.item_type ?? "test",
      sort_order: item.sort_order ?? index,
    }));

    const { error: itemsError } = await supabase.from("case_menu_items").insert(items);
    if (itemsError) throw new Error(itemsError.message);
  }

  revalidatePath("/teacher/cases");
  revalidatePath(`/teacher/cases/${caseId}/edit`);
}

export async function deleteCase(caseId: string) {
  const { supabase, userId } = await getTeacherId();

  const { error } = await supabase
    .from("cases")
    .delete()
    .eq("id", caseId)
    .eq("teacher_id", userId);

  if (error) throw new Error(error.message);
  revalidatePath("/teacher/cases");
  redirect("/teacher/cases");
}

export async function launchSession(caseId: string) {
  const { supabase, userId } = await getTeacherId();

  const { data: caseData } = await supabase
    .from("cases")
    .select("id")
    .eq("id", caseId)
    .eq("teacher_id", userId)
    .single();

  if (!caseData) throw new Error("Case not found");

  let joinCode = generateJoinCode();
  let attempts = 0;

  while (attempts < 5) {
    const { data: existing } = await supabase
      .from("game_sessions")
      .select("id")
      .eq("join_code", joinCode)
      .maybeSingle();

    if (!existing) break;
    joinCode = generateJoinCode();
    attempts++;
  }

  const { data: session, error } = await supabase
    .from("game_sessions")
    .insert({
      case_id: caseId,
      teacher_id: userId,
      join_code: joinCode,
      status: "waiting",
    })
    .select()
    .single();

  if (error) throw new Error(error.message);

  revalidatePath("/teacher/dashboard");
  redirect(`/teacher/sessions/${session.id}`);
}

export async function updateSessionStatus(
  sessionId: string,
  status: "waiting" | "active" | "paused" | "ended"
) {
  const { supabase, userId } = await getTeacherId();

  const updates: Record<string, unknown> = { status };
  if (status === "active") updates.started_at = new Date().toISOString();
  if (status === "ended") updates.ended_at = new Date().toISOString();

  const { error } = await supabase
    .from("game_sessions")
    .update(updates)
    .eq("id", sessionId)
    .eq("teacher_id", userId);

  if (error) throw new Error(error.message);
  revalidatePath(`/teacher/sessions/${sessionId}`);
}

export async function markDiagnosis(
  teamId: string,
  sessionId: string,
  status: "correct" | "incorrect"
) {
  const { supabase, userId } = await getTeacherId();

  const { data: session } = await supabase
    .from("game_sessions")
    .select("id")
    .eq("id", sessionId)
    .eq("teacher_id", userId)
    .single();

  if (!session) throw new Error("Session not found");

  const { error } = await supabase
    .from("teams")
    .update({ diagnosis_status: status })
    .eq("id", teamId);

  if (error) throw new Error(error.message);
  revalidatePath(`/teacher/sessions/${sessionId}`);
}

export async function autoGradeDiagnosis(teamId: string, sessionId: string) {
  const { supabase, userId } = await getTeacherId();

  const { data: session } = await supabase
    .from("game_sessions")
    .select("case_id")
    .eq("id", sessionId)
    .eq("teacher_id", userId)
    .single();

  if (!session) throw new Error("Session not found");

  const { data: team } = await supabase
    .from("teams")
    .select("diagnosis")
    .eq("id", teamId)
    .single();

  const { data: caseData } = await supabase
    .from("cases")
    .select("accepted_diagnoses, alternate_accepted_answers")
    .eq("id", session.case_id)
    .single();

  if (!team?.diagnosis || !caseData) throw new Error("Missing data");

  const isCorrect = checkDiagnosis(
    team.diagnosis,
    caseData.accepted_diagnoses,
    caseData.alternate_accepted_answers
  );

  await markDiagnosis(teamId, sessionId, isCorrect ? "correct" : "incorrect");
}

export async function joinGame(joinCode: string, teamName: string) {
  const supabase = await createClient();

  const { data: session } = await supabase
    .from("game_sessions")
    .select("*, case:cases(*)")
    .eq("join_code", joinCode.toUpperCase())
    .in("status", ["waiting", "active", "paused"])
    .maybeSingle();

  if (!session) throw new Error("Invalid or expired join code");

  const caseData = session.case as { starting_budget: number };

  const { data: team, error } = await supabase
    .from("teams")
    .insert({
      session_id: session.id,
      team_name: teamName.trim(),
      budget_remaining: caseData.starting_budget,
    })
    .select()
    .single();

  if (error) {
    if (error.code === "23505") throw new Error("Team name already taken in this session");
    throw new Error(error.message);
  }

  return { teamId: team.id, sessionId: session.id };
}

export async function purchaseItem(teamId: string, menuItemId: string) {
  const supabase = await createClient();

  const { data, error } = await supabase.rpc("purchase_menu_item", {
    p_team_id: teamId,
    p_menu_item_id: menuItemId,
  });

  if (error) throw new Error(error.message);
  return data;
}

export async function updateTeamNotes(teamId: string, notes: string) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("teams")
    .update({ shared_notes: notes })
    .eq("id", teamId);

  if (error) throw new Error(error.message);
}

export async function submitDiagnosis(
  teamId: string,
  diagnosis: string,
  evidence: string[],
  alternateDiagnosis: string
) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("teams")
    .update({
      diagnosis: diagnosis.trim(),
      evidence: evidence.filter((e) => e.trim()),
      alternate_diagnosis: alternateDiagnosis.trim() || null,
      submitted_at: new Date().toISOString(),
    })
    .eq("id", teamId);

  if (error) throw new Error(error.message);
}
