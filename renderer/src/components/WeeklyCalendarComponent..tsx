import { useState, useMemo, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { motion } from "framer-motion";
import { useCalendarStore } from "../store/calendar";

export type RecordItem = {
  id: number;
  date: string | Date;
  used: 0 | 1;
  usedAt: string | Date | null;
  userId: number;
};

type CalendarEvent = {
  id: number;
  title: string;
  start: Date;
  used?: 0 | 1;
  userId?: number;
};

interface WeeklyCalendarProps {
  records?: RecordItem[];
  currentUserId?: number | null;
  onAddEvent?: (date: Date) => void;
}

function getWeekStart(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = (day + 1) % 7;
  d.setDate(d.getDate() - diff);
  return d;
}

function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function getRecordColor(ev: CalendarEvent, currentUserId?: number) {
  if (ev.used) return "bg-green-600";
  if (ev.userId === currentUserId) return "bg-indigo-500";
  return "bg-red-500";
}

const HOURS = Array.from({ length: 17 }, (_, i) => 8 + i);
const WEEKDAYS_FA = [
  "شنبه",
  "یکشنبه",
  "دوشنبه",
  "سه‌شنبه",
  "چهارشنبه",
  "پنجشنبه",
  "جمعه",
];

function formatDateFa(d: Date) {
  try {
    return new Date(d).toLocaleDateString("fa-IR", {
      month: "short",
      day: "numeric",
    });
  } catch {
    return String(d);
  }
}

function isNowCell(cellDate: Date) {
  const now = new Date();

  return (
    cellDate.getFullYear() === now.getFullYear() &&
    cellDate.getMonth() === now.getMonth() &&
    cellDate.getDate() === now.getDate() &&
    cellDate.getHours() === now.getHours()
  );
}

export default function WeeklyCalendar({
  records = [],
  onAddEvent,
  currentUserId = -1,
}: WeeklyCalendarProps) {
  const [currentWeek, setCurrentWeek] = useState<Date>(
    getWeekStart(new Date())
  );
  const { loadEvents, allEvents: storeEvents } = useCalendarStore();

  useEffect(() => {
    const d = new Date(currentWeek);
    const day = d.getDay();
    const diff = (day + 1) % 7; // Saturday = 0
    d.setDate(d.getDate() - diff + 7);
    loadEvents(
      currentWeek.setHours(0, 0, 0, 0).toLocaleString(),
      d.toLocaleString()
    );
  }, [currentWeek]);

  const days = Array.from({ length: 7 }, (_, i) => addDays(currentWeek, i));

  const nextWeek = () => setCurrentWeek(addDays(currentWeek, 7));
  const prevWeek = () => setCurrentWeek(addDays(currentWeek, -7));

  const formatDate = (d: Date) =>
    d.toLocaleDateString("fa-IR", { month: "short", day: "numeric" });

  const handleCellClick = (day: Date, hour: number) => {
    const start = new Date(day);
    start.setHours(hour, 0, 0);
    const findEvent = storeEvents.find((ev) => {
      const evDate = new Date(ev.start);
      return (
        evDate.getFullYear() === start.getFullYear() &&
        evDate.getMonth() === start.getMonth() &&
        evDate.getDate() === start.getDate() &&
        evDate.getHours() === start.getHours()
      );
    });
    if (!findEvent) onAddEvent?.(start);
  };

  const recordEvents = useMemo(() => {
    return records.map((r) => ({
      id: r.id,
      title: r.used ? "استفاده شده" : "رزرو",
      start: new Date(r.date),
      used: r.used,
      userId: r.userId,
    }));
  }, [records]);

  const allEvents = [...storeEvents, ...recordEvents];

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-lg p-4 w-full overflow-hidden">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <button
            onClick={prevWeek}
            type="button"
            className="p-1.5 rounded-lg hover:bg-slate-100"
            aria-label="هفته قبل"
          >
            <ChevronRight size={18} />
          </button>

          <h2 className="text-lg font-semibold bg-linier-to-r from-indigo-600 to-sky-500 bg-clip-text text-transparent">
            تقویم هفتگی
          </h2>

          <button
            onClick={nextWeek}
            type="button"
            className="p-1.5 rounded-lg hover:bg-slate-100"
            aria-label="هفته بعد"
          >
            <ChevronLeft size={18} />
          </button>
        </div>

        <div className="flex items-center gap-2">
          <div className="text-xs text-slate-600">
            {formatDateFa(days[0])} — {formatDateFa(days[6])}
          </div>
          <button
            type="button"
            className="inline-flex items-center gap-2 px-3 py-1 rounded-md border hover:bg-slate-50"
            onClick={() => setCurrentWeek(getWeekStart(new Date()))}
            title="بازگشت به هفته جاری"
          >
            امروز
          </button>
        </div>
      </div>
      <div className="grid grid-cols-8 border-t border-l border-slate-200 text-xs select-none">
        <div className="bg-slate-50 border-b border-r border-slate-200 p-1 text-center font-medium sticky left-0 z-20">
          ساعت
        </div>

        {days.map((day, i) => (
          <div
            key={i}
            className="bg-slate-50 border-b border-r border-slate-200 p-1 text-center font-medium"
          >
            <div className="text-[11px] text-slate-600">{WEEKDAYS_FA[i]}</div>
            <div className="text-[12px] font-semibold">{formatDate(day)}</div>
          </div>
        ))}

        {HOURS.map((hour) => (
          <div key={hour} className="contents">
            <div className="border-b border-r border-slate-200 p-1 text-center bg-slate-50 sticky left-0 z-10">
              {hour}:00
            </div>

            {days.map((day, i) => {
              const cellDate = new Date(day);
              cellDate.setHours(hour);

              const cellEvents = allEvents.filter((ev) => {
                const evDate = new Date(ev.start);
                return (
                  evDate.getFullYear() === cellDate.getFullYear() &&
                  evDate.getMonth() === cellDate.getMonth() &&
                  evDate.getDate() === cellDate.getDate() &&
                  evDate.getHours() === cellDate.getHours()
                );
              });

              const isNow = isNowCell(cellDate);

              return (
                <div
                  key={i}
                  onClick={() => handleCellClick(day, hour)}
                  className={`relative border-b border-r border-slate-200 h-12 cursor-pointer transition hover:bg-slate-50
                    ${
                      isNow
                        ? "bg-indigo-50 ring-2 ring-indigo-500 ring-inset"
                        : ""
                    }`}
                >
                  {cellEvents.map((ev, i) => (
                    <motion.div
                      key={ev.id + new Date(ev.start).getTime() + i}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`absolute inset-0.5 text-white text-[10px] rounded-md p-1 shadow ${getRecordColor(
                        ev,
                        currentUserId || -1
                      )}`}
                    >
                      {ev.used
                        ? ev.title
                        : ev.userId === currentUserId
                        ? "رزرو کاربر فعلی"
                        : ev.title}
                    </motion.div>
                  ))}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
