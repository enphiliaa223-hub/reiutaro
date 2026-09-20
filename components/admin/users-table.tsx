"use client";

import { useEffect, useState } from "react";
import { useActionState } from "react";
import { createBrowserClientScoped } from "@/lib/supabase/browser";
import { createUser, setUserRole, setUserStatus, type ActionResult } from "@/lib/actions/admin";
import type { AdminUserRow } from "@/lib/queries/admin";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";

const ROLE_LABELS: Record<string, string> = {
  user: "User",
  moderator: "Moderator",
  seller: "Seller",
  admin: "Admin",
};

const STATUS_META: Record<string, { label: string; variant: "success" | "danger" | "outline" | "neon" }> = {
  active: { label: "Aktif", variant: "success" },
  suspended: { label: "Suspended", variant: "outline" },
  banned: { label: "Diblokir", variant: "danger" },
};

const initialState: ActionResult = { ok: false, error: "" };

export function UsersTable({ rows }: { rows: AdminUserRow[] }) {
  const [online, setOnline] = useState<Set<string>>(() => new Set());
  const [createState, createAction, createPending] = useActionState(
    async (_prev: ActionResult, formData: FormData) => createUser(formData),
    initialState,
  );
  const [roleState, roleAction, rolePending] = useActionState(
    async (_prev: ActionResult, formData: FormData) => setUserRole(formData),
    initialState,
  );
  const [statusState, statusAction, statusPending] = useActionState(
    async (_prev: ActionResult, formData: FormData) => setUserStatus(formData),
    initialState,
  );

  useEffect(() => {
    let supabase: ReturnType<typeof createBrowserClientScoped> | null = null;
    try {
      supabase = createBrowserClientScoped();
    } catch {
      return;
    }
    const channel = supabase.channel("online");
    channel.on("presence", { event: "sync" }, () => {
      setOnline(new Set(Object.keys(channel.presenceState())));
    });
    channel.subscribe();
    return () => {
      supabase?.removeChannel(channel as never);
    };
  }, []);

  return (
    <div className="space-y-6">
      {/* Buat akun */}
      <section className="rounded-lg border border-ink-800 bg-ink-900/40 p-4">
        <h2 className="font-display text-sm text-white">Buat akun baru</h2>
        <form action={createAction} className="mt-3 grid gap-3 md:grid-cols-2">
          <input name="username" placeholder="Username" required autoComplete="off"
            className="rounded-md border border-ink-700 bg-night-950 px-3 py-2 text-sm text-white placeholder:text-ink-500" />
          <input name="displayName" placeholder="Nama tampilan" required autoComplete="off"
            className="rounded-md border border-ink-700 bg-night-950 px-3 py-2 text-sm text-white placeholder:text-ink-500" />
          <input name="email" type="email" placeholder="Email" required autoComplete="off"
            className="rounded-md border border-ink-700 bg-night-950 px-3 py-2 text-sm text-white placeholder:text-ink-500" />
          <input name="password" type="password" placeholder="Password (min. 8)" required autoComplete="new-password"
            className="rounded-md border border-ink-700 bg-night-950 px-3 py-2 text-sm text-white placeholder:text-ink-500" />
          <select name="role" defaultValue="user" aria-label="Role"
            className="rounded-md border border-ink-700 bg-night-950 px-3 py-2 text-sm text-white">
            {Object.entries(ROLE_LABELS).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
          <Button type="submit" size="sm" disabled={createPending}>
            {createPending ? <Spinner className="h-3.5 w-3.5" /> : "Buat akun"}
          </Button>
        </form>
        {createState.ok === false && createState.error ? (
          <p className="mt-2 text-sm text-red-400">{createState.error}</p>
        ) : null}
        {createState.ok === true && createState.message ? (
          <p className="mt-2 text-sm text-success">{createState.message}</p>
        ) : null}
      </section>

      {/* Status feedback global */}
      {roleState.ok === false && roleState.error ? (
        <p className="text-sm text-red-400">{roleState.error}</p>
      ) : null}
      {statusState.ok === false && statusState.error ? (
        <p className="text-sm text-red-400">{statusState.error}</p>
      ) : null}

      {/* Daftar akun */}
      <div className="overflow-x-auto rounded-lg border border-ink-800">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-ink-800 text-left text-kicker uppercase tracking-wider text-ink-400">
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Nama</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Role</th>
              <th className="px-4 py-3">Dibuat</th>
              <th className="px-4 py-3">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const meta = STATUS_META[row.status] ?? STATUS_META.active;
              const isOnline = online.has(row.id);
              return (
                <tr key={row.id} className="border-b border-ink-800/60 last:border-0">
                  <td className="px-4 py-3">
                    <span className="flex items-center gap-2">
                      <span
                        className={`h-2 w-2 rounded-full ${isOnline ? "bg-success" : "bg-ink-600"}`}
                        title={isOnline ? "Online" : "Offline"}
                      />
                      <Badge variant={meta.variant}>{meta.label}</Badge>
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-paper-50">{row.display_name}</span>
                    <span className="ml-2 font-mono text-xs text-ink-500">@{row.username}</span>
                  </td>
                  <td className="px-4 py-3 text-ink-300">{row.email ?? "—"}</td>
                  <td className="px-4 py-3">
                    <form action={roleAction} className="flex items-center gap-2">
                      <input type="hidden" name="userId" value={row.id} />
                      <select name="role" defaultValue={row.role} aria-label="Role"
                        className="rounded-md border border-ink-700 bg-night-950 px-2 py-1 text-xs text-white">
                        {Object.entries(ROLE_LABELS).map(([value, label]) => (
                          <option key={value} value={value}>{label}</option>
                        ))}
                      </select>
                      <Button type="submit" size="sm" disabled={rolePending}>Simpan</Button>
                    </form>
                  </td>
                  <td className="px-4 py-3 text-xs text-ink-400">
                    {new Date(row.created_at).toLocaleDateString("id-ID")}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-2">
                      {row.status === "banned" || row.status === "suspended" ? (
                        <form action={statusAction}>
                          <input type="hidden" name="userId" value={row.id} />
                          <input type="hidden" name="status" value="active" />
                          <Button type="submit" size="sm" variant="outline" disabled={statusPending}>
                            Aktifkan
                          </Button>
                        </form>
                      ) : (
                        <>
                          <form action={statusAction}>
                            <input type="hidden" name="userId" value={row.id} />
                            <input type="hidden" name="status" value="suspended" />
                            <Button type="submit" size="sm" variant="outline" disabled={statusPending}>
                              Suspended
                            </Button>
                          </form>
                          <form action={statusAction}>
                            <input type="hidden" name="userId" value={row.id} />
                            <input type="hidden" name="status" value="banned" />
                            <Button type="submit" size="sm" variant="danger" disabled={statusPending}>
                              Blokir
                            </Button>
                          </form>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}