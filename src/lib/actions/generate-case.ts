"use server";

import { createClient } from "@/lib/supabase/server";
import { generateCaseDraft } from "@/lib/ai/generate-case";
import type { CaseFormDraft, GenerateCaseRequest } from "@/lib/types/case-draft";

export async function generateCaseWithAI(
  input: GenerateCaseRequest
): Promise<CaseFormDraft> {
  const topic = input.topic?.trim();
  if (!topic || topic.length < 3) {
    throw new Error("Please enter a topic (at least 3 characters).");
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  return generateCaseDraft({
    topic,
    suggestedTests: input.suggestedTests?.trim(),
    difficulty: input.difficulty,
    menuItemCount: input.menuItemCount,
  });
}
