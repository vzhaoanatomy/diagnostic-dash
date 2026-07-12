export type CaseDifficulty = "introductory" | "intermediate" | "advanced";

export const DIFFICULTY_OPTIONS: { id: CaseDifficulty; label: string; budget: number }[] = [
  { id: "introductory", label: "Introductory", budget: 500 },
  { id: "intermediate", label: "Intermediate", budget: 750 },
  { id: "advanced", label: "Advanced", budget: 1000 },
];

export const SPEED_BONUS_FIRST = 100;
export const SPEED_BONUS_SECOND = 50;

export function budgetForDifficulty(difficulty: CaseDifficulty): number {
  return DIFFICULTY_OPTIONS.find((d) => d.id === difficulty)?.budget ?? 750;
}

export function isCaseDifficulty(value: string): value is CaseDifficulty {
  return DIFFICULTY_OPTIONS.some((d) => d.id === value);
}
