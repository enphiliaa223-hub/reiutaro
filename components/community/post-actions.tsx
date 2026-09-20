"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { deletePost } from "@/lib/actions/community";
import { ReportButton } from "@/components/community/report-dialog";
import { Spinner } from "@/components/ui/spinner";

export function PostActions({
  postId,
  canDelete,
  reportTarget,
}: {
  postId: string;
  canDelete: boolean;
  reportTarget: { type: "post"; id: string };
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function remove() {
    if (!window.confirm("Hapus post ini?")) return;
    setPending(true);
    const result = await deletePost(postId);
    if (result.ok) {
      router.push("/community");
      router.refresh();
    } else {
      setPending(false);
      alert((result as { error: string }).error ?? "Gagal menghapus post.");
    }
  }

  return (
    <div className="flex items-center gap-4">
      {canDelete ? (
        <button
          type="button"
          onClick={remove}
          disabled={pending}
          className="flex items-center gap-1.5 text-sm text-danger transition-opacity hover:opacity-80"
        >
          {pending ? <Spinner className="h-4 w-4" /> : "Hapus"}
        </button>
      ) : null}
      <ReportButton targetType={reportTarget.type} targetId={reportTarget.id} />
    </div>
  );
}