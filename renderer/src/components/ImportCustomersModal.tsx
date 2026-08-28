import { useMemo, useState } from "react";
import { toast } from "react-toastify";
import { Download, FileSpreadsheet, Upload } from "lucide-react";
import Modal from "./Modal";
import { formatMoney } from "../lib/format";
import { emitAppDataChange } from "../lib/bus";
import type { CustomerImportPreview, CustomerImportRow } from "@shared/import-customers";

export default function ImportCustomersModal({
  onClose,
  onImported,
}: {
  onClose: () => void;
  onImported: () => void;
}) {
  const [busy, setBusy] = useState(false);
  const [fileName, setFileName] = useState("");
  const [preview, setPreview] = useState<CustomerImportPreview | null>(null);
  const [result, setResult] = useState<{
    imported: number;
    skipped: number;
    failed: Array<{ rowNumber: number; message: string }>;
  } | null>(null);

  const problems = useMemo(
    () =>
      (preview?.rows ?? []).filter(
        (row) => row.status === "error" || row.status === "duplicate"
      ),
    [preview]
  );
  const readySample = useMemo(
    () => (preview?.rows ?? []).filter((row) => row.status === "ready").slice(0, 8),
    [preview]
  );

  const pickFile = async () => {
    setBusy(true);
    try {
      const response = await window.electronAPI?.importCustomersPreview();
      if (!response || response.cancelled) return;
      if (!response.preview) {
        toast.error("خواندن فایل ناموفق بود");
        return;
      }
      setFileName(response.fileName ?? "فایل");
      setPreview(response.preview);
      setResult(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "خواندن فایل ناموفق بود");
    } finally {
      setBusy(false);
    }
  };

  const saveTemplate = async () => {
    setBusy(true);
    try {
      const response = await window.electronAPI?.importCustomersTemplate();
      if (response?.ok) toast.success("قالب ذخیره شد");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "ذخیره قالب ناموفق بود");
    } finally {
      setBusy(false);
    }
  };

  const commit = async () => {
    if (!preview || preview.readyCount < 1) return;
    setBusy(true);
    try {
      const next = await window.electronAPI?.importCustomersCommit();
      if (!next) return;
      setResult(next);
      if (next.imported > 0) {
        emitAppDataChange();
        onImported();
        toast.success(
          `${next.imported.toLocaleString("fa-IR")} مشتری وارد شد`
        );
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "ورود ناموفق بود");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal onClose={onClose}>
      <div className="relative bg-surface rounded-3xl p-6 w-[44rem] max-w-[92vw] space-y-4">
        <div>
          <p className="text-xs text-gold font-medium">دفتر مشتریان</p>
          <h2 className="text-lg font-bold text-ink">وارد کردن از Excel</h2>
          <p className="text-sm text-muted mt-1 leading-6">
            فایل اکسل یا CSV مشتریان قدیمی را انتخاب کنید. ردیف‌های تکراری و نامعتبر رد
            می‌شوند. اگر ستون پرداخت خالی باشد بدهی می‌ماند. جلسات تقویم از این فایل ساخته
            نمی‌شود؛ ستون باقی‌مانده اعتبار دوره است.
          </p>
        </div>

        {result ? (
          <div className="space-y-3">
            <div className="grid grid-cols-3 gap-2">
              <Stat label="واردشده" value={result.imported} tone="success" />
              <Stat label="تکراری ردشده" value={result.skipped} tone="gold" />
              <Stat label="ناموفق" value={result.failed.length} tone="danger" />
            </div>
            {result.failed.length > 0 && (
              <ul className="max-h-40 overflow-auto text-sm space-y-1 border border-line rounded-2xl p-3">
                {result.failed.map((item) => (
                  <li key={`${item.rowNumber}-${item.message}`}>
                    ردیف {item.rowNumber.toLocaleString("fa-IR")}: {item.message}
                  </li>
                ))}
              </ul>
            )}
            <div className="flex justify-end gap-2">
              <button type="button" className="btn btn-primary" onClick={onClose}>
                بستن
              </button>
            </div>
          </div>
        ) : !preview ? (
          <div className="space-y-4">
            <div className="rounded-2xl border border-dashed border-line bg-paper px-4 py-6 text-center space-y-2">
              <FileSpreadsheet className="mx-auto text-brand" size={28} />
              <p className="text-sm text-muted">
                ستون‌های قابل تشخیص: نام، نام خانوادگی، تلفن، کد ملی، کارت، یادداشت، دوره،
                هزینه، جلسات، باقی‌مانده، پرداخت
              </p>
            </div>
            <div className="flex flex-wrap justify-end gap-2">
              <button
                type="button"
                className="btn btn-ghost"
                disabled={busy}
                onClick={() => void saveTemplate()}
              >
                <Download size={16} /> دانلود قالب
              </button>
              <button type="button" className="btn btn-ghost" onClick={onClose}>
                انصراف
              </button>
              <button
                type="button"
                className="btn btn-primary"
                disabled={busy}
                onClick={() => void pickFile()}
              >
                <Upload size={16} /> {busy ? "در حال خواندن..." : "انتخاب فایل"}
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-ink">
              <span className="font-medium">{fileName}</span>
              {preview.usedDefaultHeaders && (
                <span className="text-muted"> · سرستون پیدا نشد؛ ترتیب قالب فرض شد</span>
              )}
            </p>
            {preview.missingRequired.length > 0 && (
              <p className="text-sm text-danger">
                ستون‌های لازم نیست: {preview.missingRequired.join("، ")}
              </p>
            )}
            <div className="grid grid-cols-3 gap-2">
              <Stat label="آماده ورود" value={preview.readyCount} tone="success" />
              <Stat label="تکراری" value={preview.duplicateCount} tone="gold" />
              <Stat label="خطا" value={preview.errorCount} tone="danger" />
            </div>
            {problems.length > 0 && (
              <RowList
                title="ردیف‌هایی که وارد نمی‌شوند"
                rows={problems.slice(0, 12)}
                extra={Math.max(0, problems.length - 12)}
              />
            )}
            {readySample.length > 0 && (
              <RowList
                title="نمونه ردیف‌های آماده"
                rows={readySample}
                extra={Math.max(0, preview.readyCount - readySample.length)}
              />
            )}
            <div className="flex flex-wrap justify-end gap-2">
              <button
                type="button"
                className="btn btn-ghost"
                disabled={busy}
                onClick={() => void pickFile()}
              >
                فایل دیگر
              </button>
              <button type="button" className="btn btn-ghost" onClick={onClose}>
                انصراف
              </button>
              <button
                type="button"
                className="btn btn-primary"
                disabled={busy || preview.readyCount < 1}
                onClick={() => void commit()}
              >
                {busy
                  ? "در حال ورود..."
                  : `ورود ${preview.readyCount.toLocaleString("fa-IR")} مشتری`}
              </button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}

function Stat({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: "success" | "gold" | "danger";
}) {
  const color =
    tone === "success"
      ? "text-success"
      : tone === "gold"
        ? "text-gold"
        : "text-danger";
  return (
    <div className="rounded-2xl border border-line bg-paper px-3 py-2">
      <div className="text-xs text-muted">{label}</div>
      <div className={`text-lg font-bold ${color}`}>
        {value.toLocaleString("fa-IR")}
      </div>
    </div>
  );
}

function RowList({
  title,
  rows,
  extra,
}: {
  title: string;
  rows: CustomerImportRow[];
  extra: number;
}) {
  return (
    <div className="space-y-2">
      <p className="text-xs text-muted">{title}</p>
      <ul className="max-h-44 overflow-auto text-sm border border-line rounded-2xl divide-y divide-line">
        {rows.map((row) => (
          <li key={`${row.rowNumber}-${row.status}`} className="px-3 py-2">
            <div className="flex items-start justify-between gap-3">
              <span className="text-ink">
                ردیف {row.rowNumber.toLocaleString("fa-IR")}
                {row.draft
                  ? ` · ${row.draft.firstName} ${row.draft.lastName}`
                  : ""}
              </span>
              {row.status === "ready" && row.draft?.course && (
                <span className="text-xs text-muted shrink-0">
                  {row.draft.course.sessions.toLocaleString("fa-IR")} جلسه
                  {row.draft.course.cost
                    ? ` · ${formatMoney(row.draft.course.cost)}`
                    : ""}
                </span>
              )}
            </div>
            {row.message && (
              <p
                className={`text-xs mt-0.5 ${
                  row.status === "duplicate" ? "text-gold" : "text-danger"
                }`}
              >
                {row.message}
              </p>
            )}
          </li>
        ))}
      </ul>
      {extra > 0 && (
        <p className="text-xs text-muted">
          و {extra.toLocaleString("fa-IR")} مورد دیگر
        </p>
      )}
    </div>
  );
}
