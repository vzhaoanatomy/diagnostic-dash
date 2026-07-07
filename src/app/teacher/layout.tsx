import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { TeacherNav } from "@/components/teacher/teacher-nav";

export default async function TeacherLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  return (
    <div className="min-h-screen bg-background">
      <TeacherNav email={user.email ?? ""} />
      <main className="mx-auto max-w-6xl px-6 py-8">{children}</main>
    </div>
  );
}
