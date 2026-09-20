"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createComment } from "@/lib/actions/community";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Spinner } from "@/components/ui/spinner";

export function CommentForm({ postId, parentId }: { postId: string; parentId?: string }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    setPending(true);
    setError(null);
    const result = await createComment({
      postId,
      parentId,
      content: String(new FormData(form).get("content") ?? ""),
    });
    setPending(false);
    if (result.ok) {
      form.reset();
      router.refresh();
    } else {
      setError((result as { error: string }).error ?? "Gagal menambahkan komentar.");
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      {error ? (
        <p className="rounded-lg bg-red-950/40 px-3 py-2 text-sm text-red-300">{error}</p>
      ) : null}
      <div className="flex gap-3">
        <Textarea
          name="content"
          required
          rows={3}
          maxLength={4000}
          placeholder={parentId ? "Balas komentar..." : "Tulis komentar..."}
          className="flex-1"
        />
        <Button type="submit" disabled={pending} className="self-start">
          {pending ? <Spinner className="h-4 w-4" /> : "Kirim"}
        </Button>
      </div>
    </form>
  );
}