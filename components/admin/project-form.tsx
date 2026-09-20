"use client";

import { useActionState, useState } from "react";
import { useRouter } from "next/navigation";
import { saveProject, type ActionResult } from "@/lib/actions/admin";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button, buttonStyles } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { UploadField } from "@/components/admin/upload-field";

const initialState: ActionResult = { ok: false, error: "" };

const STATUS_LABELS: Record<string, string> = {
  draft: "Draft",
  published: "Terbit",
  archived: "Arsip",
};

export function ProjectForm({
  project,
}: {
  project?: {
    id: string;
    title: string;
    description: string | null;
    body: string | null;
    category: string | null;
    technology: string[];
    githubUrl: string | null;
    demoUrl: string | null;
    coverImage: string | null;
    featured: boolean;
    status: string;
    sortOrder: number;
    images: string[];
  };
}) {
  const router = useRouter();
  const [images, setImages] = useState<string[]>(project?.images ?? []);
  const [state, formAction, isPending] = useActionState(
    async (_prev: ActionResult, formData: FormData) => {
      const tech = String(formData.get("technology") ?? "")
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);
      const result = await saveProject({
        id: project?.id,
        title: String(formData.get("title") ?? ""),
        description: String(formData.get("description") ?? ""),
        body: String(formData.get("body") ?? ""),
        category: String(formData.get("category") ?? ""),
        technology: tech,
        githubUrl: String(formData.get("githubUrl") ?? ""),
        demoUrl: String(formData.get("demoUrl") ?? ""),
        coverImage: images[0] ?? null,
        featured: formData.get("featured") === "on",
        status: String(formData.get("status") ?? "draft"),
        sortOrder: Number(formData.get("sortOrder") ?? 0),
        images,
      });
      if (result.ok) {
        router.push("/admin/projects");
        router.refresh();
      }
      return result;
    },
    initialState,
  );

  return (
    <form action={formAction} className="space-y-5">
      {state.ok === false && state.error ? (
        <p className="text-sm text-red-400">{state.error}</p>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <label htmlFor="title" className="text-xs font-medium uppercase tracking-wider text-ink-400">
            Judul
          </label>
          <Input id="title" name="title" required defaultValue={project?.title} placeholder="Nama proyek" />
        </div>
        <div className="space-y-1.5">
          <label htmlFor="category" className="text-xs font-medium uppercase tracking-wider text-ink-400">
            Kategori
          </label>
          <Input id="category" name="category" defaultValue={project?.category ?? ""} placeholder="e.g. Web App" />
        </div>
      </div>

      <div className="space-y-1.5">
        <label htmlFor="description" className="text-xs font-medium uppercase tracking-wider text-ink-400">
          Ringkasan
        </label>
        <Textarea id="description" name="description" rows={2} defaultValue={project?.description ?? ""} placeholder="Ringkasan singkat (ditampilkan di kartu)" />
      </div>

      <div className="space-y-1.5">
        <label htmlFor="body" className="text-xs font-medium uppercase tracking-wider text-ink-400">
          Isi proyek (markdown-ish, pakai baris kosong antar paragraf)
        </label>
        <Textarea id="body" name="body" rows={6} defaultValue={project?.body ?? ""} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <label htmlFor="technology" className="text-xs font-medium uppercase tracking-wider text-ink-400">
            Teknologi (pisahkan dengan koma)
          </label>
          <Input id="technology" name="technology" defaultValue={(project?.technology ?? []).join(", ")} />
        </div>
        <div className="space-y-1.5">
          <label htmlFor="sortOrder" className="text-xs font-medium uppercase tracking-wider text-ink-400">
            Urutan
          </label>
          <Input id="sortOrder" name="sortOrder" type="number" defaultValue={project?.sortOrder ?? 0} />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <label htmlFor="githubUrl" className="text-xs font-medium uppercase tracking-wider text-ink-400">
            GitHub
          </label>
          <Input id="githubUrl" name="githubUrl" defaultValue={project?.githubUrl ?? ""} placeholder="https://github.com/…" />
        </div>
        <div className="space-y-1.5">
          <label htmlFor="demoUrl" className="text-xs font-medium uppercase tracking-wider text-ink-400">
            Demo
          </label>
          <Input id="demoUrl" name="demoUrl" defaultValue={project?.demoUrl ?? ""} placeholder="https://…" />
        </div>
      </div>

      <div className="space-y-1.5">
        <label htmlFor="status" className="text-xs font-medium uppercase tracking-wider text-ink-400">
          Status
        </label>
        <select id="status" name="status" defaultValue={project?.status ?? "draft"} className="w-full sm:w-64 rounded-lg border border-ink-700 bg-ink-900/80 px-3 py-2 text-sm text-paper-50">
          {Object.entries(STATUS_LABELS).map(([value, label]) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>
      </div>

      <label className="flex items-center gap-2 text-sm text-ink-300">
        <input type="checkbox" name="featured" defaultChecked={project?.featured} className="accent-gold-400" />
        Tampilkan di beranda (featured)
      </label>

      <UploadField bucket="projects" label="Gambar proyek (pertama = cover)" multiple value={images} onChange={setImages} />

      <div className="flex justify-end gap-3">
        <a href="/admin/projects" className={buttonStyles({ variant: "ghost", size: "md" })}>
          Batal
        </a>
        <Button type="submit" disabled={isPending}>
          {isPending ? <Spinner className="h-4 w-4" /> : project ? "Simpan proyek" : "Buat proyek"}
        </Button>
      </div>
    </form>
  );
}