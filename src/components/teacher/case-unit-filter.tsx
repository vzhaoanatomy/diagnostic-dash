"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { CURRICULUM_UNITS } from "@/lib/curriculum-units";
import { Label } from "@/components/ui/label";

export function CaseUnitFilter() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const current = searchParams.get("unit") ?? "";

  function handleChange(value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set("unit", value);
    else params.delete("unit");
    router.push(`/teacher/cases?${params.toString()}`);
  }

  return (
    <div className="flex items-center gap-2">
      <Label htmlFor="unit-filter" className="text-sm text-muted-foreground">
        Filter by unit
      </Label>
      <select
        id="unit-filter"
        value={current}
        onChange={(e) => handleChange(e.target.value)}
        className="flex h-9 rounded-md border border-input bg-background px-3 text-sm"
      >
        <option value="">All units</option>
        {CURRICULUM_UNITS.map((unit) => (
          <option key={unit.id} value={unit.id}>
            {unit.label}
          </option>
        ))}
      </select>
    </div>
  );
}
