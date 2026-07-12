import type { Team } from "@/lib/types/database";

/** Final score = remaining budget + speed bonus + teacher adjustment */
export function computeFinalBudget(team: Team): number {
  return (
    team.budget_remaining +
    (team.speed_bonus ?? 0) +
    (team.teacher_budget_adjustment ?? 0)
  );
}

export function speedBonusLabel(rank: number | null | undefined): string | null {
  if (rank === 1) return "⚡ 1st correct (+$100)";
  if (rank === 2) return "⚡ 2nd correct (+$50)";
  return null;
}
