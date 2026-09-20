import type { Metadata } from "next";
import { requireAdmin } from "@/lib/auth/session";
import { getAdminUsers } from "@/lib/queries/admin";
import { UsersTable } from "@/components/admin/users-table";

export const metadata: Metadata = { title: "Pengguna — Admin" };

export default async function AdminUsersPage() {
  await requireAdmin();
  const rows = await getAdminUsers();

  return (
    <div className="space-y-4">
      <h1 className="font-display text-xl text-white">Pengguna</h1>
      <p className="text-sm text-ink-400">
        Kelola akun: buat akun seller/user, ubah role, suspend, dan blokir. Titik hijau =
        sedang online.
      </p>
      {rows ? (
        <UsersTable rows={rows} />
      ) : (
        <p className="text-sm text-ink-400">Gagal memuat daftar pengguna.</p>
      )}
    </div>
  );
}