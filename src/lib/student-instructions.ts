import { SPEED_BONUS_FIRST, SPEED_BONUS_SECOND } from "@/lib/difficulty-budget";

export function getStudentInstructions(
  strictMode: boolean,
  startingBudget = 750
): { title: string; body: string[] } {
  const body = [
    `You're a diagnostic team. A patient has come to clinic with a complaint. You have $${startingBudget} and limited information. Diagnose the patient as accurately and efficiently as you can.`,
    "**Free information:** Age, sex, chief complaint, and a brief presentation.",
    "**How to play:** (1) Work together on one device per team. (2) Go to Order Clues to buy patient history and tests — each purchase costs money and appears in your Case File. (3) You must purchase at least 4 clues before submitting. (4) Use Team Notes to track your reasoning. (5) Submit your best diagnosis with exactly 3 pieces of evidence from clues you bought.",
    "**Speed bonus:** The first team to submit a correct diagnosis earns +$100; the second correct team earns +$50. These bonuses count toward your final score.",
    "**Submitting:** This is about getting it right, not guessing repeatedly. You get one official submission. If it's marked incorrect, you may revise and resubmit once. Use that second chance wisely — buy more clues if you need them.",
    "**Medical terms:** Use Term Lookup (free, no budget cost) for words you don't know — even terms that appear in your clues, like \"sciatic\" or \"TSH.\" Keep it to a few words; it defines vocabulary only and won't give you the diagnosis.",
    "**After you submit:** Complete the Presentation Prep workbook — explain your purchase journey, connect the dots on pathophysiology, and outline a treatment plan for presenting to other teams.",
    `**Winning:** Correct diagnosis matters. So does money remaining (plus any speed bonus: +$${SPEED_BONUS_FIRST} / +$${SPEED_BONUS_SECOND}). Your teacher reviews results when the session ends.`,
  ];

  if (strictMode) {
    body.splice(
      3,
      0,
      "**Strict mode:** Order at least one Patient Interview clue (Symptom History, Medical Background, or Lifestyle Background) before ordering labs, imaging, or other tests."
    );
  }

  return {
    title: "How to Play",
    body,
  };
}
