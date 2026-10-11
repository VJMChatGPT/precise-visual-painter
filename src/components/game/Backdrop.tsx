import { COINS } from "@/game/coins";
import { CoinImage } from "./CoinImage";

// Background: slow-scrolling mosaic of real coin art from the dataset. Only place the backdrop lives.
const withArt = COINS.filter((c) => c.image);
const COLS = 7;
const columns = Array.from({ length: COLS }, (_, i) => {
  const list = withArt.length ? withArt : COINS;
  const col = Array.from({ length: 8 }, (_, j) => list[(i * 5 + j * 3) % list.length]!);
  return [...col, ...col];
});

export function Backdrop({ floating = true }: { floating?: boolean }) {
  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-background">
      <div className="absolute inset-[-10%] flex -rotate-6 justify-center gap-4 sm:gap-6">
        {columns.map((col, i) => (
          <div
            key={i}
            className={i % 2 ? "flex animate-scroll-down flex-col gap-4 sm:gap-6" : "flex animate-scroll-up flex-col gap-4 sm:gap-6"}
            style={{ animationDuration: `${60 + i * 7}s`, animationPlayState: floating ? "running" : "paused" }}
          >
            {col.map((c, j) => (
              <CoinImage key={j} coin={c} className="h-20 w-20 shrink-0 grayscale-[35%] sm:h-32 sm:w-32" />
            ))}
          </div>
        ))}
      </div>
      <div className="absolute inset-0 bg-overlay/80" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,var(--overlay)_75%)]" />
    </div>
  );
}
