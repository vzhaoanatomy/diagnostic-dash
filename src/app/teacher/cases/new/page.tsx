"use client";

import { useState } from "react";
import { CaseForm } from "@/components/teacher/case-form";
import { CaseGenerator } from "@/components/teacher/case-generator";
import type { CaseFormDraft } from "@/lib/types/case-draft";
import { Badge } from "@/components/ui/badge";

export default function NewCasePage() {
  const [draft, setDraft] = useState<CaseFormDraft | null>(null);
  const [formKey, setFormKey] = useState(0);

  function handleGenerated(generated: CaseFormDraft) {
    setDraft(generated);
    setFormKey((k) => k + 1);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">New Case</h1>
        <p className="mt-1 text-muted-foreground">
          Generate a draft with AI or fill in the form manually
        </p>
      </div>

      <CaseGenerator onGenerated={handleGenerated} />

      {draft && (
        <div className="flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
          <Badge className="bg-green-100 text-green-800">Draft ready</Badge>
          Review and edit below, then click Create Case.
        </div>
      )}

      <CaseForm key={formKey} initialDraft={draft ?? undefined} />
    </div>
  );
}
