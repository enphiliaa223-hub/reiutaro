import type { Metadata } from "next";
import { getAdminSettings } from "@/lib/queries/admin";
import { VisualEditor } from "@/components/admin/visual-editor";

export const metadata: Metadata = { title: "Visual Editor — Admin" };

export default async function AdminSettingsPage() {
  const settings = await getAdminSettings();

  return (
    <div>
      <h1 className="font-display text-xl text-white">Visual Editor</h1>
      <p className="mt-2 text-sm text-ink-400">
        Ubah brand, hero, opening screen, dan footer. Papan preview otomatis menampilkan hasil
        sebelum disimpan.
      </p>

      <div className="mt-6">
        {!settings || settings.length === 0 ? (
          <div className="rounded-xl border border-dashed border-ink-700 bg-ink-900/40 p-10 text-center">
            <p className="text-sm text-ink-400">
              {settings === null
                ? "DB belum terhubung."
                : "Tidak ada pengaturan. Jalankan migrasi 0002."}
            </p>
          </div>
        ) : (
          <VisualEditor settings={settings} />
        )}
      </div>
    </div>
  );
}