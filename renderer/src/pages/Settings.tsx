import { useEffect, useState } from "react";
import { toast } from "react-toastify";

export default function Settings() {
  const [ports, setPorts] = useState<Array<{ path: string; manufacturer?: string }>>(
    []
  );
  const [selected, setSelected] = useState("");
  const [busy, setBusy] = useState(false);

  const load = async () => {
    const list = await window.electronAPI?.rfidListPorts();
    const current = await window.electronAPI?.rfidGetPort();
    setPorts(list ?? []);
    setSelected(current ?? "");
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <div className="max-w-2xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">تنظیمات</h1>
        <p className="text-sm text-gray-500 mt-1">
          پورت RFID و پشتیبان دیتابیس
        </p>
      </div>

      <section className="bg-white rounded-2xl border p-6 space-y-4">
        <h2 className="font-semibold">دستگاه RFID</h2>
        <select
          value={selected}
          onChange={(e) => setSelected(e.target.value)}
          className="w-full border rounded-lg p-2"
        >
          <option value="">انتخاب خودکار</option>
          {ports.map((port) => (
            <option key={port.path} value={port.path}>
              {port.path}
              {port.manufacturer ? ` — ${port.manufacturer}` : ""}
            </option>
          ))}
        </select>
        <div className="flex gap-2">
          <button
            className="px-4 py-2 rounded-lg bg-indigo-600 text-white"
            disabled={busy}
            onClick={async () => {
              setBusy(true);
              try {
                await window.electronAPI?.rfidSetPort(selected);
                toast.success("پورت ذخیره شد");
                await load();
              } catch (err) {
                toast.error(err instanceof Error ? err.message : "خطا");
              } finally {
                setBusy(false);
              }
            }}
          >
            ذخیره پورت
          </button>
          <button
            className="px-4 py-2 rounded-lg border"
            onClick={load}
          >
            تازه‌سازی لیست
          </button>
        </div>
      </section>

      <section className="bg-white rounded-2xl border p-6 space-y-4">
        <h2 className="font-semibold">دیتابیس</h2>
        <div className="flex gap-2">
          <button
            className="px-4 py-2 rounded-lg bg-emerald-600 text-white"
            onClick={async () => {
              const result = await window.electronAPI?.dbBackup();
              if (result?.ok) toast.success("پشتیبان ذخیره شد");
            }}
          >
            پشتیبان‌گیری
          </button>
          <button
            className="px-4 py-2 rounded-lg bg-amber-600 text-white"
            onClick={async () => {
              if (!confirm("بازیابی، داده‌های فعلی را جایگزین می‌کند. ادامه؟")) {
                return;
              }
              const result = await window.electronAPI?.dbRestore();
              if (result?.ok) toast.success("دیتابیس بازیابی شد");
            }}
          >
            بازیابی
          </button>
        </div>
      </section>
    </div>
  );
}
