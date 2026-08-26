import { initials, userHue } from "../../lib/format";
import { cn } from "../../lib/utils";

export default function Avatar({
  firstName,
  lastName,
  size = "md",
}: {
  firstName: string;
  lastName: string;
  size?: "sm" | "md" | "lg" | "xl";
}) {
  const hue = userHue(firstName.length * 13 + lastName.length * 29);
  const sizes = {
    sm: "w-8 h-8 text-xs",
    md: "w-10 h-10 text-sm",
    lg: "w-12 h-12 text-base",
    xl: "w-16 h-16 text-xl",
  };

  return (
    <div
      className={cn(
        "rounded-2xl flex items-center justify-center font-bold text-white shrink-0",
        sizes[size]
      )}
      style={{
        background: `linear-gradient(145deg, hsl(${hue} 38% 42%), hsl(${(hue + 28) % 360} 46% 28%))`,
      }}
    >
      {initials(firstName, lastName)}
    </div>
  );
}
