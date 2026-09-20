"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";

export function ConfirmDelete({
  label,
  confirmLabel,
  action,
  onDone,
}: {
  label: string;
  confirmLabel?: string;
  action: () => Promise<{ ok: boolean; error?: string }>;
  onDone?: () => void;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function run() {
    if (confirmLabel && !window.confirm(confirmLabel)) return;
    setPending(true);
    setError(null);
    const result = await action();
    setPending(false);
    if (result.ok) {
      if (onDone) onDone();
      else router.refresh();
    } else {
      setError(result.error ?? "Gagal.");
    }
  }

  return (
    <div className="flex items-center gap-3">
      <Button type="button" variant="danger" size="sm" onClick={run} disabled={pending}>
        {pending ? <Spinner className="h-4 w-4" /> : label}
      </Button>
      {error ? <p className="text-xs text-red-400">{error}</p> : null}
    </div>
  );
}