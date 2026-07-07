"use client";

import { useState } from "react";
import { Sparkles, Loader2 } from "lucide-react";
import { generateCaseWithAI } from "@/lib/actions/generate-case";
import type { CaseFormDraft } from "@/lib/types/case-draft";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function CaseGenerator({
  onGenerated,
}: {
  onGenerated: (draft: CaseFormDraft) => void;
}) {
  const [topic, setTopic] = useState("");
  const [suggestedTests, setSuggestedTests] = useState("");
  const [difficulty, setDifficulty] = useState<"introductory" | "intermediate" | "advanced">(
    "intermediate"
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleGenerate(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const result = await generateCaseWithAI({
        topic,
        suggestedTests: suggestedTests || undefined,
        difficulty,
      });

      if (!result.success) {
        setError(result.error);
        return;
      }

      onGenerated(result.draft);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Generation failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="border-primary/20 bg-primary/5">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Sparkles className="h-5 w-5 text-primary" />
          Generate with AI
        </CardTitle>
        <CardDescription>
          Enter a topic and optional tests to order. AI fills in the case — review and edit before
          saving. Powered by Google Gemini — review and edit before saving.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleGenerate} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="topic">Topic / Diagnosis area</Label>
            <Input
              id="topic"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="e.g. acute appendicitis in a teenager"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="tests">Tests to include (optional)</Label>
            <Textarea
              id="tests"
              value={suggestedTests}
              onChange={(e) => setSuggestedTests(e.target.value)}
              placeholder="e.g. CBC, CMP, CT abdomen, urinalysis, pregnancy test"
              rows={2}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="difficulty">Difficulty</Label>
            <select
              id="difficulty"
              value={difficulty}
              onChange={(e) =>
                setDifficulty(e.target.value as "introductory" | "intermediate" | "advanced")
              }
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="introductory">Introductory</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
            </select>
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <Button type="submit" disabled={loading || !topic.trim()}>
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Generating case…
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                Generate Case Draft
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
