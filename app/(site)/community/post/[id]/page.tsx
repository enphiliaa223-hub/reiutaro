import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { Container, Section } from "@/components/ui/container";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { LikeButton } from "@/components/community/like-button";
import { CommentForm } from "@/components/community/comment-form";
import { PostActions } from "@/components/community/post-actions";
import { CommentItem } from "@/components/community/comment-item";
import {
  getComments,
  getMyLikeState,
  getPostById,
} from "@/lib/queries/community";
import { getCurrentProfile, getCurrentUser } from "@/lib/auth/session";
import { formatDate } from "@/lib/utils";

export const revalidate = 30;

export async function generateMetadata(): Promise<Metadata> {
  return { title: `Post — Reiutaro` };
}

export default async function PostDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [post, comments, user, profile] = await Promise.all([
    getPostById(id),
    getComments(id),
    getCurrentUser(),
    getCurrentProfile(),
  ]);

  if (!post) notFound();

  const likeState = await getMyLikeState(id, user?.id);
  const isOwner = user?.id === post.authorId;
  const isMod = profile?.role === "admin" || profile?.role === "moderator";

  return (
    <Section id="post" className="bg-ink-950">
      <Container className="pt-28 sm:pt-36">
        <Link
          href="/community"
          className="text-sm text-ink-400 transition-colors hover:text-gold-400"
        >
          ← Komunitas
        </Link>

        <article className="mt-6 max-w-3xl">
          <header className="flex items-start gap-4">
            <Link href={`/profile/${post.author.username}`}>
              <Avatar name={post.author.displayName} src={post.author.avatarUrl} size="md" />
            </Link>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <Link
                  href={`/profile/${post.author.username}`}
                  className="text-sm font-semibold text-paper-50 hover:text-gold-400"
                >
                  {post.author.displayName}
                </Link>
                <span className="text-xs text-ink-500">@{post.author.username}</span>
                {post.categoryName ? (
                  <Badge variant="outline" className="ml-auto">
                    {post.categoryName}
                  </Badge>
                ) : null}
              </div>
              <p className="mt-0.5 text-xs text-ink-500">{formatDate(post.createdAt)}</p>
            </div>
          </header>

          {post.title ? (
            <h1 className="mt-6 font-display text-h1 uppercase text-paper-50">{post.title}</h1>
          ) : null}

          {post.imageUrl ? (
            <div className="relative mt-6 aspect-video w-full overflow-hidden rounded-xl border border-ink-800">
              <Image
                src={post.imageUrl}
                alt={post.title ?? "Post image"}
                fill
                sizes="(max-width: 768px) 100vw, 768px"
                className="object-cover"
                unoptimized
              />
            </div>
          ) : null}

          <div className="mt-6 whitespace-pre-line text-base leading-relaxed text-ink-100">
            {post.body}
          </div>

          <footer className="mt-8 flex flex-wrap items-center gap-5 border-t border-ink-800 pt-5">
            <LikeButton
              postId={post.id}
              initialLikes={post.likes}
              initialLiked={likeState.liked}
              isAuthed={Boolean(user)}
            />
            <span className="flex items-center gap-1.5 text-sm text-ink-400">
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden>
                <path d="M7 22v-4H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-9l-4 4z" />
              </svg>
              {comments?.length ?? 0}
            </span>
            {isOwner || isMod ? (
              <div className="ml-auto">
                <PostActions
                  postId={post.id}
                  canDelete={isOwner || isMod}
                  reportTarget={{ type: "post", id: post.id }}
                />
              </div>
            ) : null}
          </footer>
        </article>

        {/* Komentar */}
        <section className="mt-12 max-w-3xl">
          <h2 className="font-display text-h3 uppercase text-paper-50">
            Komentar ({comments?.length ?? 0})
          </h2>

          <div className="mt-6">
            {comments && comments.length > 0 ? (
              <div className="space-y-4">
                {comments.map((comment) => (
                  <CommentItem
                    key={comment.id}
                    comment={comment}
                    postId={post.id}
                    viewerId={user?.id}
                    isMod={isMod}
                  />
                ))}
              </div>
            ) : (
              <p className="text-sm text-ink-500">Belum ada komentar.</p>
            )}
          </div>

          <div className="mt-8">
            {user ? (
              <CommentForm postId={post.id} />
            ) : (
              <p className="text-sm text-ink-500">
                <Link href="/login" className="text-neon-300 hover:underline">
                  Login
                </Link>{" "}
                untuk berkomentar.
              </p>
            )}
          </div>
        </section>
      </Container>
    </Section>
  );
}