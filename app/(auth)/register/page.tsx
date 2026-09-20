import type { Metadata } from "next";
import { SignUpForm } from "@/components/auth/sign-up-form";

export const metadata: Metadata = { title: "Daftar — Reiutaro" };

export default function RegisterPage() {
  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-display text-xl text-white">Buat akun</h1>
        <p className="mt-1 text-sm text-ink-400">
          Gabung ke komunitas Reiutaro.
        </p>
      </div>
      <SignUpForm />
    </div>
  );
}