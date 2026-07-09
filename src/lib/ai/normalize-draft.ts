import type { CaseFormDraft } from "@/lib/types/case-draft";
import type { MenuItemType } from "@/lib/menu-item-types";

const VALID_ITEM_TYPES = new Set<MenuItemType>([
  "symptom_history",
  "medical_background",
  "lifestyle_background",
  "test",
  "image",
]);

function normalizeItemType(value: unknown): MenuItemType {
  const type = String(value ?? "test") as MenuItemType;
  return VALID_ITEM_TYPES.has(type) ? type : "test";
}

export function normalizeDraft(raw: unknown): CaseFormDraft {
  const obj = raw as Record<string, unknown>;

  const menuItemsRaw = Array.isArray(obj.menu_items) ? obj.menu_items : [];
  const menu_items = menuItemsRaw.map((item, index) => {
    const m = item as Record<string, unknown>;
    const item_type = normalizeItemType(m.item_type);
    return {
      name: String(m.name ?? `Item ${index + 1}`),
      cost: Math.max(0, Number(m.cost) || 50),
      description: String(m.description ?? ""),
      clue_content: String(m.clue_content ?? ""),
      clue_image_url: null,
      item_type,
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

export function parseJsonContent(content: string): unknown {
  try {
    return JSON.parse(content);
  } catch {
    throw new Error("AI returned invalid JSON. Please try again.");
  }
}

function toStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.map(String).filter(Boolean);
}
