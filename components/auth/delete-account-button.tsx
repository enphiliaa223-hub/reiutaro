"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { deleteAccount } from "@/lib/actions/auth";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";

export function DeleteAccountButton() {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onDelete() {
    if (!window.confirm("Yakin hapus akun? Semua post, komentar, dan data akan hilang permanen.")) {
      return;
    }
    setPending(true);
    setError(null);
    const result = await deleteAccount();
    // Jika tidak redirect, berarti gagal.
    setPending(false);
    setError((result as { error?: string }).error ?? "Gagal menghapus akun.");
    router.refresh();
  }

  return (
    <div className="space-y-3">
      {error ? <p className="text-sm text-red-400">{error}</p> : null}
      <p className="text-sm text-ink-400">
        Menghapus akun bersifat permanen: profil, post, komentar, like, cart, dan order-mu ikut
        terhapus. Tindakan ini tidak bisa dibatalkan.
      </p>
      <Button variant="danger" type="button" onClick={() => void onDelete()} disabled={pending}>
        {pending ? <Spinner className="h-4 w-4" /> : "Hapus akun permanen"}
      </Button>
    </div>
  );
}