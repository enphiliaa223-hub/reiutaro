"use client";

import { useActionState } from "react";
import Link from "next/link";
import { updatePassword, type ActionResult } from "@/lib/actions/auth";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";

const initialState: ActionResult = { ok: false, error: "" };

export function ResetPasswordForm() {
  const [state, formAction, isPending] = useActionState(
    async (_prev: ActionResult, formData: FormData) =>
      updatePassword({ password: String(formData.get("password") ?? "") }),
    initialState,
  );

  if (state.ok === true) {
    return (
      <div className="space-y-3 text-center">
        <p className="text-sm text-emerald-400">{state.message}</p>
        <Link href="/login" className="text-sm text-neon-300 hover:underline">
          Masuk sekarang
        </Link>
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-4">
      {state.ok === false && state.error ? (
        <p className="text-sm text-red-400">{state.error}</p>
      ) : null}

      <div className="space-y-1.5">
        <label htmlFor="password" className="text-xs font-medium uppercase tracking-wider text-ink-400">
          Password baru
        </label>
        <Input id="password" name="password" type="password" required autoComplete="new-password" minLength={8} />
      </div>

      <Button type="submit" disabled={isPending} className="w-full">
        {isPending ? <Spinner className="h-4 w-4" /> : "Simpan password"}
      </Button>
    </form>
  );
}