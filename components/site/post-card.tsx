import Link from "next/link";
import { Card, CardBody, Badge, Avatar } from "@/components/ui";
import { StaggerItem } from "@/components/motion/reveal";
import { formatDate, truncate } from "@/lib/utils";
import type { Post } from "@/types/content";

export function PostCard({ post }: { post: Post }) {
  return (
    <StaggerItem className="h-full">
      <Link href={`/community/post/${post.id}`} className="block h-full">
        <Card interactive className="flex h-full flex-col">
          <CardBody className="flex flex-1 flex-col">
            <div className="flex items-center gap-3">
              <Avatar name={post.author.displayName} src={post.author.avatarUrl} size="sm" />
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-paper-50">
                  {post.author.displayName}
                </p>
                <p className="text-xs text-ink-400">{formatDate(post.createdAt)}</p>
              </div>
              {post.categoryName ? (
                <Badge variant="outline" className="ml-auto">
                  {post.categoryName}
                </Badge>
              ) : null}
            </div>

            {post.title ? (
              <h3 className="mt-4 font-display text-lg leading-snug text-paper-50">{post.title}</h3>
            ) : null}
            <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-ink-300">
              {truncate(post.content, 180)}
            </p>

            <div className="mt-auto flex items-center gap-4 pt-5 text-xs text-ink-400">
              <span className="flex items-center gap-1.5">
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden>
                  <path d="M7 22v-4H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-9l-4 4z" />
                </svg>
                {post.comments}
              </span>
              <span className="flex items-center gap-1.5">
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden>
                  <path d="M12 21s-7-4.6-9.5-9C.8 8.6 2.5 5 6 5c2 0 3.2 1 4 2.3C10.8 6 12 5 14 5c3.5 0 5.2 3.6 3.5 7-2.5 4.4-9.5 9-9.5 9z" />
                </svg>
                {post.likes}
              </span>
            </div>
          </CardBody>
        </Card>
      </Link>
    </StaggerItem>
  );
}
