import { brand } from "@/config/brand";
import { cn } from "@/lib/utils";

function Arrow({ up, className }: { up?: boolean; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className={cn("inline-block h-[0.7em] w-[0.7em]", className)} fill="currentColor">
      {up ? <path d="M12 2 22 14h-6v8H8v-8H2z" /> : <path d="M12 22 2 10h6V2h8v8h6z" />}
    </svg>
  );
}

export function Logo({ className, size = "lg" }: { className?: string; size?: "lg" | "sm" }) {
  if (brand.logoUrl) return <img src={brand.logoUrl} alt={brand.gameName} className={cn("h-24", className)} />;
  return (
    <h1
      aria-label={brand.gameName}
      className={cn(
        "font-display font-extrabold uppercase leading-[0.85] tracking-tighter",
        size === "lg" ? "text-[clamp(3.2rem,13vw,8.5rem)]" : "text-base",
        className,
      )}
    >
      <span className="flex items-center justify-center gap-[0.08em] text-primary logo-stroke">
        PEAK <Arrow up className="animate-bob" />
      </span>
      <span className="flex items-center justify-center gap-[0.15em]">
        <span className="text-[0.45em] text-foreground">OR</span>
        <span className="flex items-center gap-[0.08em] text-destructive logo-stroke">
          JEET<span className="text-foreground">?</span> <Arrow className="animate-bob-down" />
        </span>
      </span>
    </h1>
  );
}
