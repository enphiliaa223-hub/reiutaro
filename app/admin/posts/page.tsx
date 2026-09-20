import type { Metadata } from "next";
import { getAdminPosts } from "@/lib/queries/admin";
import { Badge } from "@/components/ui/badge";
import { ConfirmDelete } from "@/components/admin/confirm-delete";
import { deletePost } from "@/lib/actions/admin";

export const metadata: Metadata = { title: "Post — Admin" };

export default async function AdminPostsPage() {
  const posts = await getAdminPosts();

  return (
    <div>
      <h1 className="font-display text-xl text-white">Post komunitas</h1>

      {!posts || posts.length === 0 ? (
        <div className="mt-6 rounded-xl border border-dashed border-ink-700 bg-ink-900/40 p-10 text-center">
          <p className="text-sm text-ink-400">
            {posts === null ? "DB belum terhubung." : "Belum ada post."}
          </p>
        </div>
      ) : (
        <div className="mt-6 divide-y divide-ink-800 overflow-hidden rounded-xl border border-ink-800">
          {posts.map((post) => (
            <div key={post.id} className="flex items-center justify-between gap-4 bg-ink-900/40 p-4 transition-colors hover:bg-ink-900">
              <div className="min-w-0">
                <p className="truncate font-medium text-paper-50">{post.title}</p>
                <p className="truncate text-xs text-ink-400">
                  @{post.authorUsername} · {post.likes} like ·{" "}
                  {new Date(post.createdAt).toLocaleDateString("id-ID")}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-3">
                <Badge variant={post.status === "published" ? "success" : "ink"}>{post.status}</Badge>
                <ConfirmDelete
                  label="Hapus"
                  confirmLabel="Hapus post ini beserta komentarnya?"
                  action={() => deletePost(post.id)}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}