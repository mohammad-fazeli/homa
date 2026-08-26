import { useEffect, useMemo, useState } from "react";
import { useDashboardStore } from "../store/dashboard";
import { useRfidStatus } from "../components/useRfidStatus";
import { formatTime } from "../lib/format";
import { Wifi, WifiOff } from "lucide-react";
import { onAppDataChange } from "../lib/bus";

export default function Kiosk() {
  const { overview, loadData } = useDashboardStore();
  const ping = useRfidStatus();
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    loadData();
    return onAppDataChange(loadData);
  }, [loadData]);

  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(id);
  }, []);

  const upcoming = useMemo(
    () =>
      overview.todaySessions
        .filter((session) => session.status !== "cancelled")
        .slice()
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()),
    [overview.todaySessions]
  );

  const grouped = useMemo(() => {
    const map = new Map<string, typeof upcoming>();
    for (const session of upcoming) {
      const key = session.roomName || "بدون کلاس";
      map.set(key, [...(map.get(key) ?? []), session]);
    }
    return [...map.entries()];
  }, [upcoming]);

  return (
    <div className="min-h-full flex flex-col items-center justify-center py-8 text-center">
      <p className="text-gold text-sm mb-2">آموزشگاه هما</p>
      <div className="kiosk-clock text-6xl md:text-8xl font-bold text-ink">
        {now.toLocaleTimeString("fa-IR", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
      </div>
      <p className="text-muted mt-3">
        {now.toLocaleDateString("fa-IR", { weekday: "long", day: "numeric", month: "long" })}
      </p>
      <div className={`mt-4 inline-flex items-center gap-2 text-sm ${ping === "online" ? "text-success" : "text-danger"}`}>
        {ping === "online" ? <Wifi size={16} /> : <WifiOff size={16} />}
        {ping === "online" ? "کارت را روی دستگاه بگذارید" : "کارت‌خوان قطع است"}
      </div>
      <div className="w-full max-w-5xl mt-10 grid md:grid-cols-2 xl:grid-cols-3 gap-4 text-right">
        {grouped.map(([room, sessions]) => (
          <div key={room} className="surface-card rounded-3xl p-4">
            <div className="font-semibold mb-3">{room}</div>
            <div className="space-y-2">
              {sessions.slice(0, 6).map((session) => (
                <div key={session.id} className="flex items-center justify-between text-sm">
                  <span className="truncate">{session.title}</span>
                  <span className="text-muted">{formatTime(session.date)}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
