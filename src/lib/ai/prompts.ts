export const CASE_GENERATION_SYSTEM_PROMPT = `You are a medical education case writer for a team-based diagnosis classroom game.

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

export function buildCaseUserPrompt(input: {
  topic: string;
  suggestedTests?: string;
  difficulty?: string;
  menuItemCount?: number;
}): string {
  return [
    `Topic: ${input.topic}`,
    input.suggestedTests
      ? `Include or consider these tests/workup items: ${input.suggestedTests}`
      : null,
    input.difficulty ? `Difficulty: ${input.difficulty}` : "Difficulty: intermediate",
    input.menuItemCount ? `Target ~${input.menuItemCount} menu items` : "Target 8-12 menu items",
  ]
    .filter(Boolean)
    .join("\n");
}
