import { CASE_GENERATION_SYSTEM_PROMPT, buildCaseUserPrompt } from "@/lib/ai/prompts";
import { normalizeDraft, parseJsonContent } from "@/lib/ai/normalize-draft";
import type { CaseFormDraft } from "@/lib/types/case-draft";

export async function generateWithGemini(input: {
  topic: string;
  suggestedTests?: string;
  difficulty?: string;
  menuItemCount?: number;
}): Promise<CaseFormDraft> {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not set.");
  }

  const model = process.env.GEMINI_MODEL ?? "gemini-2.0-flash";
  const userPrompt = buildCaseUserPrompt(input);

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        systemInstruction: {
          parts: [{ text: CASE_GENERATION_SYSTEM_PROMPT }],
        },
        contents: [
          {
            role: "user",
            parts: [{ text: userPrompt }],
          },
        ],
        generationConfig: {
          temperature: 0.7,
          responseMimeType: "application/json",
        },
      }),
    }
  );

  if (!response.ok) {
    let message = "Gemini generation failed.";
    try {
      const err = JSON.parse(await response.text()) as {
        error?: { message?: string; status?: string };
      };
      if (err.error?.message) {
        message = err.error.message;
        if (message.includes("API key")) {
          message =
            "Invalid Gemini API key. Get a free key at aistudio.google.com/apikey and add GEMINI_API_KEY in Vercel.";
        }
      }
    } catch {
      // use default
    }
    throw new Error(message);
  }

  const data = await response.json();
  const content = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!content) throw new Error("Gemini returned an empty response. Please try again.");

  return normalizeDraft(parseJsonContent(content));
}
