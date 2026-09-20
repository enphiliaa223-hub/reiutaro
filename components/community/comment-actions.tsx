"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { deleteComment } from "@/lib/actions/community";
import { Spinner } from "@/components/ui/spinner";

export function CommentActions({
  commentId,
  canDelete,
}: {
  commentId: string;
  canDelete: boolean;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function remove() {
    if (!window.confirm("Hapus komentar ini?")) return;
    setPending(true);
    const result = await deleteComment(commentId);
    if (result.ok) {
      router.refresh();
    } else {
      setPending(false);
      alert((result as { error: string }).error ?? "Gagal menghapus komentar.");
    }
  }

  return canDelete ? (
    <button
      type="button"
      onClick={remove}
      disabled={pending}
      className="text-xs text-danger transition-opacity hover:opacity-80"
    >
      {pending ? <Spinner className="h-3 w-3" /> : "Hapus"}
    </button>
  ) : null;
}