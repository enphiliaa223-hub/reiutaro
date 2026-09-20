import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { createServerClientScoped } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth/session";
import { glassCard } from "@/lib/utils";
import type { Profile } from "@/types/profile";

export const revalidate = 60;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ username: string }>;
}): Promise<Metadata> {
  const { username } = await params;
  return { title: `${username} — Reiutaro` };
}

export default async function ProfilePage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;
  const supabase = await createServerClientScoped();

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, username, display_name, avatar_url, bio, role, status, social_links, skills, interests, created_at")
    .eq("username", username)
    .eq("status", "active")
    .maybeSingle();

  if (!profile) notFound();
  const p = profile as Pick<
    Profile,
    "id" | "username" | "display_name" | "avatar_url" | "bio" | "role" | "status" | "social_links" | "skills" | "interests" | "created_at"
  >;

  const { count: postCount } = await supabase
    .from("posts")
    .select("id", { count: "exact", head: true })
    .eq("author_id", p.id)
    .eq("status", "published");

  const user = await getCurrentUser();
  const isOwner = user?.id === p.id;

  return (
    <div className={`mx-auto mt-10 w-full max-w-2xl px-4 ${glassCard} p-6`}>
      <div className="flex items-start gap-5">
        <Avatar name={p.display_name || p.username} src={p.avatar_url ?? undefined} size="xl" />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="font-display text-2xl text-white">{p.display_name}</h1>
            {p.role === "admin" ? <Badge variant="neon">Admin</Badge> : null}
            {p.role === "moderator" ? <Badge variant="outline">Moderator</Badge> : null}
          </div>
          <p className="text-sm text-neon-300">@{p.username}</p>
          <p className="mt-1 text-xs text-ink-500">
            Bergabung{" "}
            {new Date(p.created_at).toLocaleDateString("id-ID", {
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
            {" · "}
            {postCount ?? 0} post
          </p>

          {isOwner ? (
            <Link
              href="/account/profile"
              className="mt-3 inline-block text-xs font-medium text-neon-300 underline-offset-4 hover:underline"
            >
              Edit profil
            </Link>
          ) : null}
        </div>
      </div>

      {p.bio ? <p className="mt-6 whitespace-pre-line text-sm text-ink-200">{p.bio}</p> : null}

      {p.skills && p.skills.length > 0 ? (
        <div className="mt-6">
          <h2 className="text-xs font-medium uppercase tracking-wider text-ink-400">Skills</h2>
          <div className="mt-2 flex flex-wrap gap-2">
            {p.skills.map((s) => (
              <Badge key={s} variant="outline">
                {s}
              </Badge>
            ))}
          </div>
        </div>
      ) : null}

      {p.social_links && Object.keys(p.social_links).length > 0 ? (
        <div className="mt-6">
          <h2 className="text-xs font-medium uppercase tracking-wider text-ink-400">Sosial</h2>
          <div className="mt-2 flex flex-wrap gap-3 text-sm">
            {Object.entries(p.social_links).map(([label, url]) => (
              <a
                key={label}
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-neon-300 hover:underline"
              >
                {label}
              </a>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}