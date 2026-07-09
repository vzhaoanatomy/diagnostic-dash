import { CASE_GENERATION_SYSTEM_PROMPT, buildCaseUserPrompt } from "@/lib/ai/prompts";
import { normalizeDraft, parseJsonContent } from "@/lib/ai/normalize-draft";
import type { CaseFormDraft } from "@/lib/types/case-draft";

/** Try lite/smaller models first — often more available under load. */
const FALLBACK_MODELS = [
  "gemini-2.5-flash-lite",
  "gemini-flash-latest",
  "gemini-2.5-flash",
  "gemini-2.0-flash",
];

function isRetryableError(message: string): boolean {
  const lower = message.toLowerCase();
  return (
    lower.includes("quota") ||
    lower.includes("rate") ||
    lower.includes("limit: 0") ||
    lower.includes("not found") ||
    lower.includes("not supported") ||
    lower.includes("high demand") ||
    lower.includes("overloaded") ||
    lower.includes("unavailable") ||
    lower.includes("try again")
  );
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function callGeminiModel(
  apiKey: string,
  model: string,
  userPrompt: string
): Promise<{ ok: true; content: string } | { ok: false; message: string; retry: boolean }> {
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        systemInstruction: {
          parts: [{ text: CASE_GENERATION_SYSTEM_PROMPT }],
        },
        contents: [{ role: "user", parts: [{ text: userPrompt }] }],
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
        error?: { message?: string };
      };
      if (err.error?.message) {
        message = err.error.message;
        if (message.includes("API key")) {
          message =
            "Invalid Gemini API key. Get a free key at aistudio.google.com/apikey";
        }
      }
    } catch {
      // use default
    }

    const retry = isRetryableError(message);
    return { ok: false, message, retry };
  }

  const data = await response.json();
  const content = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!content) {
    return { ok: false, message: "Gemini returned an empty response.", retry: true };
  }

  return { ok: true, content };
}

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

  const userPrompt = buildCaseUserPrompt(input);
  const configuredModel = process.env.GEMINI_MODEL?.trim();
  const modelsToTry = configuredModel
    ? [configuredModel, ...FALLBACK_MODELS.filter((m) => m !== configuredModel)]
    : FALLBACK_MODELS;

  let lastError = "Gemini generation failed.";
  let triedHighDemand = false;

  for (let i = 0; i < modelsToTry.length; i++) {
    const model = modelsToTry[i];
    if (i > 0) await sleep(800);

    const result = await callGeminiModel(apiKey, model, userPrompt);
    if (result.ok) {
      return normalizeDraft(parseJsonContent(result.content));
    }
    lastError = result.message;
    if (lastError.toLowerCase().includes("high demand")) triedHighDemand = true;
    if (!result.retry) break;
  }

  if (lastError.includes("quota") || lastError.includes("limit: 0")) {
    throw new Error(
      "Gemini free tier limit reached. Wait a minute and try again, or remove GEMINI_MODEL from Vercel so the app auto-picks a supported model."
    );
  }

  if (triedHighDemand) {
    throw new Error(
      "Gemini is busy right now (high demand). Wait 30–60 seconds and click Generate again — this is temporary."
    );
  }

  throw new Error(lastError);
}
