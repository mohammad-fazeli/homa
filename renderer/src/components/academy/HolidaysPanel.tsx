import { useMemo, useState } from "react";
import { toast } from "react-toastify";
import { CalendarOff, Plus, Trash2 } from "lucide-react";
import { WEEKDAY_LABELS, localDayKey } from "@shared/dates";
import { dayKeyToDate, parseDayKey } from "@shared/holidays";
import { emitAppDataChange } from "../../lib/bus";
import { toDateInputValue } from "../../lib/format";
import type { AcademyHoliday } from "../../global";

function formatHolidayDay(dayKey: string) {
  const date = dayKeyToDate(dayKey);
  if (!date) return dayKey;
  return date.toLocaleDateString("fa-IR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export default function HolidaysPanel({
  holidays,
  closedWeekdays,
  onSaved,
}: {
  holidays: AcademyHoliday[];
  closedWeekdays: number[];
  onSaved: () => Promise<void>;
}) {
  const [dayKey, setDayKey] = useState(toDateInputValue());
  const [title, setTitle] = useState("");
  const today = localDayKey();

  const { upcoming, past } = useMemo(() => {
    const upcomingItems = holidays
      .filter((item) => item.dayKey >= today)
      .sort((a, b) => a.dayKey.localeCompare(b.dayKey));
    const pastItems = holidays
      .filter((item) => item.dayKey < today)
      .sort((a, b) => b.dayKey.localeCompare(a.dayKey));
    return { upcoming: upcomingItems, past: pastItems };
  }, [holidays, today]);

  const toggleWeekday = async (day: number) => {
    const next = closedWeekdays.includes(day)
      ? closedWeekdays.filter((item) => item !== day)
      : [...closedWeekdays, day];
    try {
      await window.electronAPI?.academySetClosedWeekdays(next);
      toast.success("تعطیلی هفتگی ذخیره شد");
      emitAppDataChange();
      await onSaved();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "خطا");
    }
  };

  const removeHoliday = async (id: number) => {
    try {
      await window.electronAPI?.academyDeleteHoliday(id);
      emitAppDataChange();
      await onSaved();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "خطا");
    }
  };

  return (
    <div className="grid lg:grid-cols-[20rem_1fr] gap-4">
      <form
        className="surface-card rounded-3xl p-5 space-y-3"
        onSubmit={async (e) => {
          e.preventDefault();
          const parsed = parseDayKey(dayKey);
          if (!parsed) {
            toast.error("تاریخ را درست وارد کنید");
            return;
          }
          try {
            await window.electronAPI?.academySaveHoliday({
              dayKey: parsed,
              title,
            });
            setTitle("");
            toast.success("روز تعطیل ذخیره شد");
            emitAppDataChange();
            await onSaved();
          } catch (err) {
            toast.error(err instanceof Error ? err.message : "خطا");
          }
        }}
      >
        <h3 className="font-semibold">روز تعطیل جدید</h3>
        <p className="text-xs text-muted">
          رزرو جدید روی این روزها ساخته نمی‌شود. جلسات قبلی سر جایشان می‌مانند.
        </p>
        <input
          type="date"
          required
          className="w-full rounded-2xl border border-line px-3 py-2.5"
          value={dayKey}
          onChange={(e) => setDayKey(e.target.value)}
        />
        <input
          className="w-full rounded-2xl border border-line px-3 py-2.5"
          placeholder="نام (مثلاً نوروز)"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <button className="btn btn-primary w-full">
          <Plus size={16} /> ثبت تعطیل
        </button>
      </form>

      <div className="space-y-4">
        <div className="surface-card rounded-3xl p-5 space-y-3">
          <h3 className="font-semibold">تعطیلی هفتگی</h3>
          <p className="text-xs text-muted">
            روزهایی که آموزشگاه هر هفته بسته است؛ مثلاً جمعه.
          </p>
          <div className="flex flex-wrap gap-2">
            {WEEKDAY_LABELS.map((label, day) => (
              <button
                key={label}
                type="button"
                className={`chip ${closedWeekdays.includes(day) ? "chip-on" : ""}`}
                onClick={() => void toggleWeekday(day)}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <HolidayList
          title="تعطیلات پیش رو"
          empty="تعطیل موردی برای روزهای آینده ثبت نشده."
          items={upcoming}
          onDelete={removeHoliday}
        />
        {past.length > 0 && (
          <HolidayList
            title="تعطیلات گذشته"
            empty=""
            items={past}
            onDelete={removeHoliday}
          />
        )}
      </div>
    </div>
  );
}

function HolidayList({
  title,
  empty,
  items,
  onDelete,
}: {
  title: string;
  empty: string;
  items: AcademyHoliday[];
  onDelete: (id: number) => void;
}) {
  return (
    <div className="surface-card rounded-3xl p-5 space-y-3">
      <h3 className="font-semibold">{title}</h3>
      {items.length === 0 && empty && (
        <p className="text-sm text-muted flex items-center gap-2">
          <CalendarOff size={16} /> {empty}
        </p>
      )}
      <div className="space-y-2">
        {items.map((item) => (
          <div
            key={item.id}
            className="flex items-center justify-between gap-3 rounded-2xl border border-line px-4 py-3"
          >
            <div>
              <div className="font-medium">{item.title || "تعطیل"}</div>
              <div className="text-xs text-muted mt-0.5">
                {formatHolidayDay(item.dayKey)}
              </div>
            </div>
            <button
              type="button"
              className="text-danger"
              onClick={() => onDelete(item.id)}
            >
              <Trash2 size={16} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
