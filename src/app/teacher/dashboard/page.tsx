import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { sessionStatusLabel, sessionStatusColor } from "@/lib/utils";
import { Play, BookOpen, Activity } from "lucide-react";
import { MedicalPageHeader, MedicalCard } from "@/components/layout/medical-shell";

export default async function TeacherDashboard() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: cases } = await supabase
    .from("cases")
    .select("id, title, category")
    .eq("teacher_id", user!.id)
    .order("updated_at", { ascending: false });

  const { data: sessions } = await supabase
    .from("game_sessions")
    .select("*, case:cases(title, category)")
    .eq("teacher_id", user!.id)
    .order("created_at", { ascending: false })
    .limit(10);

  const activeSessions = sessions?.filter((s) => s.status !== "ended") ?? [];

  return (
    <div className="space-y-8">
      <MedicalPageHeader
        badge="Teacher workspace"
        title="Dashboard"
        description="Manage your cases and live game sessions"
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="medical-stat-card">
          <p className="text-sm text-muted-foreground">Total Cases</p>
          <p className="mt-1 text-3xl font-bold text-primary">{cases?.length ?? 0}</p>
        </div>
        <div className="medical-stat-card">
          <p className="text-sm text-muted-foreground">Active Sessions</p>
          <p className="mt-1 text-3xl font-bold text-primary">{activeSessions.length}</p>
        </div>
        <div className="medical-stat-card flex flex-col justify-between">
          <p className="text-sm text-muted-foreground">Quick Actions</p>
          <Button size="sm" className="mt-3 w-fit" asChild>
            <Link href="/teacher/cases/new">
              <BookOpen className="h-4 w-4" />
              New Case
            </Link>
          </Button>
        </div>
      </div>

      {activeSessions.length > 0 && (
        <section>
          <h2 className="mb-4 flex items-center gap-2 text-xl font-semibold">
            <Activity className="h-5 w-5 text-primary" />
            Live Sessions
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {activeSessions.map((session) => {
              const caseInfo = session.case as { title: string; category: string };
              return (
                <MedicalCard key={session.id} accent="blue">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg">{caseInfo.title}</CardTitle>
                        <CardDescription>{caseInfo.category}</CardDescription>
                      </div>
                      <Badge className={sessionStatusColor(session.status)}>
                        {sessionStatusLabel(session.status)}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Join Code</p>
                      <p className="font-mono text-2xl font-bold tracking-widest">
                        {session.join_code}
                      </p>
                    </div>
                    <Button asChild>
                      <Link href={`/teacher/sessions/${session.id}`}>
                        <Play className="h-4 w-4" />
                        Manage
                      </Link>
                    </Button>
                  </CardContent>
                </MedicalCard>
              );
            })}
          </div>
        </section>
      )}

      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold">Your Cases</h2>
          <Button variant="outline" size="sm" asChild>
            <Link href="/teacher/cases">View All</Link>
          </Button>
        </div>
        {cases && cases.length > 0 ? (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {cases.slice(0, 6).map((c) => (
              <MedicalCard key={c.id} accent="blue">
                <CardHeader>
                  <CardTitle className="text-base">{c.title}</CardTitle>
                  <CardDescription>{c.category}</CardDescription>
                </CardHeader>
                <CardContent className="flex gap-2">
                  <Button size="sm" variant="outline" asChild>
                    <Link href={`/teacher/cases/${c.id}/edit`}>Edit</Link>
                  </Button>
                </CardContent>
              </MedicalCard>
            ))}
          </div>
        ) : (
          <MedicalCard accent="blue">
            <CardContent className="py-8 text-center">
              <p className="text-muted-foreground">No cases yet.</p>
              <Button className="mt-4" asChild>
                <Link href="/teacher/cases/new">Create Your First Case</Link>
              </Button>
            </CardContent>
          </MedicalCard>
        )}
      </section>
    </div>
  );
}
