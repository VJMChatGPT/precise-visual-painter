import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { Crown, Info, Play, Shield, Skull, Timer, TrendingDown } from "lucide-react";
import { rankFor } from "@/game/ranks";
import { Backdrop } from "@/components/game/Backdrop";
import { CoinPanel } from "@/components/game/CoinPanel";
import { Logo } from "@/components/game/Logo";
import { brand } from "@/config/brand";
import { poolCoins, type Coin, type Pool } from "@/game/coins";
import { isCorrect, pickNext, startPair } from "@/game/engine";
import { getPrefs, recordScore, setPrefs, stats, type Mode } from "@/game/storage";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "PEAK OR JEET? | Memecoin Higher or Lower" },
      { name: "description", content: "Guess the peak market cap. Don't get rekt. How well do you know the trenches?" },
      { property: "og:title", content: "PEAK OR JEET? | Memecoin Higher or Lower" },
      { property: "og:description", content: "How well do you know the trenches? Guess which memecoin hit the higher peak market cap." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: App,
});

const CLOCK_SECONDS = 60;
type Screen = "home" | "play" | "over";

function App() {
  const [screen, setScreen] = useState<Screen>("home");
  const [mode, setMode] = useState<Mode>("classic");
  const [pool, setPool] = useState<Pool>("all");
  const [final, setFinal] = useState({ score: 0, reason: "" });

  useEffect(() => {
    const p = getPrefs();
    setMode(p.mode);
    setPool(p.pool);
  }, []);

  const start = (m: Mode) => {
    setMode(m);
    setPrefs(m, pool);
    setScreen("play");
  };
  const end = (score: number, reason: string) => {
    recordScore(mode, pool, score);
    setFinal({ score, reason });
    setScreen("over");
  };

  return (
    <main className="relative h-[100dvh] overflow-hidden">
      <Backdrop floating={screen !== "play"} />
      {screen === "home" && <Home pool={pool} setPool={(p) => { setPool(p); setPrefs(mode, p); }} onStart={start} />}
      {screen === "play" && <Game mode={mode} pool={pool} onEnd={end} onQuit={() => setScreen("home")} />}
      {screen === "over" && (
        <GameOver mode={mode} pool={pool} {...final} onAgain={() => setScreen("play")} onMenu={() => setScreen("home")} />
      )}
    </main>
  );
}

function Disclaimer() {
  return (
    <details className="group mx-auto max-w-md text-xs text-muted-foreground">
      <summary className="inline-flex cursor-pointer list-none items-center gap-1 hover:text-foreground">
        <Info className="h-3.5 w-3.5" /> About these numbers
      </summary>
      <p className="mt-2 rounded-lg bg-secondary p-3 text-left backdrop-blur">
        Figures are approximate historical market caps for entertainment only. Some are reported values, others are estimates
        or observed peaks, and they may not represent verified all-time highs. Not financial advice.
      </p>
    </details>
  );
}

function Home({ pool, setPool, onStart }: { pool: Pool; setPool: (p: Pool) => void; onStart: (m: Mode) => void }) {
  const [best, setBest] = useState({ c: 0, t: 0 });
  useEffect(() => setBest({ c: stats("classic", pool).best, t: stats("clock", pool).best }), [pool]);
  const btn = "flex w-full items-center justify-center gap-3 rounded-full px-8 py-4 font-display text-lg font-extrabold tracking-wide transition hover:scale-[1.03] active:scale-95 sm:w-60";
  return (
    <div className="flex h-full flex-col items-center justify-center gap-5 px-6 text-center sm:gap-7">
      <Logo className="animate-pop" />
      <div className="space-y-1">
        <p className="font-display text-xl font-bold sm:text-3xl">{brand.subtitle}</p>
        <p className="text-sm text-muted-foreground sm:text-base">{brand.tagline}</p>
      </div>
      <div className="flex w-full max-w-xs flex-col gap-3 sm:max-w-none sm:flex-row sm:justify-center">
        <button onClick={() => onStart("classic")} className={cn(btn, "bg-primary text-primary-foreground shadow-[0_6px_0_0_var(--overlay)]")}>
          CLASSIC <Play className="h-5 w-5 fill-current" />
        </button>
        <button onClick={() => onStart("clock")} className={cn(btn, "bg-foreground text-background shadow-[0_6px_0_0_var(--overlay)]")}>
          BEAT THE CLOCK <Timer className="h-5 w-5" />
        </button>
      </div>
      <div className="inline-flex rounded-full border bg-secondary p-1 text-xs font-bold tracking-wider backdrop-blur">
        {(["all", "trenches"] as Pool[]).map((p) => (
          <button key={p} onClick={() => setPool(p)} className={cn("rounded-full px-4 py-2 transition", pool === p ? "bg-highlight text-accent-foreground" : "text-muted-foreground hover:text-foreground")}>
            {p === "all" ? "ALL MEMECOINS" : "TRENCHES ONLY"}
          </button>
        ))}
      </div>
      <p className="text-sm text-muted-foreground">
        Personal best · Classic <span className="font-bold text-highlight">{best.c}</span> · Clock{" "}
        <span className="font-bold text-highlight">{best.t}</span>
      </p>
      <Disclaimer />
    </div>
  );
}

function Game({ mode, pool, onEnd, onQuit }: { mode: Mode; pool: Pool; onEnd: (s: number, r: string) => void; onQuit: () => void }) {
  const [state, setState] = useState(() => {
    const s = startPair(poolCoins(pool));
    return s ? { known: s[0], challenger: s[1] as Coin, unused: s[2] } : null;
  });
  const [score, setScore] = useState(0);
  const [phase, setPhase] = useState<"guess" | "reveal">("guess");
  const [result, setResult] = useState<"correct" | "wrong" | null>(null);
  const [time, setTime] = useState(CLOCK_SECONDS);
  const ended = useRef(false);
  const best = stats(mode, pool).best;

  const finish = useCallback((s: number, r: string) => {
    if (ended.current) return;
    ended.current = true;
    onEnd(s, r);
  }, [onEnd]);

  useEffect(() => {
    if (mode !== "clock") return;
    const id = setInterval(() => setTime((t) => t - 1), 1000);
    return () => clearInterval(id);
  }, [mode]);
  useEffect(() => {
    if (mode === "clock" && time <= 0) finish(score, "time");
  }, [time, mode, score, finish]);

  if (!state) return <div className="flex h-full items-center justify-center">Not enough coins in this pool.</div>;
  const { known, challenger, unused } = state;

  const guess = (g: "higher" | "lower") => {
    if (phase !== "guess") return;
    setPhase("reveal");
    const ok = isCorrect(known, challenger, g);
    setTimeout(() => setResult(ok ? "correct" : "wrong"), 800);
    setTimeout(() => {
      if (!ok) return finish(score, "wrong");
      const ns = score + 1;
      setScore(ns);
      const next = pickNext(challenger, unused, ns);
      if (!next) return finish(ns, "exhausted");
      setState({ known: challenger, challenger: next, unused: unused.filter((c) => c.id !== next.id) });
      setResult(null);
      setPhase("guess");
    }, 1500);
  };

  return (
    <div className="flex h-full flex-col gap-2 p-2 sm:gap-3 sm:p-4">
      <header className="flex items-center justify-between px-2 font-display text-sm font-bold sm:text-base">
        <button onClick={onQuit} className="text-muted-foreground hover:text-foreground">
          ← <span className="text-primary">PEAK</span> OR <span className="text-destructive">JEET?</span>
        </button>
        {mode === "clock" && (
          <div className={cn("flex items-center gap-1.5 rounded-full px-4 py-1.5 text-lg tabular-nums", time <= 10 ? "bg-destructive animate-pulse" : "bg-secondary")}>
            <Timer className="h-4 w-4" /> {Math.max(0, time)}s
          </div>
        )}
        <div className="flex gap-4">
          <span>Score: <span className="text-highlight">{score}</span></span>
          <span className="hidden text-muted-foreground sm:inline">Best: {best}</span>
        </div>
      </header>
      <div className="relative flex min-h-0 flex-1 flex-col gap-2 sm:flex-row sm:gap-3">
        <CoinPanel coin={known} side="known" />
        <div className="pointer-events-none absolute left-1/2 top-1/2 z-40 -translate-x-1/2 -translate-y-1/2">
          <div className={cn("flex h-14 w-14 items-center justify-center rounded-full border-4 border-background font-display text-lg font-extrabold transition-colors sm:h-20 sm:w-20 sm:text-2xl",
            result === "correct" ? "bg-primary text-primary-foreground" : result === "wrong" ? "bg-destructive" : "bg-foreground text-background")}>
            {result === "correct" ? "✓" : result === "wrong" ? "✗" : "VS"}
          </div>
        </div>
        <CoinPanel key={challenger.id} coin={challenger} side="challenger" versus={known} revealed={phase === "reveal"} disabled={phase !== "guess"} result={result} onGuess={guess} />
      </div>
      <p className="text-center text-[10px] text-muted-foreground">Approx. peak market caps · historical estimates for entertainment, not verified ATHs</p>
    </div>
  );
}

const RANK_ICON = { exit: Skull, jeet: TrendingDown, veteran: Shield, legend: Crown };

function RankBadge({ score }: { score: number }) {
  const r = rankFor(score);
  const Icon = RANK_ICON[r.id];
  return (
    <div className={cn(`rank-${r.id}`, "animate-badge")}>
      <div className="rank-shine relative flex items-center gap-3 overflow-hidden rounded-2xl border-2 border-[var(--rank)] bg-[color-mix(in_oklab,var(--rank)_14%,var(--overlay))] px-5 py-3 text-[var(--rank)]">
        <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[var(--rank)] text-background">
          <Icon className={cn("h-6 w-6", r.id === "legend" && "animate-bob")} strokeWidth={2.5} />
        </span>
        <span className="text-left">
          <span className="block text-[10px] font-bold uppercase tracking-[0.25em] text-muted-foreground">Trench rank</span>
          <span className="block font-display text-2xl font-extrabold leading-tight sm:text-3xl">{r.name}</span>
        </span>
      </div>
    </div>
  );
}

function GameOver({ score, reason, mode, pool, onAgain, onMenu }: { score: number; reason: string; mode: Mode; pool: Pool; onAgain: () => void; onMenu: () => void }) {
  const s = stats(mode, pool);
  const r = rankFor(score);
  const url = typeof window !== "undefined" ? window.location.origin : brand.siteUrl;
  const text = `I scored ${score} on ${brand.gameName} ${r.emoji} ${r.name}. Think you know the trenches better than me?`;
  const share = `https://x.com/intent/post?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`;
  const btn = "w-full rounded-full px-8 py-4 font-display font-extrabold transition hover:scale-[1.03] active:scale-95 sm:w-auto sm:min-w-48";
  return (
    <div className="flex h-full flex-col items-center justify-center gap-3 px-6 text-center sm:gap-4">
      <p className="text-sm font-bold uppercase tracking-[0.3em] text-muted-foreground">
        {reason === "time" ? "Time's up!" : reason === "exhausted" ? "You cleared every coin!" : "Game over"}
      </p>
      <p className="font-display text-2xl font-bold sm:text-3xl">You scored</p>
      <p className="font-display text-[7rem] font-extrabold leading-none tabular-nums text-highlight animate-pop sm:text-[11rem]">{score}</p>
      <RankBadge score={score} />
      <p className="text-sm text-muted-foreground">
        Average <span className="font-bold text-foreground">{s.average.toFixed(1)}</span> · Best{" "}
        <span className="font-bold text-foreground">{s.best}</span> · {s.games} games
      </p>
      <div className="mt-2 flex w-full max-w-xs flex-col gap-3 sm:max-w-none sm:flex-row sm:justify-center">
        <button onClick={onAgain} className={cn(btn, "bg-primary text-primary-foreground")}>PLAY AGAIN</button>
        <button onClick={onMenu} className={cn(btn, "border-2 border-foreground/70 hover:bg-foreground/10")}>BACK TO MENU</button>
        <a href={share} target="_blank" rel="noreferrer" className={cn(btn, "bg-foreground text-background")}>SHARE ON 𝕏</a>
      </div>
    </div>
  );
}
