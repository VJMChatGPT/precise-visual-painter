import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { Info, Play, Timer } from "lucide-react";
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
      { title: "MemeCap — Memecoin Higher or Lower" },
      { name: "description", content: "Guess which memecoin reached the higher peak market cap. Classic and Beat the Clock modes." },
      { property: "og:title", content: "MemeCap — Memecoin Higher or Lower" },
      { property: "og:description", content: "Which memecoin reached the higher peak market cap? Test your degen instincts." },
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
  return (
    <div className="flex h-full flex-col items-center justify-center gap-6 px-6 text-center">
      <Logo className="animate-pop" />
      <p className="max-w-lg font-display text-xl font-semibold sm:text-2xl">{brand.tagline}</p>
      <div className="flex flex-col gap-3 sm:flex-row">
        <button onClick={() => onStart("classic")} className="flex min-w-56 items-center justify-center gap-3 rounded-full bg-primary px-8 py-4 font-display text-lg font-extrabold tracking-wide text-primary-foreground glow-primary transition hover:scale-105">
          CLASSIC <Play className="h-5 w-5 fill-current" />
        </button>
        <button onClick={() => onStart("clock")} className="flex min-w-56 items-center justify-center gap-3 rounded-full bg-primary px-8 py-4 font-display text-lg font-extrabold tracking-wide text-primary-foreground glow-primary transition hover:scale-105">
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
    setTimeout(() => setResult(ok ? "correct" : "wrong"), 900);
    setTimeout(() => {
      if (!ok) return finish(score, "wrong");
      const ns = score + 1;
      setScore(ns);
      const next = pickNext(challenger, unused, ns);
      if (!next) return finish(ns, "exhausted");
      setState({ known: challenger, challenger: next, unused: unused.filter((c) => c.id !== next.id) });
      setResult(null);
      setPhase("guess");
    }, 1900);
  };

  return (
    <div className="flex h-full flex-col gap-2 p-2 sm:gap-3 sm:p-4">
      <header className="flex items-center justify-between px-2 font-display text-sm font-bold sm:text-base">
        <button onClick={onQuit} className="text-muted-foreground hover:text-foreground">← {brand.gameName}</button>
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

function comment(score: number) {
  if (score === 0) return "Rugged on the first candle. 🪦";
  if (score < 3) return "Paper hands. The trenches are calling.";
  if (score < 6) return "Not bad, anon. Mid-cap energy.";
  if (score < 10) return "Certified chart reader. 📈";
  if (score < 15) return "Whale behaviour. Respect.";
  return "Absolute degen legend. Touch grass? Never.";
}

function GameOver({ score, reason, mode, pool, onAgain, onMenu }: { score: number; reason: string; mode: Mode; pool: Pool; onAgain: () => void; onMenu: () => void }) {
  const s = stats(mode, pool);
  const url = typeof window !== "undefined" ? window.location.origin : brand.siteUrl;
  const text = `I scored ${score} on ${brand.gameName}${mode === "clock" ? " (Beat the Clock)" : ""} — which memecoin pumped harder? 🚀`;
  const share = `https://x.com/intent/post?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`;
  return (
    <div className="flex h-full flex-col items-center justify-center gap-4 px-6 text-center">
      <p className="text-sm font-bold uppercase tracking-[0.3em] text-muted-foreground">
        {reason === "time" ? "Time's up!" : reason === "exhausted" ? "You cleared every coin!" : "Game over"}
      </p>
      <p className="font-display text-3xl font-bold">You scored:</p>
      <p className="font-display text-[9rem] font-extrabold leading-none text-highlight glow-highlight animate-pop sm:text-[12rem]">{score}</p>
      <p className="font-display text-xl">{comment(score)}</p>
      <p className="text-sm text-muted-foreground">
        Average <span className="font-bold text-foreground">{s.average.toFixed(1)}</span> · Best{" "}
        <span className="font-bold text-foreground">{s.best}</span> · {s.games} games
      </p>
      <div className="mt-2 flex flex-col gap-3 sm:flex-row">
        <button onClick={onAgain} className="min-w-48 rounded-full bg-primary px-8 py-4 font-display font-extrabold text-primary-foreground glow-primary transition hover:scale-105">PLAY AGAIN</button>
        <button onClick={onMenu} className="min-w-48 rounded-full border-2 border-foreground/70 px-8 py-4 font-display font-extrabold transition hover:bg-foreground/10">BACK TO MENU</button>
        <a href={share} target="_blank" rel="noreferrer" className="min-w-48 rounded-full bg-foreground px-8 py-4 font-display font-extrabold text-background transition hover:scale-105">SHARE ON 𝕏</a>
      </div>
    </div>
  );
}
