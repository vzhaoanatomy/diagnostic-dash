import type { Team } from "@/lib/types/database";

export const MIN_PURCHASES_BEFORE_SUBMIT = 3;
export const MAX_SUBMISSION_COUNT = 2;
export const MAX_LOOKUP_WORDS = 5;

export function isDiagnosisLocked(team: Team): boolean {
  const count = team.submission_count ?? 0;
  return (
    count >= MAX_SUBMISSION_COUNT ||
    (count >= 1 && team.diagnosis_status === "correct")
  );
}

export function canResubmitDiagnosis(team: Team): boolean {
  const count = team.submission_count ?? 0;
  return count === 1 && team.diagnosis_status === "incorrect";
}

export function canSubmitDiagnosis(team: Team, purchaseCount: number): boolean {
  if (isDiagnosisLocked(team)) return false;
  if (canResubmitDiagnosis(team)) return true;
  return (team.submission_count ?? 0) === 0 && purchaseCount >= MIN_PURCHASES_BEFORE_SUBMIT;
}

export function purchasesRemainingForSubmit(purchaseCount: number): number {
  return Math.max(0, MIN_PURCHASES_BEFORE_SUBMIT - purchaseCount);
}
