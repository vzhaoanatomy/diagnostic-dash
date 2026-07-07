import type { CaseFormDraft } from "@/lib/types/case-draft";

const SYSTEM_PROMPT = `You are a medical education case writer for a team-based diagnosis classroom game.

Generate a realistic, educational clinical case as JSON matching this exact schema:
{
  "title": string,
  "category": string (medical specialty),
  "patient_age": number,
  "patient_sex": string,
  "chief_complaint": string (short, one line),
  "case_intro": string (2-4 paragraphs, patient presentation shown to students — no diagnosis spoilers),
  "accepted_diagnoses": string[] (3-6 acceptable primary diagnosis phrases),
  "alternate_accepted_answers": string[] (2-4 alternate phrasings),
  "starting_budget": number (usually 1000),
  "teacher_notes": string (private teaching points for the instructor),
  "debrief_content": string (markdown-style debrief with correct diagnosis, workup path, common mistakes),
  "menu_items": [
    {
      "name": string,
      "cost": number,
      "description": string (what students see before buying),
      "clue_content": string (realistic results/findings revealed after purchase),
      "sort_order": number
    }
  ]
}

Rules for menu_items:
- Include 8-12 items total
- Mix: vital signs & exam (cheap, $25-75), labs ($40-150), imaging ($150-800)
- Include 1-2 low-yield/red herring tests students might wastefully order
- Critical diagnostic clues must be present among the items
- Costs should make students prioritize — full workup should exceed budget if they order everything
- clue_content must use realistic values with reference ranges where appropriate
- Do NOT include clue_image_url

Return ONLY valid JSON, no markdown fences.`;

export async function generateCaseDraft(input: {
  topic: string;
  suggestedTests?: string;
  difficulty?: string;
  menuItemCount?: number;
}): Promise<CaseFormDraft> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error(
      "OPENAI_API_KEY is not configured. Add it to your environment variables (Vercel → Settings → Environment Variables)."
    );
  }

  const userPrompt = [
    `Topic: ${input.topic}`,
    input.suggestedTests
      ? `Include or consider these tests/workup items: ${input.suggestedTests}`
      : null,
    input.difficulty ? `Difficulty: ${input.difficulty}` : "Difficulty: intermediate",
    input.menuItemCount ? `Target ~${input.menuItemCount} menu items` : "Target 8-12 menu items",
  ]
    .filter(Boolean)
    .join("\n");

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
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: userPrompt },
      ],
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`AI generation failed: ${err.slice(0, 200)}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content;
  if (!content) throw new Error("AI returned an empty response");

  let parsed: unknown;
  try {
    parsed = JSON.parse(content);
  } catch {
    throw new Error("AI returned invalid JSON. Please try again.");
  }

  return normalizeDraft(parsed);
}

function normalizeDraft(raw: unknown): CaseFormDraft {
  const obj = raw as Record<string, unknown>;

  const menuItemsRaw = Array.isArray(obj.menu_items) ? obj.menu_items : [];
  const menu_items = menuItemsRaw.map((item, index) => {
    const m = item as Record<string, unknown>;
    return {
      name: String(m.name ?? `Item ${index + 1}`),
      cost: Math.max(0, Number(m.cost) || 50),
      description: String(m.description ?? ""),
      clue_content: String(m.clue_content ?? ""),
      clue_image_url: null,
      sort_order: Number(m.sort_order) || index,
    };
  });

  if (menu_items.length === 0) {
    throw new Error("AI did not generate any menu items. Please try again.");
  }

  return {
    title: String(obj.title ?? "Untitled Case"),
    category: String(obj.category ?? "General"),
    patient_age: Math.max(0, Number(obj.patient_age) || 30),
    patient_sex: String(obj.patient_sex ?? "Unknown"),
    chief_complaint: String(obj.chief_complaint ?? ""),
    case_intro: String(obj.case_intro ?? ""),
    accepted_diagnoses: toStringArray(obj.accepted_diagnoses),
    alternate_accepted_answers: toStringArray(obj.alternate_accepted_answers),
    starting_budget: Math.max(100, Number(obj.starting_budget) || 1000),
    teacher_notes: String(obj.teacher_notes ?? ""),
    debrief_content: String(obj.debrief_content ?? ""),
    menu_items,
  };
}

function toStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.map(String).filter(Boolean);
}
