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
  Bell,
  FileSpreadsheet,
  FolderOpen,
} from "lucide-react";
import { Link } from "react-router-dom";
import Modal from "../components/Modal";
import ConfirmDialog from "../components/ui/ConfirmDialog";
import { exportCsv, stampFile } from "../lib/csv";
import { formatDateTime, formatMoney } from "../lib/format";
import { AUTO_BACKUP_KEEP_OPTIONS } from "@shared/backup";
import type { AutoBackupStatus } from "../global";

const TOLERANCE_OPTIONS = [5, 10, 15, 20, 30, 45, 60];

const EMPTY_BACKUP: AutoBackupStatus = {
  enabled: false,
  folder: "",
  folderMissing: false,
  keep: 14,
  lastAt: "",
  lastPath: "",
  lastError: "",
};

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
  const [academyName, setAcademyName] = useState("هما");
  const [backup, setBackup] = useState<AutoBackupStatus>(EMPTY_BACKUP);
  const ping = useRfidStatus();

  const load = async () => {
    const list = await window.electronAPI?.rfidListPorts();
    const current = await window.electronAPI?.rfidGetPort();
    const settings = await window.electronAPI?.settingsGet();
    const auto = await window.electronAPI?.dbAutoBackupStatus();
    setPorts(list ?? []);
    setSelected(current ?? "");
    setTolerance(settings?.attendanceToleranceMinutes ?? 20);
    setLockEnabled(Boolean(settings?.lockEnabled));
    setAcademyName(settings?.academyName ?? "هما");
    if (auto) setBackup(auto);
  };

  useEffect(() => {
    void load();
  }, []);

  useEffect(() => {
    void window.electronAPI?.rfidListPorts().then((list) => {
      setPorts(list ?? []);
    });
  }, [ping]);

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
        description="اتصال کارت‌خوان، بازه حضور، پشتیبان روزانه و میانبرها."
      />

      <section className="surface-card rounded-3xl p-6 space-y-4">
        <div className="flex items-center gap-2 font-semibold text-ink">
          <Bell size={18} /> یادآوری پیامک و واتساپ
        </div>
        <p className="text-sm text-muted">
          نام آموزشگاه در متن پیام‌ها می‌آید. ارسال از صفحهٔ یادآوری‌ها با واتساپ یا پیامک سیستم انجام می‌شود.
        </p>
        <input
          className="w-full rounded-2xl border border-line px-3 py-2.5"
          value={academyName}
          onChange={(e) => setAcademyName(e.target.value)}
          placeholder="نام آموزشگاه"
        />
        <div className="flex flex-wrap gap-2">
          <button
            className="btn btn-primary"
            onClick={async () => {
              await window.electronAPI?.settingsSet({ academyName });
              toast.success("نام آموزشگاه ذخیره شد");
            }}
          >
            ذخیره نام
          </button>
          <Link to="/reminders" className="btn btn-ghost">
            صفحهٔ یادآوری‌ها
          </Link>
        </div>
      </section>

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
          وضعیت «متصل» فقط وقتی نشان داده می‌شود که پورت در سیستم باشد و باز شده
          باشد. انتخاب خودکار فقط پورت USB سریال را برمی‌دارد، نه COM داخلی و نه
          بلوتوث.
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
        {selected && !ports.some((port) => port.path === selected) && (
          <p className="text-sm text-danger">
            پورت ذخیره‌شده الان در سیستم نیست. دستگاه را وصل کنید یا پورت دیگری
            انتخاب کنید.
          </p>
        )}
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
          تأیید می‌گیرد. همین مقدار، بازهٔ زمانی تقویم جلسات را هم تعیین می‌کند.
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
          ورود Excel مشتریان قدیمی را از همین بخش یا صفحهٔ مشتریان شروع کنید.
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
          <Link to="/users?import=1" className="btn btn-ghost">
            <FileSpreadsheet size={16} /> ورود Excel
          </Link>
          <button className="btn btn-ghost" onClick={() => void exportBilling()}>
            <Download size={16} /> خروجی مالی
          </button>
        </div>

        <div className="border-t border-line pt-4 space-y-3">
          <div className="flex items-center gap-2 font-medium text-ink">
            <FolderOpen size={16} /> پشتیبان خودکار روزانه
          </div>
          <p className="text-sm text-muted leading-6">
            با باز بودن برنامه، هر روز یک فایل در پوشهٔ انتخابی نوشته می‌شود و نسخهٔ همان
            روز در طول روز به‌روز می‌شود. فقط فایل‌های روزانهٔ هما پاک می‌شوند؛ پشتیبان
            دستی سر جایش می‌ماند.
          </p>
          {backup.folder ? (
            <p className="text-xs text-muted break-all" dir="ltr">
              {backup.folder}
            </p>
          ) : (
            <p className="text-sm text-muted">هنوز پوشه‌ای انتخاب نشده است.</p>
          )}
          {backup.folderMissing && (
            <p className="text-sm text-danger">
              پوشه پیدا نشد. یک پوشهٔ جدید انتخاب کنید.
            </p>
          )}
          {backup.lastError && (
            <p className="text-sm text-danger">{backup.lastError}</p>
          )}
          <p className="text-sm text-muted">
            {backup.lastAt
              ? `آخرین پشتیبان روزانه: ${formatDateTime(backup.lastAt)}`
              : "هنوز پشتیبان روزانه گرفته نشده است."}
          </p>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className={`chip ${backup.enabled ? "chip-on" : ""}`}
              onClick={async () => {
                try {
                  await window.electronAPI?.settingsSet({
                    autoBackupEnabled: !backup.enabled,
                  });
                  toast.success(
                    backup.enabled
                      ? "پشتیبان روزانه خاموش شد"
                      : "پشتیبان روزانه روشن شد"
                  );
                  await load();
                } catch (err) {
                  toast.error(
                    err instanceof Error ? err.message : "ذخیره ناموفق بود"
                  );
                }
              }}
            >
              {backup.enabled ? "روشن" : "خاموش"}
            </button>
            {AUTO_BACKUP_KEEP_OPTIONS.map((days) => (
              <button
                key={days}
                type="button"
                className={`chip ${backup.keep === days ? "chip-on" : ""}`}
                onClick={async () => {
                  await window.electronAPI?.settingsSet({ autoBackupKeep: days });
                  toast.success(
                    `${days.toLocaleString("fa-IR")} نسخهٔ اخیر نگه داشته می‌شود`
                  );
                  await load();
                }}
              >
                {days.toLocaleString("fa-IR")} روز
              </button>
            ))}
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className="btn btn-primary"
              disabled={busy}
              onClick={async () => {
                setBusy(true);
                try {
                  const result = await window.electronAPI?.dbChooseBackupFolder();
                  if (result?.cancelled) return;
                  toast.success("پوشه ذخیره شد");
                  await load();
                } catch (err) {
                  toast.error(
                    err instanceof Error ? err.message : "انتخاب پوشه ناموفق بود"
                  );
                } finally {
                  setBusy(false);
                }
              }}
            >
              انتخاب پوشه
            </button>
            <button
              type="button"
              className="btn btn-ghost"
              disabled={busy || !backup.folder}
              onClick={async () => {
                setBusy(true);
                try {
                  const result = await window.electronAPI?.dbRunAutoBackup();
                  if (result?.ok && !result.skipped) {
                    toast.success("پشتیبان روزانه ذخیره شد");
                  } else if (result?.error) {
                    toast.error(result.error);
                  }
                  await load();
                } catch (err) {
                  toast.error(
                    err instanceof Error ? err.message : "پشتیبان ناموفق بود"
                  );
                } finally {
                  setBusy(false);
                }
              }}
            >
              گرفتن پشتیبان در پوشه
            </button>
          </div>
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
              try {
                const result = await window.electronAPI?.dbRestore();
                setRestoreOpen(false);
                if (result?.ok) {
                  toast.success("دیتابیس بازیابی شد");
                  window.setTimeout(() => window.location.reload(), 400);
                }
              } catch (err) {
                toast.error(
                  err instanceof Error ? err.message : "بازیابی ناموفق بود"
                );
              }
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
