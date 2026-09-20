import type { Metadata } from "next";
import { ProjectForm } from "@/components/admin/project-form";

export const metadata: Metadata = { title: "Proyek Baru — Admin" };

export default function NewProjectPage() {
  return (
    <div className="space-y-6">
      <h1 className="font-display text-xl text-white">Proyek baru</h1>
      <ProjectForm />
    </div>
  );
}