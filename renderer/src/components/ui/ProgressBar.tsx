import { cn } from "../../lib/utils";

export default function ProgressBar({
  value,
  max,
  tone = "brand",
}: {
  value: number;
  max: number;
  tone?: "brand" | "gold" | "danger";
}) {
  const pct = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0;
  const colors = {
    brand: "bg-brand",
    gold: "bg-gold",
    danger: "bg-danger",
  };

  return (
    <div className="h-1.5 w-full rounded-full bg-line overflow-hidden">
      <div
        className={cn("h-full rounded-full transition-all", colors[tone])}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}
