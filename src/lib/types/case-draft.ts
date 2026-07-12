import type { MenuItemType } from "@/lib/menu-item-types";
import type { CaseDifficulty } from "@/lib/difficulty-budget";
import type { PrimaryUnit } from "@/lib/curriculum-units";

export interface MenuItemDraft {
  name: string;
  cost: number;
  description: string;
  clue_content: string;
  clue_image_url: string | null;
  item_type: MenuItemType;
  reference_range: string;
  interpretation: string;
  sort_order: number;
}

export interface CaseFormDraft {
  title: string;
  category: string;
  difficulty: CaseDifficulty;
  primary_unit: PrimaryUnit;
  patient_age: number;
  patient_sex: string;
  chief_complaint: string;
  case_intro: string;
  accepted_diagnoses: string[];
  alternate_accepted_answers: string[];
  starting_budget: number;
  teacher_notes: string;
  debrief_content: string;
  menu_items: MenuItemDraft[];
}

export interface GenerateCaseRequest {
  topic: string;
  suggestedTests?: string;
  difficulty?: CaseDifficulty;
  primaryUnit?: PrimaryUnit;
  menuItemCount?: number;
}
