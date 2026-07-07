import { CaseForm } from "@/components/teacher/case-form";

export default function NewCasePage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">New Case</h1>
        <p className="mt-1 text-muted-foreground">Create a new diagnosis case for your students</p>
      </div>
      <CaseForm />
    </div>
  );
}
