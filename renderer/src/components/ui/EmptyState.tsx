import { cn } from "../../lib/utils";

export default function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: {
  icon: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center text-center py-12 px-6",
        className
      )}
    >
      <div className="w-14 h-14 rounded-2xl bg-brand-soft text-brand flex items-center justify-center mb-4">
        {icon}
      </div>
      <h3 className="font-semibold text-ink">{title}</h3>
      {description && (
        <p className="text-sm text-muted mt-1 max-w-sm">{description}</p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
