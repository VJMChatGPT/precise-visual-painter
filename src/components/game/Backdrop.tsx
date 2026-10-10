import bg from "@/assets/bg.jpg";
import { COINS } from "@/game/coins";
import { CoinImage } from "./CoinImage";

// Swap `bg` for a GIF/video later — this is the only place the home background lives.
export function Backdrop({ floating = true }: { floating?: boolean }) {
  const floaters = COINS.filter((c) => c.image).slice(0, 6);
  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <img src={bg} alt="" width={1920} height={1088} className="h-full w-full object-cover animate-kenburns" />
      {floating && (
        <div className="absolute inset-0">
          {floaters.map((c, i) => (
            <div
              key={c.id}
              className="absolute animate-floaty opacity-40"
              style={{ left: `${8 + ((i * 17) % 84)}%`, top: `${10 + ((i * 29) % 75)}%`, animationDelay: `${i * 0.9}s` }}
            >
              <CoinImage coin={c} className="h-14 w-14 sm:h-20 sm:w-20" />
            </div>
          ))}
        </div>
      )}
      <div className="absolute inset-0 bg-overlay/75" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_20%,var(--overlay)_85%)]" />
    </div>
  );
}
