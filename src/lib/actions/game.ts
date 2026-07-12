"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  MIN_PURCHASES_BEFORE_SUBMIT,
  MAX_SUBMISSION_COUNT,
  isDiagnosisLocked,
  canResubmitDiagnosis,
} from "@/lib/game-rules";
import { isInterviewType, type MenuItemType } from "@/lib/menu-item-types";
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

export async function launchSession(caseId: string, strictMode = false) {
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
      strict_mode: strictMode,
    })
    .select()
    .single();

  if (error) throw new Error(error.message);

  revalidatePath("/teacher/dashboard");
  redirect(`/teacher/sessions/${session.id}`);
}

export async function updateSessionStrictMode(sessionId: string, strictMode: boolean) {
  const { supabase, userId } = await getTeacherId();

  const { error } = await supabase
    .from("game_sessions")
    .update({ strict_mode: strictMode })
    .eq("id", sessionId)
    .eq("teacher_id", userId)
    .in("status", ["waiting", "paused"]);

  if (error) throw new Error(error.message);
  revalidatePath(`/teacher/sessions/${sessionId}`);
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

  const { data: team } = await supabase
    .from("teams")
    .select("*, session:game_sessions(strict_mode, status)")
    .eq("id", teamId)
    .single();

  if (!team) throw new Error("Team not found");

  if (isDiagnosisLocked(team)) {
    throw new Error("Your diagnosis is finalized — no more purchases.");
  }

  const session = team.session as { strict_mode: boolean; status: string };
  if (session.status === "paused" || session.status === "ended") {
    throw new Error("Purchases are not available right now.");
  }

  const { data: menuItem } = await supabase
    .from("case_menu_items")
    .select("*")
    .eq("id", menuItemId)
    .single();

  if (!menuItem) throw new Error("Item not found");

  const itemType = (menuItem.item_type ?? "test") as MenuItemType;
  const needsInterviewFirst =
    session.strict_mode && !isInterviewType(itemType) && (itemType === "test" || itemType === "image");

  if (needsInterviewFirst) {
    const { data: purchases } = await supabase
      .from("team_purchases")
      .select("menu_item:case_menu_items(item_type)")
      .eq("team_id", teamId);

    const hasInterview = (purchases ?? []).some((purchase) => {
      const item = purchase.menu_item as { item_type?: string } | null;
      return item?.item_type ? isInterviewType(item.item_type as MenuItemType) : false;
    });

    if (!hasInterview) {
      throw new Error(
        "Strict mode: order a Patient Interview clue (Symptom History, Medical Background, or Lifestyle Background) before tests or images."
      );
    }
  }

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
): Promise<{
  submissionCount: number;
  diagnosisStatus: "correct" | "incorrect";
  canResubmit: boolean;
}> {
  const supabase = await createClient();

  const { data: team } = await supabase
    .from("teams")
    .select("*, session:game_sessions(case_id, status)")
    .eq("id", teamId)
    .single();

  if (!team) throw new Error("Team not found");

  const session = team.session as { case_id: string; status: string };
  if (session.status === "paused" || session.status === "ended") {
    throw new Error("Submissions are not available right now.");
  }

  if (isDiagnosisLocked(team)) {
    throw new Error("Your diagnosis is already finalized.");
  }

  const isResubmit = canResubmitDiagnosis(team);

  const { count: purchaseCount } = await supabase
    .from("team_purchases")
    .select("*", { count: "exact", head: true })
    .eq("team_id", teamId);

  if (!isResubmit && (purchaseCount ?? 0) < MIN_PURCHASES_BEFORE_SUBMIT) {
    throw new Error(
      `Purchase at least ${MIN_PURCHASES_BEFORE_SUBMIT} clues before submitting (${purchaseCount ?? 0}/${MIN_PURCHASES_BEFORE_SUBMIT} so far).`
    );
  }

  const { data: caseData } = await supabase
    .from("cases")
    .select("accepted_diagnoses, alternate_accepted_answers")
    .eq("id", session.case_id)
    .single();

  if (!caseData) throw new Error("Case not found");

  const trimmedDiagnosis = diagnosis.trim();
  const isCorrect = checkDiagnosis(
    trimmedDiagnosis,
    caseData.accepted_diagnoses,
    caseData.alternate_accepted_answers
  );
  const diagnosisStatus = isCorrect ? "correct" : "incorrect";
  const newSubmissionCount = isResubmit ? MAX_SUBMISSION_COUNT : 1;
  const now = new Date().toISOString();

  const updates: Record<string, unknown> = {
    diagnosis: trimmedDiagnosis,
    evidence: evidence.filter((e) => e.trim()),
    alternate_diagnosis: alternateDiagnosis.trim() || null,
    diagnosis_status: diagnosisStatus,
    submission_count: newSubmissionCount,
    submitted_at: team.submitted_at ?? now,
  };

  if (!isResubmit) {
    updates.first_diagnosis = trimmedDiagnosis;
    updates.first_submitted_at = now;
  }

  const { error } = await supabase.from("teams").update(updates).eq("id", teamId);

  if (error) throw new Error(error.message);

  return {
    submissionCount: newSubmissionCount,
    diagnosisStatus,
    canResubmit: diagnosisStatus === "incorrect" && newSubmissionCount === 1,
  };
}
