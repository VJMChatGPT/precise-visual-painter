import { useState } from "react";
import type { Coin } from "@/game/coins";
import { cn } from "@/lib/utils";

const hue = (s: string) => [...s].reduce((a, c) => a + c.charCodeAt(0), 0) % 360;

export function CoinImage({
  coin,
  className,
  loading = "eager",
}: {
  coin: Coin;
  className?: string;
  loading?: "eager" | "lazy";
}) {
  const [failedUrl, setFailedUrl] = useState("");
  if (!coin.image || failedUrl === coin.image) {
    const h = hue(coin.symbol);
    return (
      <div
        className={cn(
          "flex items-center justify-center rounded-full font-display font-extrabold ring-4 ring-foreground/20",
          className,
        )}
        style={{
          background: `radial-gradient(circle at 30% 30%, oklch(0.8 0.17 ${h}), oklch(0.4 0.15 ${h}))`,
        }}
        aria-label={coin.name}
        role="img"
      >
        <span className="text-[min(2.2em,40%)] leading-none text-foreground drop-shadow">
          {coin.symbol.replace(/\s+/g, "").slice(0, 4).toUpperCase()}
        </span>
      </div>
    );
  }
  return (
    <img
      src={coin.image}
      alt={coin.name}
      onError={() => setFailedUrl(coin.image)}
      decoding="async"
      loading={loading}
      className={cn("rounded-full object-cover ring-4 ring-foreground/20", className)}
    />
  );
}
