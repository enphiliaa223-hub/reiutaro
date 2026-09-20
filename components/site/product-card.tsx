import Image from "next/image";
import Link from "next/link";
import { Card, CardBody, CardMedia, Badge } from "@/components/ui";
import { StaggerItem } from "@/components/motion/reveal";
import { formatCurrency } from "@/lib/utils";
import type { Product } from "@/types/content";

const TYPE_LABELS: Record<Product["type"], string> = {
  digital: "Digital",
  topup: "Top Up",
  merchandise: "Merch",
  service: "Service",
  other: "Other",
};

export function ProductCard({ product }: { product: Product }) {
  const outOfStock = product.stock <= 0;

  return (
    <StaggerItem className="h-full">
      <Link href={`/store/product/${product.slug}`} className="block h-full">
        <Card interactive className="flex h-full flex-col overflow-hidden">
          <CardMedia className="aspect-square rounded-b-none">
            {product.cover ? (
              <Image
                src={product.cover}
                alt={product.name}
                fill
                sizes="(max-width: 1024px) 100vw, 512px"
                className="object-cover"
                unoptimized
              />
            ) : (
              <div className="absolute inset-0 bg-[linear-gradient(160deg,var(--color-night-700),var(--color-ink-900)_65%)]" />
            )}
            <div aria-hidden className="absolute right-3 top-3">
              <Badge variant={outOfStock ? "danger" : "outline"}>{TYPE_LABELS[product.type]}</Badge>
            </div>
          </CardMedia>
          <CardBody className="flex flex-1 flex-col">
            <h3 className="font-display text-base uppercase leading-tight tracking-tight text-paper-50">
              {product.name}
            </h3>
            <div className="mt-auto flex items-center justify-between pt-4">
              <p className="text-base font-semibold text-gold-400">
                {formatCurrency(product.price, product.currency)}
              </p>
              {outOfStock ? (
                <Badge variant="danger">Out of Stock</Badge>
              ) : (
                <Badge variant="success">In Stock</Badge>
              )}
            </div>
          </CardBody>
        </Card>
      </Link>
    </StaggerItem>
  );
}
