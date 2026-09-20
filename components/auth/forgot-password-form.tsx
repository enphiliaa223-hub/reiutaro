"use client";

import { useActionState } from "react";
import Link from "next/link";
import { forgotPassword, type ActionResult } from "@/lib/actions/auth";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";

const initialState: ActionResult = { ok: false, error: "" };

export function ForgotPasswordForm() {
  const [state, formAction, isPending] = useActionState(
    async (_prev: ActionResult, formData: FormData) =>
      forgotPassword({ email: String(formData.get("email") ?? "") }),
    initialState,
  );

  if (state.ok === true) {
    return (
      <div className="space-y-3 text-center">
        <p className="text-sm text-emerald-400">{state.message}</p>
        <Link href="/login" className="text-sm text-neon-300 hover:underline">
          Kembali ke login
        </Link>
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-4">
      {state.ok === false && state.error ? (
        <p className="text-sm text-red-400">{state.error}</p>
      ) : null}

      <p className="text-sm text-ink-400">
        Masukkan email. Kami kirim tautan untuk reset password.
      </p>

      <div className="space-y-1.5">
        <label htmlFor="email" className="text-xs font-medium uppercase tracking-wider text-ink-400">
          Email
        </label>
        <Input id="email" name="email" type="email" required autoComplete="email" />
      </div>

      <Button type="submit" disabled={isPending} className="w-full">
        {isPending ? <Spinner className="h-4 w-4" /> : "Kirim tautan reset"}
      </Button>

      <p className="text-center text-sm text-ink-400">
        <Link href="/login" className="text-neon-300 hover:underline">
          Kembali ke login
        </Link>
      </p>
    </form>
  );
}