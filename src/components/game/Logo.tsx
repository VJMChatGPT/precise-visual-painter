import { brand } from "@/config/brand";
import { cn } from "@/lib/utils";

export function Logo({ className }: { className?: string }) {
  if (brand.logoUrl) return <img src={brand.logoUrl} alt={brand.gameName} className={cn("h-24", className)} />;
  const name = brand.gameName;
  const half = Math.ceil(name.length / 2);
  return (
    <h1 className={cn("font-display text-6xl font-extrabold tracking-tight sm:text-8xl", className)}>
      <span className="text-primary">▲</span>
      {name.slice(0, half)}
      <span className="text-highlight glow-highlight">{name.slice(half)}</span>
      <span className="text-destructive">▼</span>
    </h1>
  );
}
