"use client";

import { useActionState } from "react";
import { updateProfile, type ActionResult } from "@/lib/actions/auth";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { Avatar } from "@/components/ui/avatar";
import type { Profile } from "@/types/profile";

const initialState: ActionResult = { ok: false, error: "" };

export function ProfileForm({ profile }: { profile: Profile }) {
  const [state, formAction, isPending] = useActionState(
    async (_prev: ActionResult, formData: FormData) =>
      updateProfile({
        username: String(formData.get("username") ?? ""),
        displayName: String(formData.get("displayName") ?? ""),
        bio: String(formData.get("bio") ?? ""),
      }),
    initialState,
  );

  return (
    <form action={formAction} className="space-y-5">
      {state.ok === false && state.error ? (
        <p className="text-sm text-red-400">{state.error}</p>
      ) : null}
      {state.ok === true && state.message ? (
        <p className="text-sm text-emerald-400">{state.message}</p>
      ) : null}

      <div className="flex items-center gap-4">
        <Avatar
          name={profile.display_name || profile.username}
          src={profile.avatar_url ?? undefined}
          size="lg"
        />
        <div>
          <p className="text-sm text-ink-400">
            Foto profil tersedia di Phase 6 (upload avatar).
          </p>
        </div>
      </div>

      <div className="space-y-1.5">
        <label htmlFor="displayName" className="text-xs font-medium uppercase tracking-wider text-ink-400">
          Nama
        </label>
        <Input
          id="displayName"
          name="displayName"
          defaultValue={profile.display_name}
          required
          autoComplete="name"
        />
      </div>

      <div className="space-y-1.5">
        <label htmlFor="username" className="text-xs font-medium uppercase tracking-wider text-ink-400">
          Username
        </label>
        <Input
          id="username"
          name="username"
          defaultValue={profile.username}
          required
          pattern="^[a-z0-9_]{3,30}$"
        />
        <p className="text-xs text-ink-500">
          URL publik: /profile/{profile.username}
        </p>
      </div>

      <div className="space-y-1.5">
        <label htmlFor="bio" className="text-xs font-medium uppercase tracking-wider text-ink-400">
          Bio
        </label>
        <Textarea
          id="bio"
          name="bio"
          defaultValue={profile.bio ?? ""}
          rows={4}
          maxLength={500}
          placeholder="Ceritakan tentang dirimu..."
        />
      </div>

      <div className="flex justify-end">
        <Button type="submit" disabled={isPending}>
          {isPending ? <Spinner className="h-4 w-4" /> : "Simpan profil"}
        </Button>
      </div>
    </form>
  );
}