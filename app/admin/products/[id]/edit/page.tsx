import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getAdminProduct } from "@/lib/queries/admin";
import { getProductCategories } from "@/lib/queries/store";
import { ProductForm } from "@/components/admin/product-form";
import { ConfirmDelete } from "@/components/admin/confirm-delete";
import { deleteProduct } from "@/lib/actions/admin";

export const metadata: Metadata = { title: "Edit Produk — Admin" };

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [product, categories] = await Promise.all([
    getAdminProduct(id),
    getProductCategories(),
  ]);
  if (!product) notFound();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <h1 className="font-display text-xl text-white">Edit produk</h1>
        <ConfirmDelete
          label="Nonaktifkan produk"
          confirmLabel="Yakin menonaktifkan produk ini?"
          action={() => deleteProduct(product.id)}
        />
      </div>
      <ProductForm product={product} categories={categories ?? []} />
    </div>
  );
}