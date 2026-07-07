import { CASE_GENERATION_SYSTEM_PROMPT, buildCaseUserPrompt } from "@/lib/ai/prompts";
import { normalizeDraft, parseJsonContent } from "@/lib/ai/normalize-draft";
import type { CaseFormDraft } from "@/lib/types/case-draft";

export async function generateWithOpenAI(input: {
  topic: string;
  suggestedTests?: string;
  difficulty?: string;
  menuItemCount?: number;
}): Promise<CaseFormDraft> {
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is not set.");
  }

  const userPrompt = buildCaseUserPrompt(input);

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: process.env.OPENAI_MODEL ?? "gpt-4o-mini",
      temperature: 0.7,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: CASE_GENERATION_SYSTEM_PROMPT },
        { role: "user", content: userPrompt },
      ],
    }),
  });

  if (!response.ok) {
    let message = "OpenAI generation failed.";
    try {
      const err = JSON.parse(await response.text()) as {
        error?: { message?: string; code?: string };
      };
      const apiMessage = err.error?.message;
      if (apiMessage) {
        message = apiMessage;
        if (err.error?.code === "invalid_api_key") {
          message = "Invalid OpenAI API key.";
        }
        if (apiMessage.includes("quota") || apiMessage.includes("billing")) {
          message =
            "OpenAI requires billing. Use Google Gemini instead — free at aistudio.google.com/apikey (set GEMINI_API_KEY in Vercel).";
        }
      }
    } catch {
      // use default
    }
    throw new Error(message);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content;
  if (!content) throw new Error("OpenAI returned an empty response.");

  return normalizeDraft(parseJsonContent(content));
}
