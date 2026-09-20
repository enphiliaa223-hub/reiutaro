export const ORDER_STATUS_META: Record<
  string,
  { label: string; badge: string; text: string }
> = {
  pending: {
    label: "Pending",
    badge: "bg-ink-800 text-paper-100 border border-ink-600",
    text: "Menunggu diproses oleh admin.",
  },
  awaiting_payment: {
    label: "Menunggu Pembayaran",
    badge: "bg-gold-400/15 text-gold-300 border border-gold-500/40",
    text: "Pesanan dibuat, menunggu konfirmasi pembayaran oleh admin.",
  },
  paid: {
    label: "Dibayar",
    badge: "bg-neon-500/15 text-neon-300 border border-neon-500/40",
    text: "Pembayaran diterima. Pesanan sedang diproses.",
  },
  processing: {
    label: "Diproses",
    badge: "bg-neon-500/15 text-neon-300 border border-neon-500/40",
    text: "Pesanan sedang diproses admin.",
  },
  completed: {
    label: "Selesai",
    badge: "bg-success/15 text-success border border-success/40",
    text: "Pesanan selesai. Terima kasih!",
  },
  cancelled: {
    label: "Dibatalkan",
    badge: "bg-danger/15 text-danger border border-danger/40",
    text: "Pesanan dibatalkan.",
  },
  refunded: {
    label: "Dikembalikan",
    badge: "bg-danger/15 text-danger border border-danger/40",
    text: "Pesanan dikembalikan/direfund.",
  },
} as const;