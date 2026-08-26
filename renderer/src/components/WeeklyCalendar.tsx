import { useState, useMemo, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { motion } from "framer-motion";
import { useCalendarStore } from "../store/calendar";
import { userColor } from "../lib/format";

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
  onOpenUser?: (userId: number) => void;
  onMark?: (sessionId: number) => void;
  onUnmark?: (sessionId: number) => void;
}

function getWeekStart(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
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

function isToday(date: Date) {
  const now = new Date();
  return (
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate()
  );
}

function isNowCell(cellDate: Date) {
  const now = new Date();
  return isToday(cellDate) && cellDate.getHours() === now.getHours();
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

export default function WeeklyCalendar({
  records = [],
  onAddEvent,
  currentUserId = -1,
  onOpenUser,
  onMark,
  onUnmark,
}: WeeklyCalendarProps) {
  const [currentWeek, setCurrentWeek] = useState<Date>(() =>
    getWeekStart(new Date())
  );
  const [peek, setPeek] = useState<CalendarEvent | null>(null);
  const { loadEvents, allEvents: storeEvents } = useCalendarStore();

  useEffect(() => {
    const start = new Date(currentWeek);
    start.setHours(0, 0, 0, 0);
    const end = addDays(start, 7);
    loadEvents(start.toISOString(), end.toISOString());
  }, [currentWeek, loadEvents]);

  const days = Array.from({ length: 7 }, (_, i) => addDays(currentWeek, i));
  const nextWeek = () => setCurrentWeek(addDays(currentWeek, 7));
  const prevWeek = () => setCurrentWeek(addDays(currentWeek, -7));

  const handleCellClick = (day: Date, hour: number, events: CalendarEvent[]) => {
    const start = new Date(day);
    start.setHours(hour, 0, 0, 0);
    const ownEvent = events.find((ev) => ev.userId === currentUserId);
    if (ownEvent && onAddEvent) {
      onAddEvent(start);
      return;
    }
    if (events[0]) {
      setPeek(events[0]);
      return;
    }
    onAddEvent?.(start);
  };

  const recordEvents = useMemo(
    () =>
      records.map((r) => ({
        id: r.id,
        title: r.used ? "استفاده شده" : "رزرو",
        start: new Date(r.date),
        used: r.used,
        userId: r.userId,
      })),
    [records]
  );

  const allEvents = [
    ...storeEvents.filter(
      (ev) => currentUserId == null || currentUserId < 0 || ev.userId !== currentUserId
    ),
    ...recordEvents,
  ];
  const isEmpty = allEvents.length === 0;
  const usedCount = allEvents.filter((ev) => ev.used === 1).length;

  return (
    <div className="surface-card rounded-3xl p-4 w-full overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2">
          <button
            onClick={prevWeek}
            type="button"
            className="p-2 rounded-xl hover:bg-paper"
            aria-label="هفته قبل"
          >
            <ChevronRight size={18} />
          </button>
          <h2 className="text-lg font-semibold text-ink">تقویم هفتگی</h2>
          <button
            onClick={nextWeek}
            type="button"
            className="p-2 rounded-xl hover:bg-paper"
            aria-label="هفته بعد"
          >
            <ChevronLeft size={18} />
          </button>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <span className="text-muted">
            {days[0].toLocaleDateString("fa-IR", { month: "short", day: "numeric" })}{" "}
            تا{" "}
            {days[6].toLocaleDateString("fa-IR", { month: "short", day: "numeric" })}
            {!isEmpty && (
              <>
                {" · "}
                {usedCount.toLocaleString("fa-IR")}/
                {allEvents.length.toLocaleString("fa-IR")} حاضر
              </>
            )}
          </span>
          <button
            type="button"
            className="px-3 py-1.5 rounded-xl border border-line hover:bg-paper"
            onClick={() => setCurrentWeek(getWeekStart(new Date()))}
          >
            این هفته
          </button>
        </div>
      </div>

      <div className="flex flex-wrap gap-3 text-[11px] text-muted mb-3">
        <span className="inline-flex items-center gap-1">
          <span className="w-2.5 h-2.5 rounded-full bg-success" /> حاضر
        </span>
        <span className="inline-flex items-center gap-1">
          <span className="w-2.5 h-2.5 rounded-full bg-brand" /> مشتری فعلی
        </span>
        <span className="inline-flex items-center gap-1">
          <span className="w-2.5 h-2.5 rounded-full bg-gold" /> رزرو دیگران
        </span>
      </div>

      {isEmpty && (
        <p className="text-xs text-muted mb-3">
          این هفته خالی است. برای رزرو روی یک خانه ساعت کلیک کنید.
        </p>
      )}

      {peek && (
        <div className="mb-3 rounded-2xl border border-line bg-paper px-4 py-3 text-sm flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="font-medium text-ink">{peek.title}</div>
            <div className="text-xs text-muted mt-0.5">
              {peek.start.toLocaleString("fa-IR", {
                weekday: "long",
                hour: "2-digit",
                minute: "2-digit",
              })}
              {peek.used ? " · حاضر" : " · رزرو"}
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {peek.userId != null && peek.userId > 0 && onOpenUser && (
              <button
                type="button"
                className="btn btn-ghost text-xs py-1.5 px-3"
                onClick={() => {
                  onOpenUser(peek.userId!);
                  setPeek(null);
                }}
              >
                پروفایل
              </button>
            )}
            {peek.used
              ? onUnmark && (
                  <button
                    type="button"
                    className="btn btn-ghost text-xs py-1.5 px-3 text-danger"
                    onClick={() => {
                      onUnmark(peek.id);
                      setPeek(null);
                    }}
                  >
                    لغو حضور
                  </button>
                )
              : onMark && (
                  <button
                    type="button"
                    className="btn btn-primary text-xs py-1.5 px-3"
                    onClick={() => {
                      onMark(peek.id);
                      setPeek(null);
                    }}
                  >
                    ثبت حضور
                  </button>
                )}
            <button
              type="button"
              className="text-xs text-muted"
              onClick={() => setPeek(null)}
            >
              بستن
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-8 border-t border-r border-line text-xs select-none overflow-auto max-h-[70vh]">
        <div className="bg-paper border-b border-l border-line p-2 text-center font-medium sticky right-0 z-20">
          ساعت
        </div>
        {days.map((day, i) => (
          <div
            key={i}
            className={`border-b border-l border-line p-2 text-center ${
              isToday(day) ? "bg-brand-soft" : "bg-paper"
            }`}
          >
            <div className="text-[11px] text-muted">{WEEKDAYS_FA[i]}</div>
            <div className="text-[12px] font-semibold text-ink">
              {day.toLocaleDateString("fa-IR", { month: "short", day: "numeric" })}
            </div>
          </div>
        ))}

        {HOURS.map((hour) => (
          <div key={hour} className="contents">
            <div className="border-b border-l border-line p-2 text-center bg-paper sticky right-0 z-10 text-muted">
              {hour.toLocaleString("fa-IR")}:۰۰
            </div>
            {days.map((day) => {
              const cellDate = new Date(day);
              cellDate.setHours(hour, 0, 0, 0);
              const cellEvents = allEvents.filter((ev) => {
                const evDate = new Date(ev.start);
                return (
                  evDate.getFullYear() === cellDate.getFullYear() &&
                  evDate.getMonth() === cellDate.getMonth() &&
                  evDate.getDate() === cellDate.getDate() &&
                  evDate.getHours() === cellDate.getHours()
                );
              });
              const now = isNowCell(cellDate);
              return (
                <div
                  key={`${day.toISOString()}-${hour}`}
                  onClick={() => handleCellClick(day, hour, cellEvents)}
                  className={`relative border-b border-l border-line h-12 cursor-pointer transition hover:bg-paper ${
                    now ? "bg-gold-soft ring-1 ring-gold ring-inset" : ""
                  } ${isToday(day) && !now ? "bg-brand-soft/40" : ""}`}
                >
                  {cellEvents.map((ev, idx) => (
                    <motion.div
                      key={ev.id + new Date(ev.start).getTime() + idx}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="absolute inset-0.5 text-white text-[10px] rounded-lg p-1 shadow-sm overflow-hidden"
                      style={{
                        background: ev.used
                          ? "#2f7d57"
                          : ev.userId === currentUserId
                            ? "#14635c"
                            : userColor(ev.userId || 0),
                        opacity: ev.used ? 0.72 : 1,
                      }}
                    >
                      {ev.used
                        ? ev.title
                        : ev.userId === currentUserId
                          ? "رزرو این مشتری"
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
