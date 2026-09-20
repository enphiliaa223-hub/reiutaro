import type { Metadata } from "next";
import { ProjectForm } from "@/components/admin/project-form";
import { requireAdmin } from "@/lib/auth/session";

export const metadata: Metadata = { title: "Proyek Baru — Admin" };

export default async function NewProjectPage() {
  await requireAdmin();
  return (
    <div className="space-y-6">
      <h1 className="font-display text-xl text-white">Proyek baru</h1>
      <ProjectForm />
    </div>
  );
}