import type { Coin } from "./coins";

const shuffle = <T>(a: T[]) => {
  const b = [...a];
  for (let i = b.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [b[i], b[j]] = [b[j]!, b[i]!];
  }
  return b;
};

/** Ratio between caps, >= 1. Larger = easier. */
const ratio = (a: number, b: number) => Math.max(a, b) / Math.min(a, b);

/** Target minimum ratio shrinks as score rises: easy first, closer later. */
const targetRatio = (score: number) => Math.max(1.05, 6 / (1 + score * 0.6));

/** Pick the next challenger from unused coins, never equal cap to current. */
export function pickNext(current: Coin, unused: Coin[], score: number): Coin | null {
  const valid = unused.filter((c) => c.cap !== current.cap);
  if (!valid.length) return null;
  const t = targetRatio(score);
  const candidates = shuffle(valid);
  const good = candidates.filter((c) => ratio(c.cap, current.cap) >= t);
  if (good.length) {
    // prefer the closest one above the target so difficulty ramps
    good.sort((a, b) => ratio(a.cap, current.cap) - ratio(b.cap, current.cap));
    return good[Math.floor(Math.random() * Math.min(3, good.length))] ?? null;
  }
  return candidates[0] ?? null;
}

export function startPair(pool: Coin[]): [Coin, Coin, Coin[]] | null {
  if (pool.length < 2) return null;
  const s = shuffle(pool);
  const first = s[0]!;
  const rest = s.slice(1);
  const second = pickNext(first, rest, 0);
  if (!second) return null;
  return [first, second, rest.filter((c) => c.id !== second.id)];
}

export const isCorrect = (known: Coin, challenger: Coin, guess: "higher" | "lower") =>
  guess === "higher" ? challenger.cap > known.cap : challenger.cap < known.cap;
