"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Users, Stethoscope } from "lucide-react";
import { joinGame } from "@/lib/actions/game";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { MedicalShell, MedicalCard, MedicalIconBadge } from "@/components/layout/medical-shell";
import { cn } from "@/lib/utils";

export default function JoinPage() {
  const router = useRouter();
  const [joinCode, setJoinCode] = useState("");
  const [teamName, setTeamName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { teamId } = await joinGame(joinCode.trim(), teamName.trim());
      if (typeof window !== "undefined") {
        localStorage.setItem("teamId", teamId);
        localStorage.setItem("teamName", teamName.trim());
      }
      router.push(`/play/${teamId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to join");
    } finally {
      setLoading(false);
    }
  }

  return (
    <MedicalShell theme="student" className="flex items-center justify-center px-4 py-12">
      <MedicalCard accent="teal" className="w-full max-w-md">
        <CardHeader className="text-center">
          <MedicalIconBadge variant="teal" className="mx-auto mb-2">
            <Users className="h-6 w-6" />
          </MedicalIconBadge>
          <CardTitle>Join a Game</CardTitle>
          <CardDescription>
            Enter the session code from your teacher and choose a team name
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="code">Session Code</Label>
              <Input
                id="code"
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                placeholder="ABC123"
                className="text-center font-mono text-lg tracking-widest uppercase"
                maxLength={6}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="team">Team Name</Label>
              <Input
                id="team"
                value={teamName}
                onChange={(e) => setTeamName(e.target.value)}
                placeholder="Team Alpha"
                required
                maxLength={50}
              />
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}

            <Button type="submit" className={cn("medical-btn-student w-full")} disabled={loading}>
              {loading ? "Joining..." : "Join Game"}
            </Button>
          </form>

          <div className="mt-6 rounded-lg bg-muted p-3 text-center text-sm text-muted-foreground">
            <Stethoscope className="mx-auto mb-1 h-4 w-4" />
            One device per team. Work together with your teammates!
          </div>

          <div className="mt-4 text-center">
            <Link href="/" className="text-sm text-muted-foreground hover:underline">
              ← Back to home
            </Link>
          </div>
        </CardContent>
      </MedicalCard>
    </MedicalShell>
  );
}
