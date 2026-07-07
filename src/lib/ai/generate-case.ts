import type { CaseFormDraft } from "@/lib/types/case-draft";
import { generateWithGemini } from "@/lib/ai/providers/gemini";
import { generateWithOpenAI } from "@/lib/ai/providers/openai";

type GenerateInput = {
  topic: string;
  suggestedTests?: string;
  difficulty?: string;
  menuItemCount?: number;
};

function resolveProvider(): "gemini" | "openai" | null {
  const configured = process.env.AI_PROVIDER?.trim().toLowerCase();
  if (configured === "gemini" && process.env.GEMINI_API_KEY?.trim()) return "gemini";
  if (configured === "openai" && process.env.OPENAI_API_KEY?.trim()) return "openai";

  if (process.env.GEMINI_API_KEY?.trim()) return "gemini";
  if (process.env.OPENAI_API_KEY?.trim()) return "openai";

  return null;
}

export async function generateCaseDraft(input: GenerateInput): Promise<CaseFormDraft> {
  const provider = resolveProvider();

  if (!provider) {
    throw new Error(
      "No AI provider configured. Add GEMINI_API_KEY (free — get one at aistudio.google.com/apikey) or OPENAI_API_KEY in Vercel → Settings → Environment Variables, then redeploy."
    );
  }

  if (provider === "gemini") {
    return generateWithGemini(input);
  }

  return generateWithOpenAI(input);
}
