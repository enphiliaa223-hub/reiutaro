"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createPost } from "@/lib/actions/community";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Spinner } from "@/components/ui/spinner";
import type { CategoryRow } from "@/lib/queries/community";

export function PostComposer({ categories }: { categories: CategoryRow[] }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);
    setPending(true);
    setError(null);
    const result = await createPost({
      title: String(formData.get("title") ?? ""),
      content: String(formData.get("content") ?? ""),
      categoryId: String(formData.get("categoryId") ?? ""),
    });
    setPending(false);
    if (result.ok && result.id) {
      router.push(`/community/post/${result.id}`);
      router.refresh();
    } else {
      setError((result as { error: string }).error ?? "Gagal membuat post.");
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {error ? (
        <p className="rounded-lg bg-red-950/40 px-3 py-2 text-sm text-red-300">{error}</p>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-[1fr_auto]">
        <Input name="title" placeholder="Judul (opsional)" maxLength={150} />
        <select
          name="categoryId"
          defaultValue=""
          className="h-11 rounded-lg border border-ink-700 bg-ink-900 px-3 text-sm text-paper-100 outline-none focus-visible:ring-2 focus-visible:ring-gold-400"
        >
          <option value="">Kategori</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>
      </div>

      <Textarea
        name="content"
        required
        rows={6}
        maxLength={12000}
        placeholder="Tulis kontenmu di sini... Hanya teks (markdown belum didukung)."
      />

      <div className="flex justify-end">
        <Button type="submit" disabled={pending}>
          {pending ? <Spinner className="h-4 w-4" /> : "Publikasikan"}
        </Button>
      </div>
    </form>
  );
}