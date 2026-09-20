"use client";

import { useState } from "react";
import { CommentForm } from "@/components/community/comment-form";

export function ReplyToggle({ postId, parentId }: { postId: string; parentId: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="text-xs text-ink-400 transition-colors hover:text-gold-400"
      >
        {open ? "Batal" : "Balas"}
      </button>
      {open ? (
        <div className="mt-3">
          <CommentForm postId={postId} parentId={parentId} />
        </div>
      ) : null}
    </div>
  );
}