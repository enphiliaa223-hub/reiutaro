"use client";

import { useActionState, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { saveSettings, type ActionResult } from "@/lib/actions/admin";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

const initialState: ActionResult = { ok: false, error: "" };

const TYPES: Record<string, "string" | "boolean" | "number" | "json"> = {
  brand: "string",
  owner_name: "string",
  hero_kicker: "string",
  hero_tagline: "string",
  hero_description: "string",
  opening_enabled: "boolean",
  opening_duration: "number",
  opening_title: "string",
  opening_subtitle: "string",
  opening_show_skip: "boolean",
  about_bio: "string",
  footer_socials: "json",
  maintenance_mode: "boolean",
};

const SECTIONS: { title: string; keys: string[] }[] = [
  { title: "Brand & Identitas", keys: ["brand", "owner_name"] },
  { title: "Hero (Beranda)", keys: ["hero_kicker", "hero_tagline", "hero_description"] },
  { title: "Opening Screen", keys: ["opening_enabled", "opening_duration", "opening_title", "opening_subtitle", "opening_show_skip"] },
  { title: "Tentang", keys: ["about_bio"] },
  { title: "Footer", keys: ["footer_socials"] },
  { title: "Lainnya", keys: ["maintenance_mode"] },
];

function toEditable(value: unknown, type: "string" | "boolean" | "number" | "json"): string {
  if (type === "boolean") return Boolean(value) ? "true" : "false";
  if (type === "number") return typeof value === "number" ? String(value) : "0";
  if (type === "json") return typeof value === "string" ? value : JSON.stringify(value, null, 2);
  return typeof value === "string" ? value : "";
}

interface Draft {
  key: string;
  type: string;
  value: string;
}

export function VisualEditor({ settings }: { settings: { key: string; value: unknown }[] }) {
  const router = useRouter();
  const byKey = useMemo(
    () => new Map(settings.map((s) => [s.key, s.value])),
    [settings],
  );
  const [draft, setDraft] = useState<Draft[]>(() =>
    Object.entries(TYPES).map(([key, type]) => ({
      key,
      type,
      value: toEditable(byKey.get(key) ?? (type === "string" ? "" : type === "boolean" ? "false" : type === "number" ? "0" : "[]"), type),
    })),
  );

  const [state, formAction, isPending] = useActionState(
    async () => {
      const result = await saveSettings(
        draft.map((d) => ({ key: d.key, value: d.value })),
      );
      if (result.ok) router.refresh();
      return result;
    },
    initialState,
  );

  function setValue(key: string, value: string) {
    setDraft((cur) => cur.map((d) => (d.key === key ? { ...d, value } : d)));
  }

  const g = (key: string) => draft.find((d) => d.key === key)?.value ?? "";
  const bool = (key: string) => g(key) === "true";

  // Preview live dari draft
  const preview = {
    brand: g("brand") || "REIUTAROU",
    kicker: g("hero_kicker") || "PERSONAL DIGITAL UNIVERSE",
    tagline: g("hero_tagline"),
    description: g("hero_description"),
    openingTitle: g("opening_title") || "REIUTAROU",
    openingSubtitle: g("opening_subtitle"),
    openingEnabled: bool("opening_enabled"),
  };
  const brandStart = preview.brand.slice(0, Math.max(0, preview.brand.length - 3));
  const brandEnd = preview.brand.slice(-3);

  return (
    <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
      <form action={formAction} className="space-y-6">
        {state.ok === false && state.error ? (
          <p className="text-sm text-red-400">{state.error}</p>
        ) : null}
        {state.ok === true && state.message ? (
          <p className="text-sm text-emerald-400">{state.message}</p>
        ) : null}

        {SECTIONS.map((section) => (
          <section key={section.title} className="rounded-xl border border-ink-800 bg-ink-900/40 p-4">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-gold-400">
              {section.title}
            </h2>
            <div className="mt-4 space-y-4">
              {section.keys.map((key) => {
                const type = TYPES[key];
                const d = draft.find((x) => x.key === key);
                if (!d) return null;
                if (type === "boolean") {
                  return (
                    <label key={key} className="flex items-center gap-2 text-sm text-ink-300">
                      <input
                        type="checkbox"
                        checked={d.value === "true"}
                        onChange={(e) => setValue(key, e.target.checked ? "true" : "false")}
                        className="accent-gold-400"
                      />
                      {key}
                    </label>
                  );
                }
                return (
                  <div key={key} className="space-y-1.5">
                    <label htmlFor={key} className="text-xs font-medium uppercase tracking-wider text-ink-400">
                      {key}
                    </label>
                    {type === "json" ? (
                      <textarea
                        id={key}
                        value={d.value}
                        onChange={(e) => setValue(key, e.target.value)}
                        rows={4}
                        className="w-full resize-none rounded-lg border border-ink-700 bg-ink-900/80 px-3 py-2 font-mono text-xs text-paper-50 focus:border-neon-400 focus:outline-none focus:ring-1 focus:ring-neon-400/40"
                      />
                    ) : (
                      <Input
                        id={key}
                        value={d.value}
                        onChange={(e) => setValue(key, e.target.value)}
                        type={type === "number" ? "number" : "text"}
                      />
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        ))}

        <div className="flex justify-end">
          <Button type="submit" disabled={isPending}>
            {isPending ? <Spinner className="h-4 w-4" /> : "Simpan & terbitkan"}
          </Button>
        </div>
      </form>

      {/* Preview live */}
      <aside className="space-y-4">
        <p className="text-xs font-semibold uppercase tracking-wider text-ink-400">Live preview</p>

        <div className="relative overflow-hidden rounded-xl border border-ink-800 bg-ink-950 p-6">
          <div
            aria-hidden
            className="absolute inset-0 bg-[linear-gradient(to_right,var(--color-ink-800)_1px,transparent_1px),linear-gradient(to_bottom,var(--color-ink-800)_1px,transparent_1px)] bg-[size:72px_72px] [mask-image:radial-gradient(ellipse_at_center,black_25%,transparent_78%)]"
          />
          <div className="relative text-center">
            <p className="mb-3 text-kicker uppercase text-gold-400">{preview.kicker}</p>
            <h3 className="font-display text-4xl uppercase leading-none tracking-tight text-paper-50">
              <span>{brandStart}</span>
              <span className="[-webkit-text-stroke:1.5px_var(--color-gold-400)] text-transparent">
                {brandEnd}
              </span>
            </h3>
            {preview.tagline || preview.description ? (
              <p className="mx-auto mt-4 max-w-sm text-sm text-paper-200/90">
                {preview.tagline} {preview.description}
              </p>
            ) : null}
          </div>
        </div>

        <div
          className={cn(
            "relative overflow-hidden rounded-xl border p-6 text-center",
            preview.openingEnabled ? "border-gold-500/40" : "border-ink-800 opacity-60",
          )}
        >
          {!preview.openingEnabled ? (
            <p className="text-xs font-semibold uppercase tracking-widest text-ink-500">
              Opening dinonaktifkan
            </p>
          ) : null}
          <p className="text-kicker uppercase text-gold-400">{preview.openingSubtitle}</p>
          <h3 className="mt-2 font-display text-3xl uppercase leading-none text-paper-50">
            {preview.openingTitle}
          </h3>
          <div aria-hidden className="mx-auto mt-4 h-1.5 w-14 rounded-full bg-gold-400" />
        </div>

        <p className="text-xs text-ink-500">
          Perubahan dipakai langsung oleh beranda, opening screen, dan footer setelah disimpan.
        </p>
      </aside>
    </div>
  );
}