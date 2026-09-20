"use client";

import { useActionState, useState } from "react";
import { useRouter } from "next/navigation";
import { saveProduct, type ActionResult } from "@/lib/actions/admin";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button, buttonStyles } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { UploadField } from "@/components/admin/upload-field";
import type { CategoryRow } from "@/lib/queries/community";

const initialState: ActionResult = { ok: false, error: "" };

const STATUS_LABELS: Record<string, string> = {
  active: "Aktif",
  inactive: "Nonaktif",
};

export function ProductForm({
  product,
  categories,
}: {
  product?: {
    id: string;
    name: string;
    description: string | null;
    categoryId: string | null;
    price: number;
    stock: number;
    status: string;
    featured: boolean;
    type: string;
    images: string[];
  };
  categories: CategoryRow[];
}) {
  const router = useRouter();
  const [images, setImages] = useState<string[]>(product?.images ?? []);
  const [state, formAction, isPending] = useActionState(
    async (_prev: ActionResult, formData: FormData) => {
      const result = await saveProduct({
        id: product?.id,
        name: String(formData.get("name") ?? ""),
        description: String(formData.get("description") ?? ""),
        categoryId: String(formData.get("categoryId") ?? "") || null,
        price: Number(formData.get("price") ?? 0),
        stock: Number(formData.get("stock") ?? 0),
        status: String(formData.get("status") ?? "active"),
        featured: formData.get("featured") === "on",
        type: String(formData.get("type") ?? "digital"),
        images,
      });
      if (result.ok) {
        router.push("/admin/products");
        router.refresh();
      }
      return result;
    },
    initialState,
  );

  return (
    <form action={formAction} className="space-y-5">
      {state.ok === false && state.error ? (
        <p className="text-sm text-red-400">{state.error}</p>
      ) : null}

      <div className="space-y-1.5">
        <label htmlFor="name" className="text-xs font-medium uppercase tracking-wider text-ink-400">
          Nama produk
        </label>
        <Input id="name" name="name" required defaultValue={product?.name} placeholder="e.g. Ngoding Session 1 Jam" />
      </div>

      <div className="space-y-1.5">
        <label htmlFor="description" className="text-xs font-medium uppercase tracking-wider text-ink-400">
          Deskripsi
        </label>
        <Textarea
          id="description"
          name="description"
          rows={4}
          defaultValue={product?.description ?? ""}
          placeholder="Deskripsi produk…"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="space-y-1.5">
          <label htmlFor="price" className="text-xs font-medium uppercase tracking-wider text-ink-400">
            Harga (Rp)
          </label>
          <Input id="price" name="price" type="number" min={0} step="0.01" required defaultValue={product?.price ?? 0} />
        </div>
        <div className="space-y-1.5">
          <label htmlFor="stock" className="text-xs font-medium uppercase tracking-wider text-ink-400">
            Stok
          </label>
          <Input id="stock" name="stock" type="number" min={0} step={1} required defaultValue={product?.stock ?? 0} />
        </div>
        <div className="space-y-1.5">
          <label htmlFor="type" className="text-xs font-medium uppercase tracking-wider text-ink-400">
            Tipe
          </label>
          <select id="type" name="type" defaultValue={product?.type ?? "digital"} className="w-full rounded-lg border border-ink-700 bg-ink-900/80 px-3 py-2 text-sm text-paper-50">
            <option value="digital">Digital</option>
            <option value="topup">Top Up</option>
            <option value="merchandise">Merchandise</option>
            <option value="service">Service</option>
            <option value="other">Other</option>
          </select>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <label htmlFor="categoryId" className="text-xs font-medium uppercase tracking-wider text-ink-400">
            Kategori
          </label>
          <select id="categoryId" name="categoryId" defaultValue={product?.categoryId ?? ""} className="w-full rounded-lg border border-ink-700 bg-ink-900/80 px-3 py-2 text-sm text-paper-50">
            <option value="">— tanpa kategori —</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
        <div className="space-y-1.5">
          <label htmlFor="status" className="text-xs font-medium uppercase tracking-wider text-ink-400">
            Status
          </label>
          <select id="status" name="status" defaultValue={product?.status ?? "active"} className="w-full rounded-lg border border-ink-700 bg-ink-900/80 px-3 py-2 text-sm text-paper-50">
            {Object.entries(STATUS_LABELS).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </div>
      </div>

      <label className="flex items-center gap-2 text-sm text-ink-300">
        <input type="checkbox" name="featured" defaultChecked={product?.featured} className="accent-gold-400" />
        Tampilkan di beranda (featured)
      </label>

      <UploadField
        bucket="products"
        label="Gambar produk"
        multiple
        value={images}
        onChange={setImages}
      />

      <div className="flex justify-end gap-3">
        <a href="/admin/products" className={buttonStyles({ variant: "ghost", size: "md" })}>
          Batal
        </a>
        <Button type="submit" disabled={isPending}>
          {isPending ? <Spinner className="h-4 w-4" /> : product ? "Simpan produk" : "Buat produk"}
        </Button>
      </div>
    </form>
  );
}