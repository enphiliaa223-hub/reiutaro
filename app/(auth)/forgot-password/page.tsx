import type { Metadata } from "next";
import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";

export const metadata: Metadata = { title: "Lupa Password — Reiutaro" };

export default function ForgotPasswordPage() {
  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-display text-xl text-white">Reset password</h1>
      </div>
      <ForgotPasswordForm />
    </div>
  );
}