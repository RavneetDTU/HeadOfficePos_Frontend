import { useState } from "react";
import type { Product, ProductImage } from "@/app/store-portal/types";
import { productGallery } from "@/app/store-portal/api/products";
import { ProductImage as Img } from "@/app/store-portal/components/products/ProductImage";
import { cn } from "@/app/store-portal/lib/utils";

export function ProductGallery({ product }: { product: Product }) {
  const images: ProductImage[] = productGallery(product);
  const [active, setActive] = useState(0);
  const current = images[active] ?? images[0];

  return (
    <div className="flex flex-col-reverse gap-3 md:flex-row">
      {images.length > 1 && (
        <div className="flex gap-2 overflow-x-auto md:w-20 md:flex-col md:overflow-y-auto">
          {images.map((img, i) => (
            <button
              key={`${img.url}-${i}`}
              type="button"
              onClick={() => setActive(i)}
              className={cn(
                "h-16 w-16 shrink-0 overflow-hidden rounded-lg border bg-white",
                i === active ? "border-teal-600 ring-2 ring-teal-100" : "border-slate-200"
              )}
              aria-label={img.alt || `Image ${i + 1}`}
            >
              <Img
                src={img.thumbnailUrl || img.url}
                alt={img.alt || product.name}
                className="h-full w-full p-1"
                iconSize={18}
              />
            </button>
          ))}
        </div>
      )}
      <div className="min-w-0 flex-1 overflow-hidden rounded-xl border border-slate-200 bg-white">
        <Img
          src={current?.url || product.imageUrl}
          alt={current?.alt || product.name}
          className="aspect-square p-6"
          iconSize={72}
        />
      </div>
    </div>
  );
}
