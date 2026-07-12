import { MAX_LOOKUP_WORDS } from "@/lib/game-rules";
import { normalizeAnswer } from "@/lib/utils";

const BLOCKED_PATTERNS = [
  /what('s| is) wrong/i,
  /what disease/i,
  /what diagnosis/i,
  /diagnose/i,
  /this patient/i,
  /could (it|this) be/i,
  /most likely/i,
  /what does (the )?patient have/i,
];

const FILLER_PREFIX = /^(what is|what's|define|meaning of|explain)\s+/i;

export function normalizeLookupQuery(raw: string): string {
  return raw.trim().replace(FILLER_PREFIX, "").trim();
}

export function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

export function validateLookupQuery(
  rawQuery: string,
  options: {
    visibleCaseText: string;
    blockedTerms: string[];
  }
): { ok: true; term: string } | { ok: false; error: string } {
  const trimmed = rawQuery.trim();
  if (!trimmed) {
    return { ok: false, error: "Enter a medical term to look up." };
  }

  if (countWords(trimmed) > MAX_LOOKUP_WORDS) {
    return {
      ok: false,
      error: `Keep it short — max ${MAX_LOOKUP_WORDS} words (e.g. "bradycardia" or "what is TSH").`,
    };
  }

  for (const pattern of BLOCKED_PATTERNS) {
    if (pattern.test(trimmed)) {
      return {
        ok: false,
        error: "Term lookup is for vocabulary only, not diagnosing the case.",
      };
    }
  }

  const term = normalizeLookupQuery(trimmed);
  if (!term) {
    return { ok: false, error: "Enter a medical term to look up." };
  }

  const normalizedTerm = normalizeAnswer(term);
  const visibleNormalized = normalizeAnswer(options.visibleCaseText);

  if (normalizedTerm.length >= 4 && visibleNormalized.includes(normalizedTerm)) {
    return {
      ok: false,
      error: "That text appears in your case materials. Term lookup is for outside vocabulary only.",
    };
  }

  if (trimmed.length >= 12 && visibleNormalized.includes(normalizeAnswer(trimmed))) {
    return {
      ok: false,
      error: "That text appears in your case materials. Term lookup is for outside vocabulary only.",
    };
  }

  for (const blocked of options.blockedTerms) {
    const normalizedBlocked = normalizeAnswer(blocked);
    if (!normalizedBlocked) continue;
    if (
      normalizedTerm === normalizedBlocked ||
      normalizedTerm.includes(normalizedBlocked) ||
      normalizedBlocked.includes(normalizedTerm)
    ) {
      return {
        ok: false,
        error: "That term is too close to a possible diagnosis. Try a general vocabulary word instead.",
      };
    }
  }

  return { ok: true, term };
}

export function responseContainsBlockedTerm(
  response: string,
  blockedTerms: string[]
): boolean {
  const normalizedResponse = normalizeAnswer(response);
  return blockedTerms.some((term) => {
    const normalized = normalizeAnswer(term);
    return normalized.length >= 4 && normalizedResponse.includes(normalized);
  });
}
