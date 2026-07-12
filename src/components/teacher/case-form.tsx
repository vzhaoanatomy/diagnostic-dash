"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2, GripVertical, ImageIcon } from "lucide-react";
import { createCase, updateCase, deleteCase } from "@/lib/actions/game";
import type { Case, CaseMenuItem } from "@/lib/types/database";
import type { CaseFormDraft } from "@/lib/types/case-draft";
import {
  MENU_ITEM_TYPES,
  type MenuItemType,
} from "@/lib/menu-item-types";
import {
  DIFFICULTY_OPTIONS,
  budgetForDifficulty,
  type CaseDifficulty,
} from "@/lib/difficulty-budget";
import { CURRICULUM_UNITS, type PrimaryUnit } from "@/lib/curriculum-units";
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
  item_type: MenuItemType;
  reference_range: string;
  interpretation: string;
  sort_order: number;
}

function emptyMenuItem(type: MenuItemType = "test"): MenuItemDraft {
  const preset = MENU_ITEM_TYPES[type];
  return {
    name: type === "test" ? "" : preset.label,
    cost: preset.defaultCost,
    description: type === "test" ? "" : preset.description,
    clue_content: "",
    clue_image_url: null,
    item_type: type,
    reference_range: "",
    interpretation: "",
    sort_order: 0,
  };
}

function caseToForm(caseData?: Case, menuItems?: CaseMenuItem[], initialDraft?: CaseFormDraft) {
  if (initialDraft) return initialDraft;

  return {
    title: caseData?.title ?? "",
    category: caseData?.category ?? "General",
    difficulty: caseData?.difficulty ?? "intermediate",
    primary_unit: caseData?.primary_unit ?? "mixed",
    patient_age: caseData?.patient_age ?? 30,
    patient_sex: caseData?.patient_sex ?? "Unknown",
    chief_complaint: caseData?.chief_complaint ?? "",
    case_intro: caseData?.case_intro ?? "",
    accepted_diagnoses: caseData?.accepted_diagnoses ?? [],
    alternate_accepted_answers: caseData?.alternate_accepted_answers ?? [],
    starting_budget: caseData?.starting_budget ?? budgetForDifficulty("intermediate"),
    teacher_notes: caseData?.teacher_notes ?? "",
    debrief_content: caseData?.debrief_content ?? "",
    menu_items: menuItems?.map((m) => ({
      name: m.name,
      cost: m.cost,
      description: m.description,
      clue_content: m.clue_content,
      clue_image_url: m.clue_image_url,
      item_type: m.item_type ?? "test",
      reference_range: m.reference_range ?? "",
      interpretation: m.interpretation ?? "",
      sort_order: m.sort_order,
    })) ?? [emptyMenuItem()],
  };
}

export function CaseForm({
  caseData,
  menuItems,
  initialDraft,
}: {
  caseData?: Case;
  menuItems?: CaseMenuItem[];
  initialDraft?: CaseFormDraft;
}) {
  const router = useRouter();
  const isEditing = !!caseData;
  const initial = caseToForm(caseData, menuItems, initialDraft);

  const [title, setTitle] = useState(initial.title);
  const [category, setCategory] = useState(initial.category);
  const [difficulty, setDifficulty] = useState<CaseDifficulty>(initial.difficulty);
  const [primaryUnit, setPrimaryUnit] = useState<PrimaryUnit>(initial.primary_unit);
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

  function handleDifficultyChange(value: CaseDifficulty) {
    setDifficulty(value);
    setStartingBudget(budgetForDifficulty(value));
  }

  function addMenuItem(type: MenuItemType = "test") {
    setMenuItemsState([
      ...menuItemsState,
      { ...emptyMenuItem(type), sort_order: menuItemsState.length },
    ]);
  }

  function removeMenuItem(index: number) {
    setMenuItemsState(menuItemsState.filter((_, i) => i !== index));
  }

  function updateMenuItem(index: number, field: keyof MenuItemDraft, value: string | number) {
    const updated = [...menuItemsState];
    const current = updated[index];
    const oldType = current.item_type;

    if (field === "clue_image_url") {
      updated[index] = { ...current, clue_image_url: String(value).trim() || null };
    } else if (field === "item_type") {
      const type = value as MenuItemType;
      const preset = MENU_ITEM_TYPES[type];
      const oldPreset = MENU_ITEM_TYPES[oldType];
      updated[index] = {
        ...current,
        item_type: type,
        name:
          !current.name.trim() || current.name === oldPreset.label
            ? type === "test"
              ? ""
              : preset.label
            : current.name,
        description:
          !current.description.trim() || current.description === oldPreset.description
            ? type === "test"
              ? ""
              : preset.description
            : current.description,
        cost: preset.defaultCost,
      };
    } else {
      updated[index] = { ...current, [field]: value };
    }

    setMenuItemsState(updated);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const formData = {
      title,
      category,
      difficulty,
      primary_unit: primaryUnit,
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
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="difficulty">Difficulty</Label>
                  <select
                    id="difficulty"
                    value={difficulty}
                    onChange={(e) => handleDifficultyChange(e.target.value as CaseDifficulty)}
                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs"
                  >
                    {DIFFICULTY_OPTIONS.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.label} (${d.budget})
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="primary-unit">Primary Unit</Label>
                  <select
                    id="primary-unit"
                    value={primaryUnit}
                    onChange={(e) => setPrimaryUnit(e.target.value as PrimaryUnit)}
                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs"
                  >
                    {CURRICULUM_UNITS.map((unit) => (
                      <option key={unit.id} value={unit.id}>
                        {unit.label}
                      </option>
                    ))}
                  </select>
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
                <Label htmlFor="intro">Brief Presentation (shown free to students)</Label>
                <Textarea
                  id="intro"
                  value={caseIntro}
                  onChange={(e) => setCaseIntro(e.target.value)}
                  rows={4}
                  placeholder="One short paragraph: who the patient is, setting, and chief complaint. Students order Symptom History, Medical Background, and Lifestyle Background separately."
                />
                <p className="text-xs text-muted-foreground">
                  Keep this brief. Put detailed history in the Patient Interview menu items.
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="notes">Teacher Notes (private)</Label>
                <Textarea id="notes" value={teacherNotes} onChange={(e) => setTeacherNotes(e.target.value)} rows={3} />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="menu" className="mt-4 space-y-4">
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="outline" size="sm" onClick={() => addMenuItem("symptom_history")}>
              + Symptom History
            </Button>
            <Button type="button" variant="outline" size="sm" onClick={() => addMenuItem("medical_background")}>
              + Medical Background
            </Button>
            <Button type="button" variant="outline" size="sm" onClick={() => addMenuItem("lifestyle_background")}>
              + Lifestyle Background
            </Button>
            <Button type="button" variant="outline" size="sm" onClick={() => addMenuItem("test")}>
              + Test / Exam
            </Button>
            <Button type="button" variant="outline" size="sm" onClick={() => addMenuItem("image")}>
              <ImageIcon className="mr-1 h-3 w-3" />
              + Image
            </Button>
          </div>

          {menuItemsState.map((item, index) => (
            <Card key={index}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <div className="flex items-center gap-2">
                  <GripVertical className="h-4 w-4 text-muted-foreground" />
                  <CardTitle className="text-base">
                    {item.name || `Item ${index + 1}`}
                    <span className="ml-2 text-xs font-normal text-muted-foreground">
                      ({MENU_ITEM_TYPES[item.item_type].group})
                    </span>
                  </CardTitle>
                </div>
                {menuItemsState.length > 1 && (
                  <Button type="button" variant="ghost" size="sm" onClick={() => removeMenuItem(index)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                )}
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid gap-3 sm:grid-cols-4">
                  <div className="space-y-1">
                    <Label>Type</Label>
                    <select
                      className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs"
                      value={item.item_type}
                      onChange={(e) => updateMenuItem(index, "item_type", e.target.value)}
                    >
                      {(Object.keys(MENU_ITEM_TYPES) as MenuItemType[]).map((type) => (
                        <option key={type} value={type}>
                          {MENU_ITEM_TYPES[type].label}
                        </option>
                      ))}
                    </select>
                  </div>
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
                  <Label>
                    {item.item_type === "image" ? "Image Caption / Findings (revealed after purchase)" : "Clue Content (revealed after purchase)"}
                  </Label>
                  <Textarea value={item.clue_content} onChange={(e) => updateMenuItem(index, "clue_content", e.target.value)} rows={4} />
                </div>
                {(item.item_type === "test" || item.item_type === "image") && (
                  <>
                    <div className="space-y-1">
                      <Label>Reference Range (general — shown as lab framework)</Label>
                      <Input
                        value={item.reference_range}
                        onChange={(e) => updateMenuItem(index, "reference_range", e.target.value)}
                        placeholder="e.g. 0.4–4.0 mIU/L"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label>How to Read This (general interpretation — no diagnosis spoilers)</Label>
                      <Textarea
                        value={item.interpretation}
                        onChange={(e) => updateMenuItem(index, "interpretation", e.target.value)}
                        rows={2}
                        placeholder="What does this test measure? How do high/low values generally relate to function?"
                      />
                    </div>
                  </>
                )}
                {(item.item_type === "image" || item.clue_image_url) && (
                  <div className="space-y-1">
                    <Label>Image URL (optional — paste a public image link)</Label>
                    <Input
                      value={item.clue_image_url ?? ""}
                      onChange={(e) => updateMenuItem(index, "clue_image_url", e.target.value || "")}
                      placeholder="https://..."
                    />
                    {item.clue_image_url && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={item.clue_image_url} alt="Preview" className="mt-2 max-h-32 rounded border" />
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
          <Button type="button" variant="outline" onClick={() => addMenuItem()}>
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
