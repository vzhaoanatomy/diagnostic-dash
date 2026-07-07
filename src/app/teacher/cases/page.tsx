import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LaunchSessionButton } from "@/components/teacher/launch-session-button";
import { Plus } from "lucide-react";
import type { Case } from "@/lib/types/database";

type CaseWithCount = Case & { case_menu_items: { count: number }[] };

export default async function CaseLibraryPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: casesRaw } = await supabase
    .from("cases")
    .select("*, case_menu_items(count)")
    .eq("teacher_id", user!.id)
    .order("updated_at", { ascending: false });

  const cases = (casesRaw ?? []) as CaseWithCount[];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Case Library</h1>
          <p className="mt-1 text-muted-foreground">Create and manage diagnosis cases</p>
        </div>
        <Button asChild>
          <Link href="/teacher/cases/new">
            <Plus className="h-4 w-4" />
            New Case
          </Link>
        </Button>
      </div>

      {cases && cases.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {cases.map((c) => {
            const menuCount = c.case_menu_items?.[0]?.count ?? 0;
            return (
              <Card key={c.id}>
                <CardHeader>
                  <CardTitle className="text-lg">{c.title}</CardTitle>
                  <CardDescription>
                    {c.category} · {c.patient_age}yo {c.patient_sex} · {menuCount} menu items
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="mb-4 line-clamp-2 text-sm text-muted-foreground">
                    {c.chief_complaint}
                  </p>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" asChild>
                      <Link href={`/teacher/cases/${c.id}/edit`}>Edit</Link>
                    </Button>
                    <LaunchSessionButton caseId={c.id} />
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-lg text-muted-foreground">No cases yet. Create one to get started.</p>
            <Button className="mt-4" asChild>
              <Link href="/teacher/cases/new">Create Case</Link>
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
