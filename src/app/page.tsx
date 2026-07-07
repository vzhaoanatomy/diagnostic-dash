import Link from "next/link";
import { Stethoscope, GraduationCap, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <header className="border-b bg-white/80 backdrop-blur-sm">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2">
            <Stethoscope className="h-7 w-7 text-primary" />
            <span className="text-xl font-bold text-foreground">Diagnostic Dash</span>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" asChild>
              <Link href="/join">Join Game</Link>
            </Button>
            <Button asChild>
              <Link href="/login">Teacher Login</Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-16">
        <div className="text-center">
          <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
            Diagnose. Collaborate. Learn.
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
            A team-based medical diagnosis game for the classroom. Students work together
            to solve clinical cases while managing a diagnostic budget.
          </p>
        </div>

        <div className="mt-16 grid gap-6 sm:grid-cols-3">
          <Card>
            <CardHeader>
              <GraduationCap className="mb-2 h-8 w-8 text-primary" />
              <CardTitle className="text-lg">For Teachers</CardTitle>
              <CardDescription>
                Create cases, launch live sessions, and review team diagnoses in real time.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild className="w-full">
                <Link href="/login">Go to Dashboard</Link>
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <Users className="mb-2 h-8 w-8 text-primary" />
              <CardTitle className="text-lg">For Students</CardTitle>
              <CardDescription>
                Join with a session code and team name. One device per team — no account needed.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" asChild className="w-full">
                <Link href="/join">Join a Game</Link>
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <Stethoscope className="mb-2 h-8 w-8 text-primary" />
              <CardTitle className="text-lg">How It Works</CardTitle>
              <CardDescription>
                Purchase diagnostic clues, build your case file, and submit your diagnosis
                with supporting evidence.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ol className="space-y-1 text-sm text-muted-foreground">
                <li>1. Read the case presentation</li>
                <li>2. Buy tests within budget</li>
                <li>3. Submit diagnosis + evidence</li>
              </ol>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
