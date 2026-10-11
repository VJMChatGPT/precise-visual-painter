import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { COINS, poolCoins, sourceLink, type Coin } from "@/game/coins";
import { isCorrect, pickNext, startPair } from "@/game/engine";
import { rankFor } from "@/game/ranks";
import { getPrefs, recordScore, setPrefs, stats } from "@/game/storage";
import { pumpFunUrl } from "@/config/brand";

afterEach(() => vi.restoreAllMocks());

describe("Trench ranks", () => {
  it.each([
    [0, "Exit Liquidity"],
    [3, "Exit Liquidity"],
    [4, "Certified Jeet"],
    [9, "Certified Jeet"],
    [10, "Trench Veteran"],
    [19, "Trench Veteran"],
    [20, "Legendary Degen"],
    [29, "Legendary Degen"],
  ])("assigns score %i to %s", (score, name) => {
    expect(rankFor(Number(score)).name).toBe(name);
  });
});

describe("Coin selection", () => {
  it.each(["all", "trenches"] as const)(
    "uses each challenger only once in %s, without equal-cap rounds",
    (pool) => {
      for (let run = 0; run < 50; run++) {
        const coins = poolCoins(pool);
        const pair = startPair(coins)!;
        let current = pair[1];
        let unused = pair[2];
        const seen = new Set([pair[0].id, pair[1].id]);
        expect(pair[0].cap).not.toBe(pair[1].cap);
        while (unused.length) {
          const next = pickNext(current, unused, seen.size - 1);
          if (!next) {
            expect(unused.every((c) => c.cap === current.cap)).toBe(true);
            break;
          }
          expect(next.cap).not.toBe(current.cap);
          expect(seen.has(next.id)).toBe(false);
          if (pool === "trenches") expect(next.category).toBe("Trenches");
          seen.add(next.id);
          current = next;
          unused = unused.filter((c) => c.id !== next.id);
        }
        expect(new Set(coins.map((c) => c.id)).size).toBe(coins.length);
      }
    },
  );

  it("selects closer comparisons as the streak grows", () => {
    vi.spyOn(Math, "random").mockReturnValue(0);
    const coin = (id: string, cap: number): Coin => ({ ...COINS[0]!, id, cap });
    const known = coin("known", 100);
    const unused = [coin("close", 110), coin("middle", 200), coin("easy", 600)];
    expect(pickNext(known, unused, 0)?.id).toBe("easy");
    expect(pickNext(known, unused, 20)?.id).toBe("close");
    expect(startPair([known])).toBeNull();
    expect(startPair([known, coin("equal", 100)])).toBeNull();
    expect(isCorrect(known, unused[0]!, "higher")).toBe(true);
    expect(isCorrect(known, unused[0]!, "lower")).toBe(false);
  });

  it("keeps reference caps aligned with the original provenance", () => {
    for (const coin of COINS) {
      const r = coin.record;
      const verified = Number(r.ath_market_cap_verified_usd) || 0;
      const observed = Number(r.historical_cap_observed_usd) || 0;
      const estimate = Number(r.historical_cap_estimate_usd) || 0;
      expect(coin.cap).toBe(verified || observed || estimate);
      expect(coin.basis).toBe(verified ? "verified" : observed ? "observed" : "estimate");
    }
  });

  it("corrects displayed source links while retaining original provenance", () => {
    const vine = COINS.find((coin) => coin.symbol === "VINE")!;
    expect(vine.sourceUrl).toBe("https://coinmarketcap.com/currencies/vine-coin/");
    expect(vine.record.origin_story_source_url).toBe("https://coinmarketcap.com/currencies/vine/");
    const shib = COINS.find((coin) => coin.symbol === "SHIB")!;
    expect(sourceLink(shib.record.historical_cap_observed_source_url)).toBe(
      shib.record.source_original_csv_url,
    );
  });
});

describe("Local scores and preferences", () => {
  beforeEach(() => localStorage.clear());

  it("keeps statistics separate for all four combinations", () => {
    for (const mode of ["classic", "clock"] as const) {
      for (const pool of ["all", "trenches"] as const) {
        recordScore(mode, pool, 4);
        recordScore(mode, pool, 10);
        expect(stats(mode, pool)).toEqual({ best: 10, average: 7, games: 2 });
      }
    }
    setPrefs("clock", "trenches");
    expect(getPrefs()).toEqual({ mode: "clock", pool: "trenches" });
  });

  it("migrates old scores and retains lifetime best and average after 500 games", () => {
    localStorage.setItem("memecap:v1", JSON.stringify({ scores: { "classic:all": [20, 0, 10] } }));
    for (let i = 0; i < 501; i++) recordScore("classic", "all", 0);
    expect(stats("classic", "all")).toEqual({ best: 20, average: 30 / 504, games: 504 });
  });

  it("tolerates corrupted and unavailable storage", () => {
    localStorage.setItem(
      "memecap:v1",
      JSON.stringify({ mode: "bad", pool: "bad", scores: { "classic:all": [4, null, "10", -1] } }),
    );
    expect(getPrefs()).toEqual({ mode: "classic", pool: "all" });
    expect(stats("classic", "all")).toEqual({ best: 4, average: 4, games: 1 });
    localStorage.setItem("memecap:v1", "invalid json");
    expect(stats("clock", "trenches").games).toBe(0);
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("blocked");
    });
    expect(() => recordScore("classic", "all", 10)).not.toThrow();
    expect(() => setPrefs("clock", "all")).not.toThrow();
  });
});

describe("Buy URL", () => {
  it("supports the requested prelaunch homepage and disables absent or unsafe links", () => {
    expect(pumpFunUrl("https://pump.fun")).toBe("https://pump.fun/");
    const tokenUrl = `https://pump.fun/coin/${COINS.find((coin) => coin.symbol === "VINE")!.record.contract_address}`;
    expect(pumpFunUrl(tokenUrl)).toBe(tokenUrl);
    for (const value of [
      "",
      "javascript:alert(1)",
      "https://pump.fun.evil.test",
      "https://evil.test",
      "https://user:password@pump.fun",
      "https://pump.fun/search?q=PEAK",
    ])
      expect(pumpFunUrl(value)).toBe("");
  });
});
