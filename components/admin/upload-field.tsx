"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { createBrowserClientScoped } from "@/lib/supabase/browser";
import { cn } from "@/lib/utils";

/**
 * Upload file ke storage (RLS admin untuk bucket assets / avatars).
 * Path: <bucket>/<uid>/<ts>-<nama>.
 */
export function UploadField({
  bucket,
  label,
  accept = "image/*",
  multiple = false,
  preview = true,
  value,
  onChange,
}: {
  bucket: "products" | "projects" | "music" | "community" | "avatars";
  label: string;
  accept?: string;
  multiple?: boolean;
  preview?: boolean;
  value: string[];
  onChange: (urls: string[]) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    setBusy(true);
    setError(null);
    try {
      const supabase = createBrowserClientScoped();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      const uploaded: string[] = [];
      for (const file of Array.from(files).slice(0, multiple ? 6 : 1)) {
        const ext = file.name.split(".").pop() ?? "bin";
        const path = `${bucket}/${user?.id ?? "anon"}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
        const { error: upErr } = await supabase.storage.from(bucket).upload(path, file, {
          cacheControl: "31536000",
        });
        if (upErr) throw upErr;
        const { data: pub } = supabase.storage.from(bucket).getPublicUrl(path);
        uploaded.push(pub.publicUrl);
      }
      onChange(multiple ? [...value, ...uploaded] : uploaded);
    } catch {
      setError("Upload gagal. Pastikan kamu admin dan file valid.");
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div className="space-y-2">
      <p className="text-xs font-medium uppercase tracking-wider text-ink-400">{label}</p>
      <div className="flex flex-wrap items-start gap-3">
        {preview && value.length > 0 ? (
          value.slice(0, multiple ? 6 : 1).map((url) => (
            <div key={url} className="relative h-16 w-16 overflow-hidden rounded-lg border border-ink-700">
              <Image src={url} alt="" fill sizes="64px" className="object-cover" unoptimized />
              <button
                type="button"
                onClick={() => onChange(value.filter((v) => v !== url))}
                aria-label="Hapus file"
                className="absolute right-0.5 top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-danger text-[10px] font-bold text-white"
              >
                ×
              </button>
            </div>
          ))
        ) : (
          <span className="text-xs text-ink-500">Belum ada file.</span>
        )}
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={busy}
          className={cn(
            "rounded-lg border border-dashed border-ink-600 px-4 py-2 text-xs text-ink-300",
            "transition-colors hover:border-neon-400 hover:text-neon-300 disabled:opacity-50",
          )}
        >
          {busy ? "Mengunggah..." : multiple ? "+ Upload gambar" : "+ Upload"}
        </button>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        multiple={multiple}
        className="hidden"
        onChange={(e) => void handleFiles(e.target.files)}
      />
      {error ? <p className="text-xs text-red-400">{error}</p> : null}
    </div>
  );
}