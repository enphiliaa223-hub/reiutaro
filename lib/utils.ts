import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/** Gabungkan class Tailwind dengan merge konflik secara deterministik. */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format angka ke Rupiah (id-ID, tanpa desimal). Argumen `currency` diabaikan
 * sengaja — toko ini SELALU menampilkan rupiah apa pun label yang tersimpan di DB.
 */
export function formatCurrency(amount: number, _currency = "IDR") {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

/** Format tanggal ISO ke bentuk lokal. */
export function formatDate(date: string | number | Date) {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(date));
}

/** Generate slug sederhana dari string. */
export function slugify(input: string) {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

/** Truncate teks panjang tanpa merusak kata. */
export function truncate(text: string, length = 140) {
  if (text.length <= length) return text;
  return `${text.slice(0, length).replace(/\s+\S*$/, "")}…`;
}

/** Inisial untuk fallback avatar. */
export function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

/** Token kartu kaca (dipakai auth, account, profil publik). */
export const glassCard =
  "rounded-2xl border border-ink-800 bg-ink-900/60 backdrop-blur-md shadow-raise";
