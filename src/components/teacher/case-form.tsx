"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2, GripVertical } from "lucide-react";
import { createCase, updateCase, deleteCase } from "@/lib/actions/game";
import type { Case, CaseMenuItem } from "@/lib/types/database";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";

interface MenuItemDraft {
  name: string;
  cost: number;
  description: string;
  clue_content: string;
  clue_image_url: string | null;
  sort_order: number;
}

const emptyMenuItem = (): MenuItemDraft => ({
  name: "",
  cost: 50,
  description: "",
  clue_content: "",
  clue_image_url: null,
  sort_order: 0,
});

function caseToForm(caseData?: Case, menuItems?: CaseMenuItem[]) {
  return {
    title: caseData?.title ?? "",
    category: caseData?.category ?? "General",
    patient_age: caseData?.patient_age ?? 30,
    patient_sex: caseData?.patient_sex ?? "Unknown",
    chief_complaint: caseData?.chief_complaint ?? "",
    case_intro: caseData?.case_intro ?? "",
    accepted_diagnoses: caseData?.accepted_diagnoses ?? [],
    alternate_accepted_answers: caseData?.alternate_accepted_answers ?? [],
    starting_budget: caseData?.starting_budget ?? 1000,
    teacher_notes: caseData?.teacher_notes ?? "",
    debrief_content: caseData?.debrief_content ?? "",
    menu_items: menuItems?.map((m) => ({
      name: m.name,
      cost: m.cost,
      description: m.description,
      clue_content: m.clue_content,
      clue_image_url: m.clue_image_url,
      sort_order: m.sort_order,
    })) ?? [emptyMenuItem()],
  };
}

export function CaseForm({
  caseData,
  menuItems,
}: {
  caseData?: Case;
  menuItems?: CaseMenuItem[];
}) {
  const router = useRouter();
  const isEditing = !!caseData;
  const initial = caseToForm(caseData, menuItems);

  const [title, setTitle] = useState(initial.title);
  const [category, setCategory] = useState(initial.category);
  const [patientAge, setPatientAge] = useState(initial.patient_age);
  const [patientSex, setPatientSex] = useState(initial.patient_sex);
  const [chiefComplaint, setChiefComplaint] = useState(initial.chief_complaint);
  const [caseIntro, setCaseIntro] = useState(initial.case_intro);
  const [acceptedDiagnoses, setAcceptedDiagnoses] = useState(
    initial.accepted_diagnoses.join(", ")
  );
  const [alternateAnswers, setAlternateAnswers] = useState(
    initial.alternate_accepted_answers.join(", ")
  );
  const [startingBudget, setStartingBudget] = useState(initial.starting_budget);
  const [teacherNotes, setTeacherNotes] = useState(initial.teacher_notes);
  const [debriefContent, setDebriefContent] = useState(initial.debrief_content);
  const [menuItemsState, setMenuItemsState] = useState<MenuItemDraft[]>(initial.menu_items);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function addMenuItem() {
    setMenuItemsState([...menuItemsState, { ...emptyMenuItem(), sort_order: menuItemsState.length }]);
  }

  function removeMenuItem(index: number) {
    setMenuItemsState(menuItemsState.filter((_, i) => i !== index));
  }

  function updateMenuItem(index: number, field: keyof MenuItemDraft, value: string | number) {
    const updated = [...menuItemsState];
    updated[index] = { ...updated[index], [field]: value };
    setMenuItemsState(updated);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const formData = {
      title,
      category,
      patient_age: patientAge,
      patient_sex: patientSex,
      chief_complaint: chiefComplaint,
      case_intro: caseIntro,
      accepted_diagnoses: acceptedDiagnoses.split(",").map((s) => s.trim()).filter(Boolean),
      alternate_accepted_answers: alternateAnswers.split(",").map((s) => s.trim()).filter(Boolean),
      starting_budget: startingBudget,
      teacher_notes: teacherNotes,
      debrief_content: debriefContent,
      menu_items: menuItemsState.map((item, i) => ({ ...item, sort_order: i })),
    };

    try {
      if (isEditing) {
        await updateCase(caseData!.id, formData);
      } else {
        await createCase(formData);
      }
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete() {
    if (!caseData || !confirm("Delete this case? This cannot be undone.")) return;
    setLoading(true);
    try {
      await deleteCase(caseData.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Delete failed");
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Tabs defaultValue="case">
        <TabsList>
          <TabsTrigger value="case">Case Info</TabsTrigger>
          <TabsTrigger value="menu">Menu Items ({menuItemsState.length})</TabsTrigger>
          <TabsTrigger value="answers">Answers & Debrief</TabsTrigger>
        </TabsList>

        <TabsContent value="case" className="mt-4 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Case Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="title">Title</Label>
                  <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <Input id="category" value={category} onChange={(e) => setCategory(e.target.value)} />
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="age">Patient Age</Label>
                  <Input id="age" type="number" value={patientAge} onChange={(e) => setPatientAge(Number(e.target.value))} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sex">Patient Sex</Label>
                  <Input id="sex" value={patientSex} onChange={(e) => setPatientSex(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="budget">Starting Budget ($)</Label>
                  <Input id="budget" type="number" value={startingBudget} onChange={(e) => setStartingBudget(Number(e.target.value))} />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="complaint">Chief Complaint</Label>
                <Input id="complaint" value={chiefComplaint} onChange={(e) => setChiefComplaint(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="intro">Case Introduction (shown to students)</Label>
                <Textarea id="intro" value={caseIntro} onChange={(e) => setCaseIntro(e.target.value)} rows={6} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="notes">Teacher Notes (private)</Label>
                <Textarea id="notes" value={teacherNotes} onChange={(e) => setTeacherNotes(e.target.value)} rows={3} />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="menu" className="mt-4 space-y-4">
          {menuItemsState.map((item, index) => (
            <Card key={index}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <div className="flex items-center gap-2">
                  <GripVertical className="h-4 w-4 text-muted-foreground" />
                  <CardTitle className="text-base">Item {index + 1}</CardTitle>
                </div>
                {menuItemsState.length > 1 && (
                  <Button type="button" variant="ghost" size="sm" onClick={() => removeMenuItem(index)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                )}
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid gap-3 sm:grid-cols-3">
                  <div className="space-y-1">
                    <Label>Name</Label>
                    <Input value={item.name} onChange={(e) => updateMenuItem(index, "name", e.target.value)} placeholder="TSH" />
                  </div>
                  <div className="space-y-1">
                    <Label>Cost ($)</Label>
                    <Input type="number" value={item.cost} onChange={(e) => updateMenuItem(index, "cost", Number(e.target.value))} />
                  </div>
                  <div className="space-y-1">
                    <Label>Description (shown to students)</Label>
                    <Input value={item.description} onChange={(e) => updateMenuItem(index, "description", e.target.value)} />
                  </div>
                </div>
                <div className="space-y-1">
                  <Label>Clue Content (revealed after purchase)</Label>
                  <Textarea value={item.clue_content} onChange={(e) => updateMenuItem(index, "clue_content", e.target.value)} rows={4} />
                </div>
              </CardContent>
            </Card>
          ))}
          <Button type="button" variant="outline" onClick={addMenuItem}>
            <Plus className="h-4 w-4" />
            Add Menu Item
          </Button>
        </TabsContent>

        <TabsContent value="answers" className="mt-4 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Accepted Answers</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="diagnoses">Accepted Diagnoses (comma-separated)</Label>
                <Input id="diagnoses" value={acceptedDiagnoses} onChange={(e) => setAcceptedDiagnoses(e.target.value)} placeholder="hypothyroidism, primary hypothyroidism" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="alternates">Alternate Accepted Answers (comma-separated)</Label>
                <Input id="alternates" value={alternateAnswers} onChange={(e) => setAlternateAnswers(e.target.value)} placeholder="underactive thyroid, myxedema" />
              </div>
              <Separator />
              <div className="space-y-2">
                <Label htmlFor="debrief">Debrief Content (shown after session ends)</Label>
                <Textarea id="debrief" value={debriefContent} onChange={(e) => setDebriefContent(e.target.value)} rows={8} />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="flex items-center justify-between">
        <div>
          {isEditing && (
            <Button type="button" variant="destructive" onClick={handleDelete} disabled={loading}>
              Delete Case
            </Button>
          )}
        </div>
        <Button type="submit" disabled={loading}>
          {loading ? "Saving..." : isEditing ? "Save Changes" : "Create Case"}
        </Button>
      </div>
    </form>
  );
}
