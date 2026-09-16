import { useEffect, useState } from "react";
import { Package } from "lucide-react";
import { cn } from "@/app/store-portal/lib/utils";
import { resolveMediaUrl } from "@/app/store-portal/lib/media";

export function ProductImage({
  src,
  alt,
  className,
  imgClassName,
  iconSize = 40,
}: {
  src?: string | null;
  alt: string;
  className?: string;
  imgClassName?: string;
  iconSize?: number;
}) {
  const resolved = resolveMediaUrl(src);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFailed(false);
  }, [resolved]);

  if (!resolved || failed) {
    return (
      <div className={cn("flex items-center justify-center bg-slate-50", className)}>
        <Package className="text-slate-300" size={iconSize} />
      </div>
    );
  }
  return (
    <div className={cn("bg-white flex items-center justify-center overflow-hidden", className)}>
      <img
        src={resolved}
        alt={alt}
        className={cn("max-w-full max-h-full object-contain", imgClassName)}
        onError={() => setFailed(true)}
      />
    </div>
  );
}
