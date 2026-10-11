import type { Pool } from "./coins";

export type Mode = "classic" | "clock";
// Keep the existing key so previous players retain their scores and preferences.
const K = "memecap:v1";

type Summary = { best: number; total: number; games: number };
type Store = { scores: Record<string, Summary>; mode: Mode; pool: Pool };
const empty = (): Summary => ({ best: 0, total: 0, games: 0 });
const validScore = (v: unknown): v is number =>
  typeof v === "number" && Number.isSafeInteger(v) && v >= 0;

function summary(value: unknown): Summary {
  // Migrate the existing score arrays without losing recorded results.
  if (Array.isArray(value)) {
    const scores = value.filter(validScore);
    return {
      best: scores.length ? Math.max(...scores) : 0,
      total: scores.reduce((a, b) => a + b, 0),
      games: scores.length,
    };
  }
  if (
    value &&
    typeof value === "object" &&
    "best" in value &&
    "total" in value &&
    "games" in value &&
    validScore(value.best) &&
    validScore(value.total) &&
    validScore(value.games) &&
    value.total >= value.best &&
    (value.games > 0 || value.total === 0)
  ) {
    return { best: value.best, total: value.total, games: value.games };
  }
  return empty();
}

function read(): Store {
  try {
    const s = JSON.parse(localStorage.getItem(K) || "");
    const scores: Record<string, Summary> = {};
    for (const mode of ["classic", "clock"] as const) {
      for (const pool of ["all", "trenches"] as const) {
        const k = key(mode, pool);
        scores[k] = summary(s?.scores?.[k]);
      }
    }
    return {
      scores,
      mode: s?.mode === "clock" ? "clock" : "classic",
      pool: s?.pool === "trenches" ? "trenches" : "all",
    };
  } catch {
    return { scores: {}, mode: "classic", pool: "all" };
  }
}
function write(s: Store) {
  try {
    localStorage.setItem(K, JSON.stringify(s));
  } catch {
    // Private browsing or full storage must not interrupt gameplay.
  }
}

const key = (m: Mode, p: Pool) => `${m}:${p}`;

export const getPrefs = () => {
  const s = read();
  return { mode: s.mode, pool: s.pool };
};
export const setPrefs = (mode: Mode, pool: Pool) => write({ ...read(), mode, pool });

export function recordScore(m: Mode, p: Pool, score: number) {
  if (!validScore(score)) return;
  const s = read();
  const k = key(m, p);
  const prev = s.scores[k] || empty();
  s.scores[k] = {
    best: Math.max(prev.best, score),
    total: prev.total + score,
    games: prev.games + 1,
  };
  write(s);
}

export function stats(m: Mode, p: Pool) {
  const s = read().scores[key(m, p)] || empty();
  return {
    best: s.best,
    average: s.games ? s.total / s.games : 0,
    games: s.games,
  };
}
