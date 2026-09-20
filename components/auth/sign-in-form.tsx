"use client";

import { useActionState } from "react";
import Link from "next/link";
import { signIn, type ActionResult } from "@/lib/actions/auth";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";

const initialState: ActionResult = { ok: false, error: "" };

export function SignInForm({ next }: { next?: string }) {
  const [state, formAction, isPending] = useActionState(
    async (_prev: ActionResult, formData: FormData) =>
      signIn(
        {
          email: String(formData.get("email") ?? ""),
          password: String(formData.get("password") ?? ""),
        },
        next,
      ),
    initialState,
  );

  return (
    <form action={formAction} className="space-y-4">
      {state.ok === false && state.error ? (
        <p className="text-sm text-red-400">{state.error}</p>
      ) : null}

      <div className="space-y-1.5">
        <label htmlFor="email" className="text-xs font-medium uppercase tracking-wider text-ink-400">
          Email
        </label>
        <Input id="email" name="email" type="email" required autoComplete="email" />
      </div>

      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <label htmlFor="password" className="text-xs font-medium uppercase tracking-wider text-ink-400">
            Password
          </label>
          <Link href="/forgot-password" className="text-xs text-neon-300 hover:underline">
            Lupa password?
          </Link>
        </div>
        <Input id="password" name="password" type="password" required autoComplete="current-password" />
      </div>

      <Button type="submit" disabled={isPending} className="w-full">
        {isPending ? <Spinner className="h-4 w-4" /> : "Masuk"}
      </Button>

      <p className="text-center text-sm text-ink-400">
        Belum punya akun?{" "}
        <Link href="/register" className="text-neon-300 hover:underline">
          Daftar
        </Link>
      </p>
    </form>
  );
}