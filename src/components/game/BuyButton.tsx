import { ExternalLink } from "lucide-react";
import { brand } from "@/config/brand";

export function BuyButton() {
  const className =
    "inline-flex shrink-0 items-center justify-center gap-1.5 rounded-full border border-primary/50 bg-secondary px-4 py-2 text-xs font-bold text-primary backdrop-blur transition hover:bg-primary/15";
  return brand.links.buy ? (
    <a href={brand.links.buy} target="_blank" rel="noopener noreferrer" className={className}>
      Buy {brand.token.ticker} <ExternalLink className="h-3.5 w-3.5" aria-hidden />
    </a>
  ) : (
    <button disabled title="Token link coming soon" className={`${className} opacity-60`}>
      Buy {brand.token.ticker} · Soon
    </button>
  );
}
