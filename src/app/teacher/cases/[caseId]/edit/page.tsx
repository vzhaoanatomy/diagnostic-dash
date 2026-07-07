import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { CaseForm } from "@/components/teacher/case-form";
import { LaunchSessionButton } from "@/components/teacher/launch-session-button";

export default async function EditCasePage({
  params,
}: {
  params: Promise<{ caseId: string }>;
}) {
  const { caseId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: caseData } = await supabase
    .from("cases")
    .select("*")
    .eq("id", caseId)
    .eq("teacher_id", user!.id)
    .single();

  if (!caseData) notFound();

  const { data: menuItems } = await supabase
    .from("case_menu_items")
    .select("*")
    .eq("case_id", caseId)
    .order("sort_order");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Edit Case</h1>
          <p className="mt-1 text-muted-foreground">{caseData.title}</p>
        </div>
        <LaunchSessionButton caseId={caseId} />
      </div>
      <CaseForm caseData={caseData} menuItems={menuItems ?? []} />
    </div>
  );
}
