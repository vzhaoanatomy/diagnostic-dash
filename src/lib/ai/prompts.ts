export const CASE_GENERATION_SYSTEM_PROMPT = `You are a medical education case writer for a team-based diagnosis classroom game.

Generate a realistic, educational clinical case as JSON matching this exact schema:
{
  "title": string,
  "category": string (medical specialty),
  "patient_age": number,
  "patient_sex": string,
  "chief_complaint": string (short, one line),
  "case_intro": string (ONE short paragraph only — who the patient is, setting, and chief complaint context. Do NOT include detailed symptom history, PMH, medications, family history, or lifestyle details — students must order those separately),
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
      "item_type": "symptom_history" | "medical_background" | "lifestyle_background" | "test" | "image",
      "sort_order": number
    }
  ]
}

Rules for menu_items:
- Include 10-14 items total
- REQUIRED: exactly these 3 patient interview items (cheap, $20-35 each, sort_order 1-3):
  1. "Symptom History" (item_type: symptom_history) — detailed HPI with timeline, associated symptoms, negatives
  2. "Medical Background" (item_type: medical_background) — PMH, medications, allergies, family history
  3. "Lifestyle Background" (item_type: lifestyle_background) — diet, exercise, sleep, substance use, stressors
- Then 6-10 diagnostic items (item_type: test): vitals/exam ($25-75), labs ($40-150), imaging ($150-800)
- Include 1 optional image clue (item_type: image) — e.g. ECG, X-ray, skin finding photo. Use clue_content to describe what the image shows; leave clue_image_url out (teacher adds image later)
- Include 1-2 low-yield/red herring tests students might wastefully order
- Critical diagnostic clues must be present among the test items
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
    input.menuItemCount
      ? `Target ~${input.menuItemCount} menu items (including the 3 required interview items)`
      : "Target 10-14 menu items (including Symptom History, Medical Background, Lifestyle Background)",
  ]
    .filter(Boolean)
    .join("\n");
}
