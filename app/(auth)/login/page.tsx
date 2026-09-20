import { Suspense } from "react";
import type { Metadata } from "next";
import { SignInForm } from "@/components/auth/sign-in-form";

export const metadata: Metadata = { title: "Masuk — Reiutaro" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string; blocked?: string }>;
}) {
  const { next, error, blocked } = await searchParams;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-display text-xl text-white">Selamat datang kembali</h1>
        <p className="mt-1 text-sm text-ink-400">Masuk untuk melanjutkan.</p>
      </div>

      {error === "invalid_auth" ? (
        <p className="text-sm text-red-400">
          Tautan tidak valid atau sudah kedaluwarsa. Coba ulangi.
        </p>
      ) : null}

      {blocked === "1" ? (
        <p className="text-sm text-red-400">
          Akun kamu sedang diblokir. Hubungi admin untuk informasi lebih lanjut.
        </p>
      ) : null}

      <Suspense fallback={null}>
        <SignInForm next={next} />
      </Suspense>
    </div>
  );
}