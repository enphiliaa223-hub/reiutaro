"use client";

import { useActionState } from "react";
import { saveSettings, type ActionResult } from "@/lib/actions/admin";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";

const initialState: ActionResult = { ok: false, error: "" };

const HELP: Record<string, string> = {
  footer_socials: "JSON array: [{\"label\":\"GitHub\",\"url\":\"...\"}]",
  opening_duration: "milidetik, mis. 4600",
};

export function SettingsForm({
  settings,
}: {
  settings: { key: string; value: unknown }[];
}) {
  const [state, formAction, isPending] = useActionState(
    async (_prev: ActionResult, formData: FormData) => {
      const entries = settings.map(({ key }) => ({
        key,
        value: String(formData.get(key) ?? ""),
      }));
      return saveSettings(entries);
    },
    initialState,
  );

  return (
    <form action={formAction} className="space-y-5">
      {state.ok === false && state.error ? (
        <p className="text-sm text-red-400">{state.error}</p>
      ) : null}
      {state.ok === true && state.message ? (
        <p className="text-sm text-emerald-400">{state.message}</p>
      ) : null}

      {settings.map(({ key, value }) => (
        <div key={key} className="space-y-1.5">
          <label htmlFor={key} className="text-xs font-medium uppercase tracking-wider text-ink-400">
            {key}
          </label>
          <textarea
            id={key}
            name={key}
            rows={key === "footer_socials" ? 4 : 2}
            defaultValue={typeof value === "string" ? value : JSON.stringify(value, null, 2)}
            className="w-full resize-none rounded-lg border border-ink-700 bg-ink-900/80 px-3 py-2 font-mono text-xs text-paper-50 placeholder:text-ink-500 focus:border-neon-400 focus:outline-none focus:ring-1 focus:ring-neon-400/40"
          />
          {HELP[key] ? <p className="text-xs text-ink-500">{HELP[key]}</p> : null}
        </div>
      ))}

      <div className="flex justify-end">
        <Button type="submit" disabled={isPending}>
          {isPending ? <Spinner className="h-4 w-4" /> : "Simpan pengaturan"}
        </Button>
      </div>
    </form>
  );
}