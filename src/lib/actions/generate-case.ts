"use server";

import { createClient } from "@/lib/supabase/server";
import { generateCaseDraft } from "@/lib/ai/generate-case";
import type { CaseFormDraft, GenerateCaseRequest } from "@/lib/types/case-draft";

export type GenerateCaseResult =
  | { success: true; draft: CaseFormDraft }
  | { success: false; error: string };

export async function generateCaseWithAI(
  input: GenerateCaseRequest
): Promise<GenerateCaseResult> {
  try {
    const topic = input.topic?.trim();
    if (!topic || topic.length < 3) {
      return { success: false, error: "Please enter a topic (at least 3 characters)." };
    }

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, error: "You must be logged in as a teacher." };
    }

    const draft = await generateCaseDraft({
      topic,
      suggestedTests: input.suggestedTests?.trim(),
      difficulty: input.difficulty,
      menuItemCount: input.menuItemCount,
    });

    return { success: true, draft };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Generation failed";
    return { success: false, error: message };
  }
}
