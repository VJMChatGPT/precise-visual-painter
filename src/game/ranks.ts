export type RankId = "exit" | "jeet" | "veteran" | "legend";
export type Rank = { id: RankId; name: string; emoji: string; min: number };

export const RANKS: Rank[] = [
  { id: "legend", name: "Legendary Degen", emoji: "👑", min: 20 },
  { id: "veteran", name: "Trench Veteran", emoji: "🛡️", min: 10 },
  { id: "jeet", name: "Certified Jeet", emoji: "📉", min: 4 },
  { id: "exit", name: "Exit Liquidity", emoji: "💀", min: 0 },
];

export const rankFor = (score: number): Rank =>
  RANKS.find((r) => score >= r.min) ?? RANKS[RANKS.length - 1]!;
