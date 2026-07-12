import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { fetchTeamReportByTeamId } from "@/lib/export/fetch-team-report";
import { buildTeamPresentationPptx } from "@/lib/export/presentation-pptx";

export async function GET(
  _request: Request,
  context: { params: Promise<{ teamId: string }> }
) {
  const { teamId } = await context.params;
  const supabase = await createClient();

  const report = await fetchTeamReportByTeamId(supabase, teamId);
  if (!report) {
    return NextResponse.json(
      { error: "Report not available — submit your diagnosis first." },
      { status: 404 }
    );
  }

  const buffer = await buildTeamPresentationPptx(report);
  const filename = `${report.team.team_name.replace(/\s+/g, "-")}-presentation.pptx`;

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.presentationml.presentation",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
