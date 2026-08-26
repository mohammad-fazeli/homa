import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import PageHeader from "../components/ui/PageHeader";
import { useRfidStatus } from "../components/useRfidStatus";
import {
  Wifi,
  WifiOff,
  Database,
  Usb,
  Keyboard,
  Clock,
  Download,
} from "lucide-react";
import Modal from "../components/Modal";
import ConfirmDialog from "../components/ui/ConfirmDialog";
import { exportCsv, stampFile } from "../lib/csv";
import { formatDateTime, formatMoney } from "../lib/format";

const TOLERANCE_OPTIONS = [5, 10, 15, 20, 30, 45, 60];

export default function Settings() {
  const [ports, setPorts] = useState<
    Array<{ path: string; manufacturer?: string }>
  >([]);
  const [selected, setSelected] = useState("");
  const [busy, setBusy] = useState(false);
  const [tolerance, setTolerance] = useState(20);
  const [restoreOpen, setRestoreOpen] = useState(false);
  const [lockEnabled, setLockEnabled] = useState(false);
  const [pin, setPin] = useState("");
  const ping = useRfidStatus();

  const load = async () => {
    const list = await window.electronAPI?.rfidListPorts();
    const current = await window.electronAPI?.rfidGetPort();
    const settings = await window.electronAPI?.settingsGet();
    setPorts(list ?? []);
    setSelected(current ?? "");
    setTolerance(settings?.attendanceToleranceMinutes ?? 20);
    setLockEnabled(Boolean(settings?.lockEnabled));
  };

  useEffect(() => {
    void load();
  }, []);

  const exportCustomers = async () => {
    const result = await window.electronAPI?.getUsers(1, 5000, "", "all");
    exportCsv(
      stampFile("customers"),
      ["نام", "نام خانوادگی", "تلفن", "کد ملی", "کارت", "باقی‌مانده"],
      (result?.data ?? []).map((user) => [
        user.firstName,
        user.lastName,
        user.phone,
        user.nationalId,
        user.hasCard ? "دارد" : "ندارد",
        user.remainingSessions,
      ])
    );
    toast.success("فهرست مشتریان ذخیره شد");
  };

  const exportBilling = async () => {
    const [summary, logs] = await Promise.all([
      window.electronAPI?.billingGetSummary(),
      window.electronAPI?.billingGetRecentLogs(500),
    ]);
    exportCsv(
      stampFile("billing"),
      ["مشتری", "تغییر", "توضیح", "تاریخ"],
      [
        [
          "خلاصه",
          summary?.totalRevenue ?? 0,
          `میانگین دوره ${formatMoney(summary?.avgCoursePrice ?? 0)}`,
          "",
        ],
        ...(logs ?? []).map((log) => [
          log.userFullName,
          log.change,
          log.description ?? "",
          log.date ? formatDateTime(log.date) : "",
        ]),
      ]
    );
    toast.success("گزارش مالی ذخیره شد");
  };

  return (
    <div className="max-w-3xl space-y-6">
      <PageHeader
        eyebrow="سامانه"
        title="تنظیمات"
        description="اتصال کارت‌خوان، بازه حضور، پشتیبان‌گیری و میانبرها."
      />

      <section className="surface-card rounded-3xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 font-semibold text-ink">
            <Usb size={18} /> دستگاه RFID
          </div>
          <span
            className={`inline-flex items-center gap-1 text-sm ${
              ping === "online" ? "text-success" : "text-danger"
            }`}
          >
            {ping === "online" ? <Wifi size={16} /> : <WifiOff size={16} />}
            {ping === "online" ? "متصل" : "قطع"}
          </span>
        </div>
        <p className="text-sm text-muted">
          اگر پورتی انتخاب نشود، اولین پورت غیر بلوتوث به‌صورت خودکار استفاده می‌شود.
        </p>
        <select
          value={selected}
          onChange={(e) => setSelected(e.target.value)}
          className="w-full border border-line rounded-2xl p-3 bg-surface outline-none focus:border-brand"
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
            className="btn btn-primary disabled:opacity-60"
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
          <button className="btn btn-ghost" onClick={() => void load()}>
            تازه‌سازی فهرست
          </button>
        </div>
      </section>

      <section className="surface-card rounded-3xl p-6 space-y-4">
        <div className="flex items-center gap-2 font-semibold text-ink">
          قفل برنامه
        </div>
        <p className="text-sm text-muted">
          برای میز منشی، ورود با رمز ۴ رقمی از خواندن داده‌ها توسط دیگران جلوگیری می‌کند.
        </p>
        <input
          type="password"
          inputMode="numeric"
          value={pin}
          onChange={(e) => setPin(e.target.value)}
          placeholder="رمز جدید"
          className="w-full rounded-2xl border border-line px-3 py-2.5"
        />
        <div className="flex flex-wrap gap-2">
          <button
            className="btn btn-primary"
            onClick={async () => {
              await window.electronAPI?.settingsSetPin(pin);
              setPin("");
              setLockEnabled(true);
              toast.success("رمز ذخیره شد");
            }}
          >
            ذخیره رمز
          </button>
          {lockEnabled && (
            <button
              className="btn btn-ghost"
              onClick={async () => {
                await window.electronAPI?.settingsClearPin();
                setLockEnabled(false);
                toast.success("قفل برداشته شد");
              }}
            >
              حذف قفل
            </button>
          )}
        </div>
      </section>

      <section className="surface-card rounded-3xl p-6 space-y-4">
        <div className="flex items-center gap-2 font-semibold text-ink">
          <Clock size={18} /> بازه ثبت حضور
        </div>
        <p className="text-sm text-muted">
          اگر کارت بیرون از این بازه نسبت به ساعت جلسه خوانده شود، ثبت دستی از شما
          تأیید می‌گیرد.
        </p>
        <div className="flex flex-wrap gap-2">
          {TOLERANCE_OPTIONS.map((minutes) => (
            <button
              key={minutes}
              type="button"
              className={`chip ${tolerance === minutes ? "chip-on" : ""}`}
              onClick={async () => {
                setTolerance(minutes);
                await window.electronAPI?.settingsSet({
                  attendanceToleranceMinutes: minutes,
                });
                toast.success(
                  `بازه به ${minutes.toLocaleString("fa-IR")} دقیقه تغییر کرد`
                );
              }}
            >
              {minutes.toLocaleString("fa-IR")} دقیقه
            </button>
          ))}
        </div>
      </section>

      <section className="surface-card rounded-3xl p-6 space-y-4">
        <div className="flex items-center gap-2 font-semibold text-ink">
          <Database size={18} /> پایگاه داده
        </div>
        <p className="text-sm text-muted">
          پیش از بازیابی، از داده‌های فعلی نسخهٔ پشتیبان بگیرید. بازیابی همه چیز را جایگزین می‌کند.
        </p>
        <div className="flex flex-wrap gap-2">
          <button
            className="btn btn-success"
            onClick={async () => {
              const result = await window.electronAPI?.dbBackup();
              if (result?.ok) toast.success("پشتیبان ذخیره شد");
            }}
          >
            پشتیبان‌گیری
          </button>
          <button className="btn btn-gold" onClick={() => setRestoreOpen(true)}>
            بازیابی
          </button>
          <button className="btn btn-ghost" onClick={() => void exportCustomers()}>
            <Download size={16} /> خروجی مشتریان
          </button>
          <button className="btn btn-ghost" onClick={() => void exportBilling()}>
            <Download size={16} /> خروجی مالی
          </button>
        </div>
      </section>

      <section className="surface-card rounded-3xl p-6 space-y-3">
        <div className="flex items-center gap-2 font-semibold text-ink">
          <Keyboard size={18} /> میانبرهای کیبورد
        </div>
        <div className="grid sm:grid-cols-2 gap-2 text-sm">
          <Shortcut keys="Ctrl + K" label="جستجوی سراسری" />
          <Shortcut keys="Ctrl + N" label="مشتری جدید" />
          <Shortcut keys="Esc" label="بستن پنجره و پالت" />
          <Shortcut keys="Ctrl + Shift + K" label="کیوسک حضور" />
        </div>
      </section>

      <section className="surface-card rounded-3xl p-6">
        <h2 className="font-semibold text-ink mb-2">درباره هما</h2>
        <p className="text-sm text-muted leading-7">
          نرم‌افزار دسکتاپ مدیریت مشتریان، جلسات و مالی آموزشگاه. حضور با کارت RFID
          یا به‌صورت دستی ثبت می‌شود و همه داده‌ها روی همین رایانه می‌ماند.
        </p>
      </section>

      {restoreOpen && (
        <Modal onClose={() => setRestoreOpen(false)}>
          <ConfirmDialog
            tone="gold"
            title="بازیابی پایگاه داده"
            description="داده‌های فعلی به‌طور کامل جایگزین می‌شود. این کار قابل بازگشت نیست مگر پشتیبان جداگانه‌ای داشته باشید."
            confirmLabel="بازیابی"
            onCancel={() => setRestoreOpen(false)}
            onConfirm={async () => {
              const result = await window.electronAPI?.dbRestore();
              setRestoreOpen(false);
              if (result?.ok) toast.success("دیتابیس بازیابی شد");
            }}
          />
        </Modal>
      )}
    </div>
  );
}

function Shortcut({ keys, label }: { keys: string; label: string }) {
  return (
    <div className="flex items-center justify-between rounded-2xl border border-line px-3 py-2">
      <span className="text-muted">{label}</span>
      <kbd className="kbd">{keys}</kbd>
    </div>
  );
}
