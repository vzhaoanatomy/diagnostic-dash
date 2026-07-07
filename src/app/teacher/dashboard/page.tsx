import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { sessionStatusLabel, sessionStatusColor } from "@/lib/utils";
import { Play, BookOpen } from "lucide-react";

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
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="mt-1 text-muted-foreground">
          Manage your cases and live game sessions
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Cases</CardDescription>
            <CardTitle className="text-3xl">{cases?.length ?? 0}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Active Sessions</CardDescription>
            <CardTitle className="text-3xl">{activeSessions.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Quick Actions</CardDescription>
          </CardHeader>
          <CardContent className="flex gap-2">
            <Button size="sm" asChild>
              <Link href="/teacher/cases/new">
                <BookOpen className="h-4 w-4" />
                New Case
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      {activeSessions.length > 0 && (
        <section>
          <h2 className="mb-4 text-xl font-semibold">Live Sessions</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {activeSessions.map((session) => {
              const caseInfo = session.case as { title: string; category: string };
              return (
                <Card key={session.id}>
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
                </Card>
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
              <Card key={c.id}>
                <CardHeader>
                  <CardTitle className="text-base">{c.title}</CardTitle>
                  <CardDescription>{c.category}</CardDescription>
                </CardHeader>
                <CardContent className="flex gap-2">
                  <Button size="sm" variant="outline" asChild>
                    <Link href={`/teacher/cases/${c.id}/edit`}>Edit</Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="py-8 text-center">
              <p className="text-muted-foreground">No cases yet.</p>
              <Button className="mt-4" asChild>
                <Link href="/teacher/cases/new">Create Your First Case</Link>
              </Button>
            </CardContent>
          </Card>
        )}
      </section>
    </div>
  );
}
