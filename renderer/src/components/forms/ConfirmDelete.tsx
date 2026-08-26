import ConfirmDialog from "../ui/ConfirmDialog";

export default function ConfirmDelete({
  onConfirm,
  onCancel,
}: {
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <ConfirmDialog
      title="حذف مشتری"
      description="این کار دوره‌ها و جلسات را هم پاک می‌کند و قابل بازگشت نیست."
      confirmLabel="حذف قطعی"
      onConfirm={onConfirm}
      onCancel={onCancel}
    />
  );
}
