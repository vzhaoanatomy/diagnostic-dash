export const CURRICULUM_UNITS = [
  { id: "integumentary", label: "Integumentary", order: 1 },
  { id: "skeletal", label: "Skeletal", order: 2 },
  { id: "muscular", label: "Muscular", order: 3 },
  { id: "nervous", label: "Nervous", order: 4 },
  { id: "cardiovascular", label: "Cardiovascular", order: 5 },
  { id: "digestive", label: "Digestive", order: 6 },
  { id: "respiratory", label: "Respiratory", order: 7 },
  { id: "urinary", label: "Urinary", order: 8 },
  { id: "reproductive", label: "Reproductive", order: 9 },
  { id: "immune", label: "Immune", order: 10 },
  { id: "mixed", label: "Mixed / Cross-cutting", order: 11 },
] as const;

export type PrimaryUnit = (typeof CURRICULUM_UNITS)[number]["id"];

export function getUnitLabel(unit: string): string {
  return CURRICULUM_UNITS.find((u) => u.id === unit)?.label ?? unit;
}

export function isPrimaryUnit(value: string): value is PrimaryUnit {
  return CURRICULUM_UNITS.some((u) => u.id === value);
}
