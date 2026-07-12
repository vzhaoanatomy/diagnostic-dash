const TERM_LOOKUP_MODELS = ["gemini-2.5-flash-lite", "gemini-flash-latest", "gemini-2.5-flash"];

export async function defineMedicalTermWithGemini(term: string): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey) {
    throw new Error("Term lookup is not configured.");
  }

  const { TERM_LOOKUP_SYSTEM_PROMPT, buildTermLookupUserPrompt } = await import(
    "@/lib/ai/term-lookup-prompt"
  );
  const userPrompt = buildTermLookupUserPrompt(term);

  let lastError = "Lookup failed.";

  for (const model of TERM_LOOKUP_MODELS) {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: TERM_LOOKUP_SYSTEM_PROMPT }] },
          contents: [{ role: "user", parts: [{ text: userPrompt }] }],
          generationConfig: { temperature: 0.2, maxOutputTokens: 256 },
        }),
      }
    );

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      lastError =
        (err as { error?: { message?: string } }).error?.message ?? `Lookup failed (${response.status})`;
      continue;
    }

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
    if (text) return text;
  }

  throw new Error(lastError);
}
