import { useState, useMemo, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { motion } from "framer-motion";
import { useCalendarStore } from "../store/calendar";
import { useAcademyStore } from "../store/academy";
import { onAppDataChange } from "../lib/bus";
import { userColor } from "../lib/format";
import { closedDayLabel, holidayConflict } from "@shared/holidays";

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
  status?: string;
  roomName?: string | null;
  roomColor?: string | null;
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
  const [closedNote, setClosedNote] = useState<string | null>(null);
  const { loadEvents, allEvents: storeEvents } = useCalendarStore();
  const [roomFilter, setRoomFilter] = useState<string>("all");
  const holidays = useAcademyStore((s) => s.holidays);
  const closedWeekdays = useAcademyStore((s) => s.closedWeekdays);
  const loadAcademy = useAcademyStore((s) => s.load);

  useEffect(() => {
    void loadAcademy();
    return onAppDataChange(() => void loadAcademy());
  }, [loadAcademy]);

  useEffect(() => {
    const start = new Date(currentWeek);
    start.setHours(0, 0, 0, 0);
    const end = addDays(start, 7);
    loadEvents(start.toISOString(), end.toISOString());
  }, [currentWeek, loadEvents]);

  const days = Array.from({ length: 7 }, (_, i) => addDays(currentWeek, i));
  const nextWeek = () => {
    setClosedNote(null);
    setCurrentWeek(addDays(currentWeek, 7));
  };
  const prevWeek = () => {
    setClosedNote(null);
    setCurrentWeek(addDays(currentWeek, -7));
  };

  const closedHit = (date: Date) =>
    holidayConflict(date, holidays ?? [], closedWeekdays ?? []);

  const handleCellClick = (day: Date, hour: number, events: CalendarEvent[]) => {
    const start = new Date(day);
    start.setHours(hour, 0, 0, 0);
    const ownEvent = events.find((ev) => ev.userId === currentUserId);
    if (ownEvent && onAddEvent) {
      setClosedNote(null);
      onAddEvent(start);
      return;
    }
    if (events[0]) {
      setClosedNote(null);
      setPeek(events[0]);
      return;
    }
    const hit = closedHit(start);
    if (hit) {
      setPeek(null);
      setClosedNote(closedDayLabel(hit));
      return;
    }
    onAddEvent?.(start);
  };

  const recordEvents: CalendarEvent[] = useMemo(
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

  const mappedStore: CalendarEvent[] = storeEvents.map((ev) => ({
    id: ev.id,
    title: ev.title,
    start: new Date(ev.start ?? ev.date),
    used: ev.used,
    userId: ev.userId,
    status: ev.status,
    roomName: ev.roomName,
    roomColor: ev.roomColor,
  }));
  const rooms = [...new Set(mappedStore.map((ev) => ev.roomName).filter(Boolean))] as string[];
  const allEvents: CalendarEvent[] = [
    ...mappedStore.filter(
      (ev) =>
        (currentUserId == null || currentUserId < 0 || ev.userId !== currentUserId) &&
        (roomFilter === "all" || ev.roomName === roomFilter)
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
          {rooms.length > 0 && (
            <select
              className="px-3 py-1.5 rounded-xl border border-line bg-surface"
              value={roomFilter}
              onChange={(e) => setRoomFilter(e.target.value)}
            >
              <option value="all">همه کلاس‌ها</option>
              {rooms.map((room) => (
                <option key={room} value={room}>
                  {room}
                </option>
              ))}
            </select>
          )}
          <button
            type="button"
            className="px-3 py-1.5 rounded-xl border border-line hover:bg-paper"
            onClick={() => {
              setClosedNote(null);
              setCurrentWeek(getWeekStart(new Date()));
            }}
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
        <span className="inline-flex items-center gap-1">
          <span className="w-2.5 h-2.5 rounded-full bg-gold-soft ring-1 ring-gold" /> روز تعطیل
        </span>
      </div>

      {isEmpty && (
        <p className="text-xs text-muted mb-3">
          این هفته خالی است. برای رزرو روی یک خانه ساعت کلیک کنید.
        </p>
      )}

      {closedNote && (
        <div className="mb-3 rounded-2xl border border-gold bg-gold-soft px-4 py-3 text-sm text-ink">
          این روز تعطیل آموزشگاه است — {closedNote}. رزرو جدید ساخته نمی‌شود.
        </div>
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
        {days.map((day, i) => {
          const dayClosed = closedHit(day);
          return (
            <div
              key={i}
              className={`border-b border-l border-line p-2 text-center ${
                dayClosed
                  ? "bg-gold-soft"
                  : isToday(day)
                    ? "bg-brand-soft"
                    : "bg-paper"
              }`}
            >
              <div className="text-[11px] text-muted">{WEEKDAYS_FA[i]}</div>
              <div className="text-[12px] font-semibold text-ink">
                {day.toLocaleDateString("fa-IR", { month: "short", day: "numeric" })}
              </div>
              {dayClosed && (
                <div className="text-[10px] text-gold mt-0.5">تعطیل</div>
              )}
            </div>
          );
        })}

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
              const dayClosed = Boolean(closedHit(day));
              return (
                <div
                  key={`${day.toISOString()}-${hour}`}
                  onClick={() => handleCellClick(day, hour, cellEvents)}
                  className={`relative border-b border-l border-line h-12 cursor-pointer transition hover:bg-paper ${
                    now ? "bg-gold-soft ring-1 ring-gold ring-inset" : ""
                  } ${isToday(day) && !now && !dayClosed ? "bg-brand-soft/40" : ""} ${
                    dayClosed && !now ? "bg-gold-soft/50" : ""
                  }`}
                >
                  <div className="absolute inset-0.5 flex flex-col gap-0.5 overflow-hidden">
                    {cellEvents.slice(0, 3).map((ev, idx) => (
                      <motion.div
                        key={ev.id + new Date(ev.start).getTime() + idx}
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="occupancy-chip"
                        style={{
                          background:
                            ev.status === "cancelled"
                              ? "#9a8f83"
                              : ev.roomColor ||
                                (ev.used
                                  ? "#2f7d57"
                                  : ev.userId === currentUserId
                                    ? "#14635c"
                                    : userColor(ev.userId || 0)),
                          opacity: ev.status === "cancelled" ? 0.55 : ev.used ? 0.8 : 1,
                        }}
                      >
                        {ev.title}
                      </motion.div>
                    ))}
                    {cellEvents.length > 3 && (
                      <div className="occupancy-chip bg-ink/70">
                        +{(cellEvents.length - 3).toLocaleString("fa-IR")}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
