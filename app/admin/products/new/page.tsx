import type { Metadata } from "next";
import { getProductCategories } from "@/lib/queries/store";
import { ProductForm } from "@/components/admin/product-form";

export const metadata: Metadata = { title: "Produk Baru — Admin" };

export default async function NewProductPage() {
  const categories = await getProductCategories();
  return (
    <div className="space-y-6">
      <h1 className="font-display text-xl text-white">Produk baru</h1>
      <ProductForm categories={categories ?? []} />
    </div>
  );
}