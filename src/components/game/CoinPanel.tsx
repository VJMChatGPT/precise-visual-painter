import { useEffect, useState } from "react";
import { ArrowDown, ArrowUp, BookOpen, ExternalLink, X } from "lucide-react";
import { formatCap, type Coin } from "@/game/coins";
import { CoinImage } from "./CoinImage";
import { cn } from "@/lib/utils";

function CountUp({ to, ms = 900 }: { to: number; ms?: number }) {
  const [v, setV] = useState(0);
  useEffect(() => {
    let raf = 0;
    const t0 = performance.now();
    const tick = (t: number) => {
      const p = Math.min(1, (t - t0) / ms);
      setV(to * (1 - Math.pow(1 - p, 3)));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [to, ms]);
  return <>{formatCap(v)}</>;
}

type Props = {
  coin: Coin;
  side: "known" | "challenger";
  revealed?: boolean;
  disabled?: boolean;
  result?: "correct" | "wrong" | null;
  onGuess?: (g: "higher" | "lower") => void;
  versus?: Coin;
};

export function CoinPanel({ coin, side, revealed, disabled, result, onGuess, versus }: Props) {
  const [story, setStory] = useState(false);
  useEffect(() => setStory(false), [coin.id]);
  const showValue = side === "known" || revealed;

  return (
    <section
      key={coin.id}
      className={cn(
        "relative flex flex-1 flex-col items-center justify-center overflow-hidden rounded-2xl border px-4 py-4 text-center sm:py-8",
        side === "challenger" && "animate-slide",
        result === "correct" && "border-primary glow-primary",
        result === "wrong" && "border-destructive animate-shake",
      )}
    >
      {/* blurred coin art as cinematic backdrop */}
      {coin.image && (
        <img src={coin.image} alt="" aria-hidden className="absolute inset-0 -z-10 h-full w-full scale-125 object-cover opacity-40 blur-2xl" />
      )}
      <div className="absolute inset-0 -z-10 bg-gradient-to-b from-overlay/50 via-overlay/70 to-overlay/90" />

      <button
        onClick={() => setStory((s) => !s)}
        className="absolute right-3 top-3 z-20 inline-flex items-center gap-1.5 rounded-full bg-secondary px-3 py-1.5 text-xs font-semibold backdrop-blur hover:bg-foreground/20"
        aria-expanded={story}
      >
        <BookOpen className="h-3.5 w-3.5" /> The Story
      </button>

      <CoinImage coin={coin} className="h-20 w-20 text-2xl shadow-2xl sm:h-40 sm:w-40 sm:text-4xl" />
      <h2 className="mt-2 font-display text-2xl font-extrabold leading-tight sm:mt-4 sm:text-5xl">"{coin.name}"</h2>
      <p className="text-xs font-semibold tracking-widest text-muted-foreground sm:text-sm">${coin.symbol}</p>
      <p className="mt-1 text-xs text-muted-foreground sm:mt-3 sm:text-sm">
        {side === "known" ? "reached an approx. peak market cap of" : "reached a"}
      </p>

      {showValue ? (
        <p className={cn("font-display text-4xl font-extrabold tabular-nums text-highlight sm:text-7xl", revealed && "animate-pop")}>
          {revealed ? <CountUp to={coin.cap} /> : formatCap(coin.cap)}
        </p>
      ) : (
        <div className="mt-2 flex w-full max-w-xs flex-col gap-2 sm:mt-4 sm:gap-3">
          <button
            disabled={disabled}
            onClick={() => onGuess?.("higher")}
            className="flex items-center justify-center gap-2 rounded-full border-2 border-primary bg-primary py-3 font-display text-lg font-bold text-primary-foreground transition hover:scale-[1.03] disabled:opacity-60 sm:py-4"
          >
            Higher <ArrowUp className="h-5 w-5" />
          </button>
          <button
            disabled={disabled}
            onClick={() => onGuess?.("lower")}
            className="flex items-center justify-center gap-2 rounded-full border-2 border-foreground/70 py-3 font-display text-lg font-bold transition hover:scale-[1.03] hover:bg-foreground/10 disabled:opacity-60 sm:py-4"
          >
            Lower <ArrowDown className="h-5 w-5" />
          </button>
        </div>
      )}
      {side === "challenger" && versus && (
        <p className="mt-1 text-xs text-muted-foreground sm:mt-3 sm:text-sm">
          approx. peak cap than {versus.name}
        </p>
      )}

      {story && (
        <div className="absolute inset-x-3 top-12 z-30 max-h-[70%] overflow-auto rounded-xl border bg-card/95 p-4 text-left text-sm shadow-2xl backdrop-blur animate-pop">
          <div className="mb-2 flex items-center justify-between">
            <span className="font-display font-bold">The Story · ${coin.symbol}</span>
            <button onClick={() => setStory(false)} aria-label="Close story"><X className="h-4 w-4" /></button>
          </div>
          <p className="text-muted-foreground">{coin.story || "No story recorded yet."}</p>
          <div className="mt-3 flex flex-wrap gap-3 text-xs font-semibold text-highlight">
            {coin.postUrl && (
              <a href={coin.postUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 hover:underline">
                Original post <ExternalLink className="h-3 w-3" />
              </a>
            )}
            {coin.sourceUrl && (
              <a href={coin.sourceUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 hover:underline">
                Source <ExternalLink className="h-3 w-3" />
              </a>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
