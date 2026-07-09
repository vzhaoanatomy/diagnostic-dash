export const MENU_ITEM_TYPES = {
  symptom_history: {
    label: "Symptom History",
    group: "Patient Interview",
    description: "Detailed description of what the patient is experiencing",
    defaultCost: 25,
  },
  medical_background: {
    label: "Medical Background",
    group: "Patient Interview",
    description: "Past medical history, medications, family history",
    defaultCost: 25,
  },
  lifestyle_background: {
    label: "Lifestyle Background",
    group: "Patient Interview",
    description: "Diet, habits, and behavioral factors",
    defaultCost: 25,
  },
  test: {
    label: "Test / Exam",
    group: "Diagnostic Tests",
    description: "Labs, imaging, vitals, or physical exam",
    defaultCost: 50,
  },
  image: {
    label: "Image / Attachment",
    group: "Diagnostic Tests",
    description: "Clinical image, ECG, X-ray, or other visual clue",
    defaultCost: 75,
  },
} as const;

export type MenuItemType = keyof typeof MENU_ITEM_TYPES;

export const INTERVIEW_TYPES: MenuItemType[] = [
  "symptom_history",
  "medical_background",
  "lifestyle_background",
];

export function menuItemGroupLabel(type: MenuItemType): string {
  return MENU_ITEM_TYPES[type]?.group ?? "Diagnostic Tests";
}

export function isInterviewType(type: MenuItemType): boolean {
  return INTERVIEW_TYPES.includes(type);
}
