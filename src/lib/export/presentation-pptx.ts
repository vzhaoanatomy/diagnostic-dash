import PptxGenJS from "pptxgenjs";
import type { Case, Team, TeamPurchase, CaseMenuItem } from "@/lib/types/database";
import { computeFinalBudget } from "@/lib/scoring";
import { getUnitLabel } from "@/lib/curriculum-units";

export interface TeamReportData {
  team: Team;
  caseData: Case;
  purchases: (TeamPurchase & { menu_item: CaseMenuItem })[];
}

export async function buildTeamPresentationPptx(data: TeamReportData): Promise<Buffer> {
  const pptx = new PptxGenJS();
  pptx.author = "Diagnostic Dash";
  pptx.title = `${data.team.team_name} — Case Presentation`;

  const slide1 = pptx.addSlide();
  slide1.addText(data.team.team_name, { x: 0.5, y: 0.4, w: 9, fontSize: 28, bold: true });
  slide1.addText(data.caseData.title, { x: 0.5, y: 1.2, w: 9, fontSize: 18 });
  slide1.addText(
    `${getUnitLabel(data.caseData.primary_unit ?? "mixed")} · Final score: $${computeFinalBudget(data.team)}`,
    { x: 0.5, y: 1.8, w: 9, fontSize: 14, color: "666666" }
  );

  const slide2 = pptx.addSlide();
  slide2.addText("Diagnosis", { x: 0.5, y: 0.4, fontSize: 22, bold: true });
  slide2.addText(data.team.diagnosis ?? "—", { x: 0.5, y: 1, w: 9, fontSize: 16 });
  if (data.team.evidence?.length) {
    slide2.addText("Evidence:", { x: 0.5, y: 1.8, fontSize: 14, bold: true });
    data.team.evidence.forEach((e, i) => {
      slide2.addText(`• ${e}`, { x: 0.7, y: 2.2 + i * 0.4, w: 8.5, fontSize: 12 });
    });
  }

  const slide3 = pptx.addSlide();
  slide3.addText("Purchase Journey", { x: 0.5, y: 0.4, fontSize: 22, bold: true });
  slide3.addText(data.team.purchase_journey || "—", {
    x: 0.5,
    y: 1,
    w: 9,
    h: 4,
    fontSize: 12,
    valign: "top",
  });

  const slide4 = pptx.addSlide();
  slide4.addText("Key Orders & Pathophysiology", { x: 0.5, y: 0.4, fontSize: 22, bold: true });
  slide4.addText("Most important orders:", { x: 0.5, y: 1, fontSize: 14, bold: true });
  slide4.addText(data.team.key_orders_reflection || "—", {
    x: 0.5,
    y: 1.4,
    w: 9,
    h: 1.5,
    fontSize: 12,
  });
  slide4.addText("Connect the dots:", { x: 0.5, y: 3, fontSize: 14, bold: true });
  slide4.addText(data.team.pathophys_explanation || "—", {
    x: 0.5,
    y: 3.4,
    w: 9,
    h: 1.8,
    fontSize: 12,
  });

  const slide5 = pptx.addSlide();
  slide5.addText("Treatment Plan", { x: 0.5, y: 0.4, fontSize: 22, bold: true });
  const treatments = data.team.treatment_plan?.length
    ? data.team.treatment_plan
    : ["—"];
  treatments.forEach((t, i) => {
    slide5.addText(`• ${t}`, { x: 0.7, y: 1 + i * 0.45, w: 8.5, fontSize: 14 });
  });

  const slide6 = pptx.addSlide();
  slide6.addText("Orders Purchased", { x: 0.5, y: 0.4, fontSize: 22, bold: true });
  data.purchases.forEach((p, i) => {
    if (i < 12) {
      slide6.addText(`• ${p.menu_item.name} ($${p.cost_paid})`, {
        x: 0.7,
        y: 1 + i * 0.35,
        w: 8.5,
        fontSize: 11,
      });
    }
  });

  return (await pptx.write({ outputType: "nodebuffer" })) as Buffer;
}
