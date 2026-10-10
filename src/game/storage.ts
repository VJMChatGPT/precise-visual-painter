import type { Pool } from "./coins";

export type Mode = "classic" | "clock";
const K = "memecap:v1";

type Store = { scores: Record<string, number[]>; mode: Mode; pool: Pool };

function read(): Store {
  try {
    const s = JSON.parse(localStorage.getItem(K) || "");
    return { scores: s.scores || {}, mode: s.mode || "classic", pool: s.pool || "all" };
  } catch {
    return { scores: {}, mode: "classic", pool: "all" };
  }
}
const write = (s: Store) => localStorage.setItem(K, JSON.stringify(s));

const key = (m: Mode, p: Pool) => `${m}:${p}`;

export const getPrefs = () => {
  const s = read();
  return { mode: s.mode, pool: s.pool };
};
export const setPrefs = (mode: Mode, pool: Pool) => write({ ...read(), mode, pool });

export function recordScore(m: Mode, p: Pool, score: number) {
  const s = read();
  const k = key(m, p);
  s.scores[k] = [...(s.scores[k] || []), score].slice(-500);
  write(s);
}

export function stats(m: Mode, p: Pool) {
  const arr = read().scores[key(m, p)] || [];
  return {
    best: arr.length ? Math.max(...arr) : 0,
    average: arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0,
    games: arr.length,
  };
}
