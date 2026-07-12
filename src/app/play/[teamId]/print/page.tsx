import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { fetchTeamReportByTeamId } from "@/lib/export/fetch-team-report";
import { PrintReportClient } from "@/components/reports/print-report";

export default async function StudentPrintReportPage({
  params,
}: {
  params: Promise<{ teamId: string }>;
}) {
  const { teamId } = await params;
  const supabase = await createClient();

  const report = await fetchTeamReportByTeamId(supabase, teamId);
  if (!report) notFound();

  return (
    <PrintReportClient
      team={report.team}
      caseData={report.caseData}
      purchases={report.purchases}
    />
  );
}
