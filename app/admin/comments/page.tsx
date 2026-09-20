import type { Metadata } from "next";
import { getAdminComments } from "@/lib/queries/admin";
import { ConfirmDelete } from "@/components/admin/confirm-delete";
import { deleteComment } from "@/lib/actions/admin";
import { requireAdmin } from "@/lib/auth/session";

export const metadata: Metadata = { title: "Komentar — Admin" };

export default async function AdminCommentsPage() {
  await requireAdmin();
  const comments = await getAdminComments();

  return (
    <div>
      <h1 className="font-display text-xl text-white">Komentar</h1>

      {!comments || comments.length === 0 ? (
        <div className="mt-6 rounded-xl border border-dashed border-ink-700 bg-ink-900/40 p-10 text-center">
          <p className="text-sm text-ink-400">
            {comments === null ? "DB belum terhubung." : "Belum ada komentar."}
          </p>
        </div>
      ) : (
        <div className="mt-6 divide-y divide-ink-800 overflow-hidden rounded-xl border border-ink-800">
          {comments.map((comment) => (
            <div key={comment.id} className="flex items-start justify-between gap-4 bg-ink-900/40 p-4 transition-colors hover:bg-ink-900">
              <div className="min-w-0">
                <p className="text-sm text-paper-100">{comment.content}</p>
                <p className="mt-1 truncate text-xs text-ink-400">
                  @{comment.authorUsername} · di “{comment.postTitle}” ·{" "}
                  {new Date(comment.createdAt).toLocaleDateString("id-ID")}
                </p>
              </div>
              <ConfirmDelete
                label="Hapus"
                confirmLabel="Hapus komentar ini?"
                action={deleteComment.bind(null, comment.id)}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}