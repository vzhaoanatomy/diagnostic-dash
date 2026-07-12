import type { Team } from "@/lib/types/database";

export const MIN_PURCHASES_BEFORE_SUBMIT = 4;
export const MIN_EVIDENCE_PIECES = 3;
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

export function validateEvidence(evidence: string[]): string | null {
  const filled = evidence.map((e) => e.trim()).filter(Boolean);
  if (filled.length < MIN_EVIDENCE_PIECES) {
    return `Provide exactly ${MIN_EVIDENCE_PIECES} pieces of evidence from clues you purchased.`;
  }
  return null;
}
