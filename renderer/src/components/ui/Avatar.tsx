import { useEffect, useState } from "react";
import { initials, userHue } from "../../lib/format";
import { cn } from "../../lib/utils";

export default function Avatar({
  firstName,
  lastName,
  photoUrl,
  size = "md",
}: {
  firstName: string;
  lastName: string;
  photoUrl?: string | null;
  size?: "sm" | "md" | "lg" | "xl";
}) {
  const [broken, setBroken] = useState(false);
  useEffect(() => {
    setBroken(false);
  }, [photoUrl]);
  const hue = userHue(firstName.length * 13 + lastName.length * 29);
  const sizes = {
    sm: "w-8 h-8 text-xs",
    md: "w-10 h-10 text-sm",
    lg: "w-12 h-12 text-base",
    xl: "w-16 h-16 text-xl",
  };

  const className = cn(
    "rounded-2xl flex items-center justify-center font-bold text-white shrink-0 overflow-hidden",
    sizes[size]
  );

  if (photoUrl && !broken) {
    return (
      <img
        src={photoUrl}
        alt={`${firstName} ${lastName}`}
        className={cn(className, "object-cover bg-paper")}
        onError={() => setBroken(true)}
      />
    );
  }

  return (
    <div
      className={className}
      style={{
        background: `linear-gradient(145deg, hsl(${hue} 38% 42%), hsl(${(hue + 28) % 360} 46% 28%))`,
      }}
    >
      {initials(firstName, lastName)}
    </div>
  );
}
