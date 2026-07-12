"use client";

import { computeFinalBudget } from "@/lib/scoring";
import { getUnitLabel } from "@/lib/curriculum-units";
import type { Case, CaseMenuItem, Team, TeamPurchase } from "@/lib/types/database";

export function PrintReportClient({
  team,
  caseData,
  purchases,
}: {
  team: Team;
  caseData: Case;
  purchases: (TeamPurchase & { menu_item: CaseMenuItem })[];
}) {
  return (
    <div className="print-report">
      <style>{`
        .print-report { font-family: system-ui, sans-serif; max-width: 720px; margin: 2rem auto; padding: 0 1rem; color: #134e4a; line-height: 1.6; }
        .print-report h1 { font-size: 1.75rem; margin-bottom: 0.25rem; color: #0d9488; }
        .print-report h2 { font-size: 1.15rem; margin-top: 1.5rem; border-bottom: 2px solid #0d9488; padding-bottom: 0.25rem; color: #134e4a; }
        .print-report .meta { color: #64748b; font-size: 0.95rem; margin-bottom: 1.5rem; }
        .print-report ul { padding-left: 1.25rem; }
        .print-report .block { white-space: pre-wrap; margin: 0.5rem 0; }
        .print-report .no-print { margin-bottom: 1rem; }
        @media print { .print-report { margin: 0.5in; } .no-print { display: none; } }
      `}</style>

      <p className="no-print">
        <button
          type="button"
          className="rounded-md border border-teal-600 bg-teal-50 px-4 py-2 text-sm font-medium text-teal-800"
          onClick={() => window.print()}
        >
          Print / Save as PDF
        </button>
      </p>

      <h1>{team.team_name}</h1>
      <p className="meta">
        {caseData.title} · {getUnitLabel(caseData.primary_unit ?? "mixed")} · Final score: $
        {computeFinalBudget(team)}
      </p>

      <h2>Diagnosis</h2>
      <p className="block">{team.diagnosis ?? "—"}</p>
      {team.evidence?.length > 0 && (
        <>
          <h2>Evidence</h2>
          <ul>
            {team.evidence.map((e, i) => (
              <li key={i}>{e}</li>
            ))}
          </ul>
        </>
      )}

      <h2>Purchase journey</h2>
      <p className="block">{team.purchase_journey || "—"}</p>

      <h2>Most important orders</h2>
      <p className="block">{team.key_orders_reflection || "—"}</p>

      <h2>Connect the dots (pathophysiology)</h2>
      <p className="block">{team.pathophys_explanation || "—"}</p>

      <h2>Treatment plan</h2>
      <ul>
        {(team.treatment_plan?.length ? team.treatment_plan : ["—"]).map((item, i) => (
          <li key={i}>{item}</li>
        ))}
      </ul>

      <h2>Presentation notes</h2>
      <p className="block">{team.presentation_notes || "—"}</p>

      <h2>Orders purchased</h2>
      <ul>
        {purchases.map((p) => (
          <li key={p.id}>
            {p.menu_item.name} (${p.cost_paid})
          </li>
        ))}
      </ul>
    </div>
  );
}
