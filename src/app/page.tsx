import Link from "next/link";
import { Stethoscope, GraduationCap, Users, Activity, HeartPulse } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  MedicalShell,
  MedicalCard,
  MedicalIconBadge,
} from "@/components/layout/medical-shell";

export default function HomePage() {
  return (
    <MedicalShell theme="landing">
      <header className="medical-nav">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2">
            <MedicalIconBadge variant="blue">
              <Stethoscope className="h-6 w-6" />
            </MedicalIconBadge>
            <span className="medical-nav-brand text-xl">Diagnostic Dash</span>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" asChild className="border-primary/20 bg-white/70">
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
          <span className="medical-badge mb-4 inline-flex items-center gap-1.5">
            <HeartPulse className="h-3.5 w-3.5" />
            Clinical reasoning game
          </span>
          <h1 className="medical-hero-title text-4xl font-bold tracking-tight sm:text-5xl">
            Diagnose. Collaborate. Learn.
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
            A team-based medical diagnosis game for the classroom. Students work together
            to solve clinical cases while managing a diagnostic budget.
          </p>
        </div>

        <div className="mt-16 grid gap-6 sm:grid-cols-3">
          <MedicalCard accent="blue">
            <CardHeader>
              <MedicalIconBadge variant="blue">
                <GraduationCap className="h-6 w-6" />
              </MedicalIconBadge>
              <CardTitle className="mt-4 text-lg">For Teachers</CardTitle>
              <CardDescription>
                Create cases, launch live sessions, and review team diagnoses in real time.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild className="w-full">
                <Link href="/login">Go to Dashboard</Link>
              </Button>
            </CardContent>
          </MedicalCard>

          <MedicalCard accent="teal">
            <CardHeader>
              <MedicalIconBadge variant="teal">
                <Users className="h-6 w-6" />
              </MedicalIconBadge>
              <CardTitle className="mt-4 text-lg">For Students</CardTitle>
              <CardDescription>
                Join with a session code and team name. One device per team — no account needed.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" asChild className="w-full border-medical-teal/30 bg-white/60 hover:bg-medical-mint/10">
                <Link href="/join">Join a Game</Link>
              </Button>
            </CardContent>
          </MedicalCard>

          <MedicalCard accent="rose">
            <CardHeader>
              <MedicalIconBadge variant="rose">
                <Activity className="h-6 w-6" />
              </MedicalIconBadge>
              <CardTitle className="mt-4 text-lg">How It Works</CardTitle>
              <CardDescription>
                Purchase diagnostic clues, build your case file, and submit your diagnosis
                with supporting evidence.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ol className="space-y-2 text-sm text-muted-foreground">
                <li className="flex gap-2">
                  <span className="font-semibold text-primary">1.</span> Read the case presentation
                </li>
                <li className="flex gap-2">
                  <span className="font-semibold text-primary">2.</span> Buy tests within budget
                </li>
                <li className="flex gap-2">
                  <span className="font-semibold text-primary">3.</span> Submit diagnosis + evidence
                </li>
              </ol>
            </CardContent>
          </MedicalCard>
        </div>
      </main>
    </MedicalShell>
  );
}
