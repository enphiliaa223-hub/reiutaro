import type { Metadata } from "next";
import { getAdminReports } from "@/lib/queries/admin";
import { Badge } from "@/components/ui/badge";
import { ConfirmDelete } from "@/components/admin/confirm-delete";
import { deletePost, deleteComment, resolveReport } from "@/lib/actions/admin";

export const metadata: Metadata = { title: "Laporan — Admin" };

export default async function AdminReportsPage() {
  const reports = await getAdminReports();

  return (
    <div>
      <h1 className="font-display text-xl text-white">Laporan konten</h1>

      {!reports || reports.length === 0 ? (
        <div className="mt-6 rounded-xl border border-dashed border-ink-700 bg-ink-900/40 p-10 text-center">
          <p className="text-sm text-ink-400">
            {reports === null ? "DB belum terhubung." : "Tidak ada laporan terbuka. Mantap!"}
          </p>
        </div>
      ) : (
        <div className="mt-6 space-y-3">
          {reports.map((report) => (
            <div key={report.id} className="rounded-xl border border-ink-800 bg-ink-900/40 p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-paper-100">
                    Laporan {report.targetType} (
                    <span className="font-mono text-xs">{report.targetId.slice(0, 8)}</span>)
                  </p>
                  <p className="mt-0.5 truncate text-xs text-ink-400">
                    Alasan: {report.reason} · oleh @{report.reporterUsername}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {report.targetType === "post" ? (
                    <ConfirmDelete
                      label="Hapus post"
                      confirmLabel="Hapus post yang dilaporkan?"
                      action={() => deletePost(report.targetId)}
                      onDone={() => undefined}
                    />
                  ) : null}
                  {report.targetType === "comment" ? (
                    <ConfirmDelete
                      label="Hapus komentar"
                      confirmLabel="Hapus komentar yang dilaporkan?"
                      action={() => deleteComment(report.targetId)}
                    />
                  ) : null}
                  <ConfirmDelete
                    label="Tandai selesai"
                    action={() => resolveReport(report.id)}
                  />
                  <Badge variant="danger">open</Badge>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}