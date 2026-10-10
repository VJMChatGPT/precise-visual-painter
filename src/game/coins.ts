import raw from "@/data/coins.json";

export type CoinRecord = (typeof raw)[number] & {
  referenceMarketCapUsd?: number;
  referenceBasis?: "verified" | "observed" | "estimate";
};

export type Coin = {
  id: string;
  name: string;
  symbol: string;
  category: "Classic" | "Trenches";
  cap: number;
  basis: string;
  image: string;
  story: string;
  postUrl: string;
  sourceUrl: string;
  record: CoinRecord;
};

export const COINS: Coin[] = (raw as CoinRecord[])
  .filter((r) => typeof r.referenceMarketCapUsd === "number" && r.referenceMarketCapUsd > 0)
  .map((r) => ({
    id: r.source_row_id,
    name: r.name,
    symbol: r.symbol,
    category: r.game_category as Coin["category"],
    cap: r.referenceMarketCapUsd!,
    basis: r.referenceBasis!,
    image: r.image_url,
    story: r.origin_story,
    postUrl: r.original_post_url,
    sourceUrl: r.origin_story_source_url || r.identity_source_url,
    record: r,
  }));

export type Pool = "all" | "trenches";

export const poolCoins = (p: Pool) =>
  p === "all" ? COINS : COINS.filter((c) => c.category === "Trenches");

export function formatCap(n: number) {
  const f = (v: number, s: string) => `$${v >= 100 ? Math.round(v) : v.toFixed(1).replace(/\.0$/, "")}${s}`;
  if (n >= 1e9) return f(n / 1e9, "B");
  if (n >= 1e6) return f(n / 1e6, "M");
  if (n >= 1e3) return f(n / 1e3, "K");
  return `$${Math.round(n)}`;
}
