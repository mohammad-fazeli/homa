export default function ConfirmDialog({
  title,
  description,
  confirmLabel = "تأیید",
  cancelLabel = "انصراف",
  tone = "danger",
  busy,
  onConfirm,
  onCancel,
}: {
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: "danger" | "gold" | "brand";
  busy?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const tones = {
    danger: "btn-danger",
    gold: "btn-gold",
    brand: "btn-primary",
  };

  return (
    <div className="relative bg-surface rounded-3xl p-6 max-w-md w-[28rem] shadow-xl space-y-4 text-center">
      <h2
        className={`text-lg font-semibold ${
          tone === "danger" ? "text-danger" : "text-ink"
        }`}
      >
        {title}
      </h2>
      <p className="text-muted text-sm leading-7">{description}</p>
      <div className="flex items-center justify-center gap-3 pt-2">
        <button type="button" onClick={onCancel} className="btn btn-ghost">
          {cancelLabel}
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={onConfirm}
          className={`btn ${tones[tone]} disabled:opacity-60`}
        >
          {busy ? "لطفاً صبر کنید..." : confirmLabel}
        </button>
      </div>
    </div>
  );
}
