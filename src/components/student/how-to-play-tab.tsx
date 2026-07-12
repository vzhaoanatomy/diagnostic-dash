"use client";

import { BookOpen } from "lucide-react";
import { getStudentInstructions } from "@/lib/student-instructions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function HowToPlayTab({
  strictMode,
  onStartCase,
}: {
  strictMode: boolean;
  onStartCase: () => void;
}) {
  const { title, body } = getStudentInstructions(strictMode);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BookOpen className="h-5 w-5 text-medical-teal" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {body.map((paragraph, index) => (
          <p key={index} className="text-sm leading-relaxed text-muted-foreground">
            {renderParagraph(paragraph)}
          </p>
        ))}
        <Button className="medical-btn-student" onClick={onStartCase}>
          Got it — start case
        </Button>
      </CardContent>
    </Card>
  );
}

function renderParagraph(text: string) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong key={i} className="font-semibold text-foreground">
          {part.slice(2, -2)}
        </strong>
      );
    }
    return part;
  });
}
