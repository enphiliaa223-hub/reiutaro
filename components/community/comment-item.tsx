import Link from "next/link";
import { Avatar } from "@/components/ui/avatar";
import { CommentActions } from "@/components/community/comment-actions";
import { ReplyToggle } from "@/components/community/reply-toggle";
import { ReportButton } from "@/components/community/report-dialog";
import { formatDate } from "@/lib/utils";
import type { CommentRow } from "@/lib/queries/community";

export function CommentItem({
  comment,
  postId,
  viewerId,
  isMod,
  depth = 0,
}: {
  comment: CommentRow;
  postId: string;
  viewerId?: string | null;
  isMod: boolean;
  depth?: number;
}) {
  const author = comment.author;
  const canDelete = viewerId === comment.authorId || isMod;
  const isReplyToComment = Boolean(comment.parentId);

  return (
    <div
      className={`rounded-xl border border-ink-800 bg-ink-900/50 p-4 ${
        depth > 0 ? "ml-6" : ""
      }`}
    >
      <div className="flex items-center gap-3">
        <Link href={`/profile/${author?.username ?? ""}`}>
          <Avatar
            name={author?.display_name ?? "Pengguna"}
            src={author?.avatar_url ?? undefined}
            size="sm"
          />
        </Link>
        <div className="min-w-0">
          <Link
            href={`/profile/${author?.username ?? ""}`}
            className="text-sm font-medium text-paper-50 hover:text-gold-400"
          >
            {author?.display_name ?? "Pengguna Terhapus"}
          </Link>
          <p className="text-xs text-ink-500">{formatDate(comment.createdAt)}</p>
        </div>
      </div>

      <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-ink-200">
        {comment.content}
      </p>

      <div className="mt-3 flex items-center gap-4">
        <ReplyToggle postId={postId} parentId={comment.id} />
        <CommentActions commentId={comment.id} canDelete={canDelete} />
        {!isReplyToComment ? (
          <ReportButton targetType="comment" targetId={comment.id} />
        ) : null}
      </div>
    </div>
  );
}