import type { Metadata } from "next";
import Link from "next/link";
import { createPublicClient } from "@/lib/supabase/public";
import { Badge } from "@/components/ui/badge";

export const metadata: Metadata = { title: "Konten — Admin" };

interface ProjectAdminRow {
  id: string;
  title: string;
  slug: string;
  status: string;
  featured: boolean;
  created_at: string;
}

export default async function AdminProjectsPage() {
  let projects: ProjectAdminRow[] | null = null;
  try {
    const c = createPublicClient();
    const { data } = await c
      .from("projects")
      .select("id, title, slug, status, featured, created_at")
      .order("created_at", { ascending: false });
    projects = (data as ProjectAdminRow[] | null) ?? [];
  } catch {
    projects = null;
  }

  return (
    <div>
      <div className="flex items-center justify-between gap-3">
        <h1 className="font-display text-xl text-white">Konten — Proyek</h1>
        <Link
          href="/admin/projects/new"
          className="rounded-lg bg-gold-400 px-4 py-2 text-sm font-semibold text-ink-950 transition-colors hover:bg-gold-300"
        >
          + Proyek baru
        </Link>
      </div>

      {!projects || projects.length === 0 ? (
        <div className="mt-6 rounded-xl border border-dashed border-ink-700 bg-ink-900/40 p-10 text-center">
          <p className="text-sm text-ink-400">
            {projects === null ? "DB belum terhubung." : "Belum ada proyek."}
          </p>
        </div>
      ) : (
        <div className="mt-6 divide-y divide-ink-800 overflow-hidden rounded-xl border border-ink-800">
          {projects.map((project) => (
            <Link
              key={project.id}
              href={`/admin/projects/${project.id}/edit`}
              className="flex items-center justify-between gap-4 bg-ink-900/40 p-4 transition-colors hover:bg-ink-900"
            >
              <div className="min-w-0">
                <p className="truncate font-medium text-paper-50">{project.title}</p>
                <p className="truncate text-xs text-ink-400">/{project.slug}</p>
              </div>
              <div className="flex shrink-0 items-center gap-3">
                <Badge variant={project.status === "published" ? "success" : "ink"}>
                  {project.status}
                </Badge>
                {project.featured ? <Badge variant="gold">Featured</Badge> : null}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}