export default function PageHeader({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: React.ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
      <div>
        {eyebrow && (
          <p className="text-xs font-medium text-gold mb-1">{eyebrow}</p>
        )}
        <h1 className="text-2xl font-bold text-ink">{title}</h1>
        {description && (
          <p className="text-sm text-muted mt-1 max-w-xl">{description}</p>
        )}
      </div>
      {actions && (
        <div className="flex flex-wrap items-center gap-2">{actions}</div>
      )}
    </div>
  );
}
