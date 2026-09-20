"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toggleLike } from "@/lib/actions/community";
import { cn } from "@/lib/utils";

export function LikeButton({
  postId,
  initialLikes,
  initialLiked,
  isAuthed,
}: {
  postId: string;
  initialLikes: number;
  initialLiked: boolean;
  isAuthed: boolean;
}) {
  const router = useRouter();
  const [liked, setLiked] = useState(initialLiked);
  const [likes, setLikes] = useState(initialLikes);
  const [pending, setPending] = useState(false);

  async function onClick() {
    if (!isAuthed) {
      router.push(`/login?next=${encodeURIComponent(`/community/post/${postId}`)}`);
      return;
    }
    if (pending) return;
    setPending(true);
    const result = await toggleLike(postId);
    setPending(false);
    if (result.ok) {
      setLiked(result.liked);
      setLikes(result.likes);
    }
  }

  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={liked}
      className={cn(
        "flex items-center gap-1.5 text-sm transition-colors",
        liked ? "text-gold-400" : "text-ink-400 hover:text-gold-300",
      )}
    >
      <svg
        viewBox="0 0 24 24"
        className={cn("h-4 w-4", liked && "fill-current")}
        fill={liked ? "currentColor" : "none"}
        stroke="currentColor"
        strokeWidth="2"
        aria-hidden
      >
        <path d="M12 21s-7-4.6-9.5-9C.8 8.6 2.5 5 6 5c2 0 3.2 1 4 2.3C10.8 6 12 5 14 5c3.5 0 5.2 3.6 3.5 7-2.5 4.4-9.5 9-9.5 9z" />
      </svg>
      {likes}
    </button>
  );
}