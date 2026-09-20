import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getAdminProject } from "@/lib/queries/admin";
import { ProjectForm } from "@/components/admin/project-form";
import { ConfirmDelete } from "@/components/admin/confirm-delete";
import { deleteProject } from "@/lib/actions/admin";

export const metadata: Metadata = { title: "Edit Proyek — Admin" };

export default async function EditProjectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const project = await getAdminProject(id);
  if (!project) notFound();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <h1 className="font-display text-xl text-white">Edit proyek</h1>
        <ConfirmDelete
          label="Arsipkan proyek"
          confirmLabel="Yakin mengarsipkan proyek ini?"
          action={deleteProject.bind(null, project.id)}
        />
      </div>
      <ProjectForm project={project} />
    </div>
  );
}