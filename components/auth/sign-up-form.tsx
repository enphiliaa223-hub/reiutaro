"use client";

import { useActionState } from "react";
import Link from "next/link";
import { signUp, type ActionResult } from "@/lib/actions/auth";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";

const initialState: ActionResult = { ok: false, error: "" };

export function SignUpForm() {
  const [state, formAction, isPending] = useActionState(
    async (_prev: ActionResult, formData: FormData) =>
      signUp({
        displayName: String(formData.get("displayName") ?? ""),
        username: String(formData.get("username") ?? ""),
        email: String(formData.get("email") ?? ""),
        password: String(formData.get("password") ?? ""),
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
        <label htmlFor="displayName" className="text-xs font-medium uppercase tracking-wider text-ink-400">
          Nama
        </label>
        <Input id="displayName" name="displayName" required autoComplete="name" placeholder="Reinaldi" />
      </div>

      <div className="space-y-1.5">
        <label htmlFor="username" className="text-xs font-medium uppercase tracking-wider text-ink-400">
          Username
        </label>
        <Input id="username" name="username" required autoComplete="username" placeholder="reinaldi" pattern="^[a-z0-9_]{3,30}$" />
        <p className="text-xs text-ink-500">3–30 karakter, huruf kecil/angka/underscore.</p>
      </div>

      <div className="space-y-1.5">
        <label htmlFor="email" className="text-xs font-medium uppercase tracking-wider text-ink-400">
          Email
        </label>
        <Input id="email" name="email" type="email" required autoComplete="email" />
      </div>

      <div className="space-y-1.5">
        <label htmlFor="password" className="text-xs font-medium uppercase tracking-wider text-ink-400">
          Password
        </label>
        <Input id="password" name="password" type="password" required autoComplete="new-password" minLength={8} />
      </div>

      <Button type="submit" disabled={isPending} className="w-full">
        {isPending ? <Spinner className="h-4 w-4" /> : "Daftar"}
      </Button>

      <p className="text-center text-sm text-ink-400">
        Sudah punya akun?{" "}
        <Link href="/login" className="text-neon-300 hover:underline">
          Masuk
        </Link>
      </p>
    </form>
  );
}