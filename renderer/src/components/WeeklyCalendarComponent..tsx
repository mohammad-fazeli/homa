import { useState, useMemo, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { motion } from "framer-motion";
import { useCalendarStore } from "../store/calendar";

type RecordItem = {
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
  currentUserId?: number; // ← اضافه شد
  onAddEvent?: (date: Date) => void;
}

function getWeekStart(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = (day + 1) % 7; // Saturday = 0
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

const HOURS = Array.from({ length: 14 }, (_, i) => 8 + i);
const WEEKDAYS_FA = [
  "شنبه",
  "یکشنبه",
  "دوشنبه",
  "سه‌شنبه",
  "چهارشنبه",
  "پنجشنبه",
  "جمعه",
];

export default function WeeklyCalendar({
  records = [],
  onAddEvent,
  currentUserId,
}: WeeklyCalendarProps) {
  const [currentWeek, setCurrentWeek] = useState<Date>(
    getWeekStart(new Date())
  );
  const { loadEvents, allEvents: Ev } = useCalendarStore();

  useEffect(() => {
    const d = new Date(currentWeek);
    const day = d.getDay();
    const diff = (day + 1) % 7; // Saturday = 0
    d.setDate(d.getDate() - diff + 7);
    loadEvents(currentWeek.toString(), d.toString());
  }, []);

  const days = Array.from({ length: 7 }, (_, i) => addDays(currentWeek, i));

  const nextWeek = () => setCurrentWeek(addDays(currentWeek, 7));
  const prevWeek = () => setCurrentWeek(addDays(currentWeek, -7));

  const formatDate = (d: Date) =>
    d.toLocaleDateString("fa-IR", { month: "short", day: "numeric" });

  const handleCellClick = (day: Date, hour: number) => {
    const start = new Date(day);
    start.setHours(hour, 0, 0);
    onAddEvent?.(start);
  };

  // 🟦 تبدیل داده‌های records شما به رویداد قابل نمایش
  const recordEvents = useMemo(() => {
    return records.map((r) => ({
      id: r.id,
      title: r.used ? "استفاده شده" : "رزرو",
      start: new Date(r.date),
      used: r.used,
      userId: r.userId,
    }));
  }, [records]);

  // 🟦 ترکیب رویدادهای معمولی + داده‌های شما
  const allEvents = [...Ev, ...recordEvents];

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-lg p-4 w-full overflow-hidden">
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={prevWeek}
          type="button"
          className="p-1.5 rounded-lg hover:bg-slate-100"
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
        >
          <ChevronLeft size={18} />
        </button>
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

              return (
                <div
                  key={i}
                  onClick={() => handleCellClick(day, hour)}
                  className="relative border-b border-r border-slate-200 h-12 cursor-pointer hover:bg-slate-50 transition"
                >
                  {cellEvents.map((ev) => (
                    <motion.div
                      key={ev.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`absolute inset-0.5 text-white text-[10px] rounded-md p-1 shadow ${getRecordColor(
                        ev,
                        currentUserId
                      )}`}
                    >
                      {ev.used
                        ? "استفاده شده"
                        : ev.userId === currentUserId
                        ? "رزرو شما"
                        : "رزرو دیگران"}
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
