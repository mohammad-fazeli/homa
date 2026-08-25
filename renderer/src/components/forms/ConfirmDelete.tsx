export default function ConfirmDelete({
  onConfirm,
  onCancel,
}: {
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="relative bg-white rounded-2xl p-6 max-w-md w-[28rem] shadow-xl space-y-4 text-center">
      <h2 className="text-lg font-semibold text-red-600">حذف کاربر</h2>
      <p className="text-slate-600">
        آیا از حذف این کاربر مطمئن هستید؟ این عملیات قابل بازگشت نیست.
      </p>
      <div className="flex items-center justify-center gap-3 pt-2">
        <button
          onClick={onCancel}
          className="px-4 py-2 rounded-lg border bg-white hover:bg-slate-100"
        >
          انصراف
        </button>
        <button
          onClick={onConfirm}
          className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 shadow"
        >
          حذف قطعی
        </button>
      </div>
    </div>
  );
}
