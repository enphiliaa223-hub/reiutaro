"use client";

import { useActionState } from "react";
import { changePassword, type ActionResult } from "@/lib/actions/auth";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";

const initialState: ActionResult = { ok: false, error: "" };

export function ChangePasswordForm() {
  const [state, formAction, isPending] = useActionState(
    async (_prev: ActionResult, formData: FormData) =>
      changePassword({
        currentPassword: String(formData.get("currentPassword") ?? ""),
        newPassword: String(formData.get("newPassword") ?? ""),
        confirm: String(formData.get("confirm") ?? ""),
      }),
    initialState,
  );

  return (
    <form action={formAction} className="space-y-4">
      {state.ok === false && state.error ? (
        <p className="text-sm text-red-400">{state.error}</p>
      ) : null}
      {state.ok === true && state.message ? (
        <p className="text-sm text-emerald-400">{state.message}</p>
      ) : null}

      <div className="space-y-1.5">
        <label
          htmlFor="currentPassword"
          className="text-xs font-medium uppercase tracking-wider text-ink-400"
        >
          Password lama
        </label>
        <Input
          id="currentPassword"
          name="currentPassword"
          type="password"
          required
          autoComplete="current-password"
        />
      </div>

      <div className="space-y-1.5">
        <label
          htmlFor="newPassword"
          className="text-xs font-medium uppercase tracking-wider text-ink-400"
        >
          Password baru
        </label>
        <Input
          id="newPassword"
          name="newPassword"
          type="password"
          required
          minLength={8}
          autoComplete="new-password"
        />
        <p className="text-xs text-ink-500">Minimal 8 karakter.</p>
      </div>

      <div className="space-y-1.5">
        <label
          htmlFor="confirm"
          className="text-xs font-medium uppercase tracking-wider text-ink-400"
        >
          Ulangi password baru
        </label>
        <Input id="confirm" name="confirm" type="password" required autoComplete="new-password" />
      </div>

      <div className="flex justify-end">
        <Button type="submit" disabled={isPending}>
          {isPending ? <Spinner className="h-4 w-4" /> : "Ganti password"}
        </Button>
      </div>
    </form>
  );
}