import PptxGenJS from "pptxgenjs";
import type { TeamReportBundle } from "./fetch-team-report";
import { computeFinalBudget } from "@/lib/scoring";
import { getUnitLabel } from "@/lib/curriculum-units";

export type TeamReportData = TeamReportBundle;

const C = {
  teal: "0D9488",
  darkTeal: "134E4A",
  mint: "F0FDFA",
  slate: "475569",
  white: "FFFFFF",
  light: "E2E8F0",
};

const FONT = "Calibri";

function addHeaderBar(slide: PptxGenJS.Slide, title: string) {
  slide.addShape("rect" as PptxGenJS.SHAPE_NAME, {
    x: 0,
    y: 0,
    w: 10,
    h: 0.72,
    fill: { color: C.teal },
    line: { color: C.teal },
  });
  slide.addText(title, {
    x: 0.45,
    y: 0.14,
    w: 9.1,
    h: 0.5,
    fontSize: 22,
    bold: true,
    color: C.white,
    fontFace: FONT,
    margin: 0,
  });
}

function addBodyText(
  slide: PptxGenJS.Slide,
  text: string,
  y: number,
  opts?: { h?: number; fontSize?: number; bullet?: boolean }
) {
  slide.addText(text || "—", {
    x: 0.55,
    y,
    w: 8.9,
    h: opts?.h ?? 4.5,
    fontSize: opts?.fontSize ?? 18,
    color: C.darkTeal,
    fontFace: FONT,
    valign: "top",
    margin: 6,
    bullet: opts?.bullet ? { indent: 18 } : false,
    lineSpacingMultiple: 1.15,
  });
}

function addFooter(slide: PptxGenJS.Slide, label: string) {
  slide.addText(label, {
    x: 0.45,
    y: 5.15,
    w: 9.1,
    fontSize: 11,
    color: C.slate,
    fontFace: FONT,
  });
}

export async function buildTeamPresentationPptx(data: TeamReportData): Promise<Buffer> {
  const pptx = new PptxGenJS();
  pptx.author = "Diagnostic Dash";
  pptx.title = `${data.team.team_name} — Case Presentation`;
  pptx.layout = "LAYOUT_16x9";

  // Title slide
  const titleSlide = pptx.addSlide();
  titleSlide.background = { color: C.mint };
  titleSlide.addShape("rect" as PptxGenJS.SHAPE_NAME, {
    x: 0,
    y: 0,
    w: 10,
    h: 0.35,
    fill: { color: C.teal },
    line: { color: C.teal },
  });
  titleSlide.addShape("rect" as PptxGenJS.SHAPE_NAME, {
    x: 0.45,
    y: 1.05,
    w: 0.08,
    h: 2.4,
    fill: { color: C.teal },
    line: { color: C.teal },
  });
  titleSlide.addText(data.team.team_name, {
    x: 0.75,
    y: 1.1,
    w: 8.5,
    fontSize: 36,
    bold: true,
    color: C.darkTeal,
    fontFace: FONT,
  });
  titleSlide.addText(data.caseData.title, {
    x: 0.75,
    y: 2.05,
    w: 8.5,
    fontSize: 22,
    color: C.teal,
    fontFace: FONT,
  });
  titleSlide.addText(
    [
      getUnitLabel(data.caseData.primary_unit ?? "mixed"),
      `Final score: $${computeFinalBudget(data.team)}`,
      data.team.diagnosis_status === "correct" ? "Diagnosis: Correct" : "Case Presentation",
    ].join("  ·  "),
    {
      x: 0.75,
      y: 2.75,
      w: 8.5,
      fontSize: 16,
      color: C.slate,
      fontFace: FONT,
    }
  );
  titleSlide.addText("Diagnostic Dash", {
    x: 0.75,
    y: 4.85,
    w: 3,
    fontSize: 12,
    color: C.slate,
    fontFace: FONT,
  });

  // Diagnosis
  const dxSlide = pptx.addSlide();
  dxSlide.background = { color: C.white };
  addHeaderBar(dxSlide, "Diagnosis & Evidence");
  addBodyText(dxSlide, data.team.diagnosis ?? "—", 0.95, { h: 0.9, fontSize: 24 });
  if (data.team.evidence?.length) {
    dxSlide.addText("Supporting evidence", {
      x: 0.55,
      y: 2.05,
      w: 8,
      fontSize: 16,
      bold: true,
      color: C.teal,
      fontFace: FONT,
    });
    const evidenceText = data.team.evidence.map((e) => `• ${e}`).join("\n");
    addBodyText(dxSlide, evidenceText, 2.45, { h: 2.5, fontSize: 18 });
  }
  addFooter(dxSlide, data.team.team_name);

  // Purchase journey
  const journeySlide = pptx.addSlide();
  journeySlide.background = { color: C.white };
  addHeaderBar(journeySlide, "Purchase Journey");
  addBodyText(journeySlide, data.team.purchase_journey || "—", 0.95, { h: 4.2, fontSize: 18 });
  addFooter(journeySlide, "What we ordered and how our thinking changed");

  // Key orders
  const ordersSlide = pptx.addSlide();
  ordersSlide.background = { color: C.white };
  addHeaderBar(ordersSlide, "Most Important Orders");
  addBodyText(ordersSlide, data.team.key_orders_reflection || "—", 0.95, { h: 4.2, fontSize: 18 });
  addFooter(ordersSlide, "Clues that mattered most");

  // Pathophysiology
  const pathoSlide = pptx.addSlide();
  pathoSlide.background = { color: C.white };
  addHeaderBar(pathoSlide, "Connect the Dots — Pathophysiology");
  addBodyText(pathoSlide, data.team.pathophys_explanation || "—", 0.95, { h: 4.2, fontSize: 18 });
  addFooter(pathoSlide, "Why this diagnosis fits");

  // Treatment
  const txSlide = pptx.addSlide();
  txSlide.background = { color: C.white };
  addHeaderBar(txSlide, "Treatment Plan");
  const treatments = (data.team.treatment_plan?.filter(Boolean).length
    ? data.team.treatment_plan.filter(Boolean)
    : ["—"]
  ).map((t) => `• ${t}`);
  addBodyText(txSlide, treatments.join("\n"), 0.95, { h: 3.5, fontSize: 20, bullet: false });
  addFooter(txSlide, "Next steps for this patient");

  // Presentation notes
  if (data.team.presentation_notes?.trim()) {
    const notesSlide = pptx.addSlide();
    notesSlide.background = { color: C.white };
    addHeaderBar(notesSlide, "Presentation Notes");
    addBodyText(notesSlide, data.team.presentation_notes, 0.95, { h: 4.2, fontSize: 18 });
    addFooter(notesSlide, "Talking points for other teams");
  }

  // Orders purchased
  const purchasesSlide = pptx.addSlide();
  purchasesSlide.background = { color: C.white };
  addHeaderBar(purchasesSlide, "Orders Purchased");
  const orderLines = data.purchases.map((p) => `• ${p.menu_item.name}  ($${p.cost_paid})`);
  const chunks: string[][] = [];
  for (let i = 0; i < orderLines.length; i += 10) {
    chunks.push(orderLines.slice(i, i + 10));
  }
  chunks.forEach((chunk, index) => {
    const slide = index === 0 ? purchasesSlide : pptx.addSlide();
    if (index > 0) {
      slide.background = { color: C.white };
      addHeaderBar(slide, "Orders Purchased (continued)");
    }
    addBodyText(slide, chunk.join("\n"), index === 0 ? 0.95 : 0.95, {
      h: 4.2,
      fontSize: 17,
    });
    addFooter(slide, `Total clues ordered: ${data.purchases.length}`);
  });

  return (await pptx.write({ outputType: "nodebuffer" })) as Buffer;
}
