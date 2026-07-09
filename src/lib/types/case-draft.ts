import type { MenuItemType } from "@/lib/menu-item-types";

export interface MenuItemDraft {
  name: string;
  cost: number;
  description: string;
  clue_content: string;
  clue_image_url: string | null;
  item_type: MenuItemType;
  sort_order: number;
}

export interface CaseFormDraft {
  title: string;
  category: string;
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
  difficulty?: "introductory" | "intermediate" | "advanced";
  menuItemCount?: number;
}
