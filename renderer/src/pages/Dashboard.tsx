import { useEffect, useMemo, useState } from "react";
import { Card, CardContent } from "../components/card";
import {
  Users,
  CalendarDays,
  Wallet,
  Wifi,
  WifiOff,
  Plus,
  Search,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Download,
  UserRoundSearch,
} from "lucide-react";
import { useDashboardStore } from "../store/dashboard";
import { useRfidStatus } from "../components/useRfidStatus";
import { Link, useNavigate } from "react-router-dom";
import { useUsersStore } from "../store/users";
import { useAttendanceStore } from "../store/attendance";
import { onAppDataChange } from "../lib/bus";
import {
  formatDateTime,
  formatMoney,
  formatRelative,
  formatTime,
} from "../lib/format";
import PageHeader from "../components/ui/PageHeader";
import EmptyState from "../components/ui/EmptyState";
import Avatar from "../components/ui/Avatar";
import Skeleton from "../components/ui/Skeleton";
import { exportCsv, stampFile } from "../lib/csv";
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis } from "recharts";
import { toast } from "react-toastify";

export default function Dashboard() {
  const { loadData, overview, loading } = useDashboardStore();
  const ping = useRfidStatus();
  const navigate = useNavigate();
  const setQuery = useUsersStore((s) => s.setQuery);
  const openUser = useUsersStore((s) => s.openUser);
  const { markSession, unmarkSession } = useAttendanceStore();
  const [now, setNow] = useState(() => new Date());
  const [search, setSearch] = useState("");

  useEffect(() => {
    loadData();
    return onAppDataChange(loadData);
  }, [loadData]);

  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(id);
  }, []);

  const hour = now.getHours();
  const hello = hour < 12 ? "صبح بخیر" : hour < 17 ? "ظهر بخیر" : "عصر بخیر";
  const { stats } = overview;
  const showSkeleton = loading && stats.todayCount === 0 && stats.activeUsers === 0;

  const nextPending = overview.todaySessions.find(
    (session) => session.used === 0 && new Date(session.date).getTime() >= now.getTime() - 20 * 60 * 1000
  );

  const kpis = [
    {
      title: "مشتریان فعال",
      value: stats.activeUsers.toLocaleString("fa-IR"),
      icon: Users,
      tone: "text-brand bg-brand-soft",
    },
    {
      title: "جلسات امروز",
      value: `${stats.attendedToday.toLocaleString("fa-IR")} / ${stats.todayCount.toLocaleString("fa-IR")}`,
      icon: Clock,
      tone: "text-gold bg-gold-soft",
    },
    {
      title: "جلسات این هفته",
      value: stats.weeklySessions.toLocaleString("fa-IR"),
      icon: CalendarDays,
      tone: "text-brand bg-brand-soft",
    },
    {
      title: "درآمد این ماه",
      value: formatMoney(stats.monthlyRevenue),
      icon: Wallet,
      tone: "text-gold bg-gold-soft",
    },
  ];

  const chartData = useMemo(
    () => overview.weeklyBreakdown.map((d) => ({ ...d })),
    [overview.weeklyBreakdown]
  );

  const exportToday = () => {
    exportCsv(
      stampFile("today-sessions"),
      ["مشتری", "ساعت", "وضعیت"],
      overview.todaySessions.map((session) => [
        session.title,
        formatTime(session.date),
        session.used ? "حاضر" : "در انتظار",
      ])
    );
    toast.success("برنامه امروز ذخیره شد");
  };

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="همــــا"
        title={hello}
        description={now.toLocaleDateString("fa-IR", {
          weekday: "long",
          year: "numeric",
          month: "long",
          day: "numeric",
        })}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-3 py-2 rounded-2xl bg-surface border border-line text-sm text-muted">
              {now.toLocaleTimeString("fa-IR")}
            </span>
            <form
              className="relative"
              onSubmit={(e) => {
                e.preventDefault();
                setQuery(search);
                navigate("/users");
              }}
            >
              <Search
                size={15}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted"
              />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="جستجوی مشتری...  Ctrl+K"
                className="w-52 rounded-2xl border border-line bg-surface pr-9 pl-3 py-2 text-sm outline-none focus:border-brand"
              />
            </form>
            <Link to="/users/new" className="btn btn-primary text-sm py-2">
              <Plus size={16} /> مشتری جدید
            </Link>
          </div>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {kpis.map((item) => (
          <Card key={item.title}>
            <CardContent className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted">{item.title}</p>
                {showSkeleton ? (
                  <Skeleton className="h-7 w-20 mt-2" />
                ) : (
                  <p className="text-xl font-bold mt-1 text-ink">{item.value}</p>
                )}
              </div>
              <div
                className={`w-11 h-11 rounded-2xl flex items-center justify-center ${item.tone}`}
              >
                <item.icon size={20} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <Card className="xl:col-span-2">
          <CardContent>
            <div className="flex items-center justify-between mb-4 gap-2">
              <h2 className="font-semibold text-ink">برنامه امروز</h2>
              <div className="flex items-center gap-3">
                {overview.todaySessions.length > 0 && (
                  <button type="button" className="text-xs text-muted hover:text-ink" onClick={exportToday}>
                    <Download size={13} className="inline ml-1" />
                    خروجی
                  </button>
                )}
                <Link to="/sessions" className="text-xs text-brand">
                  تقویم کامل
                </Link>
              </div>
            </div>
            {overview.todaySessions.length === 0 ? (
              <EmptyState
                icon={<CalendarDays size={22} />}
                title="برای امروز جلسه‌ای نیست"
                description="از فهرست مشتریان می‌توانید جلسه جدید رزرو کنید."
              />
            ) : (
              <div className="space-y-2">
                {overview.todaySessions.map((session) => {
                  const isNext = nextPending?.id === session.id;
                  return (
                    <div
                      key={session.id}
                      className={`flex items-center justify-between rounded-2xl border px-3 py-2.5 gap-3 ${
                        isNext ? "border-gold bg-gold-soft/60" : "border-line"
                      }`}
                    >
                      <button
                        type="button"
                        className="text-right min-w-0 flex-1"
                        onClick={() => openUser(session.userId)}
                      >
                        <div className="font-medium text-ink truncate">
                          {session.title}
                          {isNext && (
                            <span className="mr-2 text-[11px] text-gold">جلسه بعدی</span>
                          )}
                        </div>
                        <div className="text-xs text-muted">
                          {formatTime(session.date)}
                          {session.usedAt
                            ? ` · ${formatRelative(session.usedAt)}`
                            : ` · ${formatRelative(session.date)}`}
                        </div>
                      </button>
                      <div className="flex items-center gap-2 shrink-0">
                        {session.used ? (
                          <button
                            type="button"
                            className="text-xs text-muted hover:text-danger"
                            onClick={() => void unmarkSession(session.id)}
                          >
                            لغو
                          </button>
                        ) : (
                          <button
                            type="button"
                            className="text-xs text-brand hover:text-brand-dark"
                            onClick={() => void markSession(session.id)}
                          >
                            ثبت حضور
                          </button>
                        )}
                        <span
                          className={`text-xs px-2.5 py-1 rounded-full ${
                            session.used
                              ? "bg-brand-soft text-brand"
                              : "bg-gold-soft text-gold"
                          }`}
                        >
                          {session.used ? "حاضر" : "در انتظار"}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <h2 className="font-semibold text-ink mb-4">ریتم هفته</h2>
            <div className="h-52" dir="ltr">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                  <Tooltip
                    formatter={(value: number, name) => [
                      Number(value).toLocaleString("fa-IR"),
                      name === "used" ? "حاضر" : "کل",
                    ]}
                  />
                  <Bar dataKey="total" fill="#c9ddd8" radius={6} />
                  <Bar dataKey="used" fill="#14635c" radius={6} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <p className="text-xs text-muted mt-2">
              {stats.remainingSessions.toLocaleString("fa-IR")} جلسه باقی‌مانده در کل دوره‌ها
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <Card>
          <CardContent>
            <h2 className="font-semibold text-ink mb-4">جلسه‌های بعدی</h2>
            {overview.upcomingSessions.length === 0 ? (
              <p className="text-sm text-muted">جلسه‌ای در صف نیست.</p>
            ) : (
              <div className="space-y-2">
                {overview.upcomingSessions.map((session) => (
                  <button
                    key={session.id}
                    type="button"
                    onClick={() => openUser(session.userId)}
                    className="w-full flex justify-between gap-3 text-sm rounded-xl px-2 py-1.5 hover:bg-paper text-right"
                  >
                    <span className="text-ink truncate">{session.title}</span>
                    <span className="text-muted shrink-0">
                      {formatDateTime(session.date)}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <h2 className="font-semibold mb-4 text-ink flex items-center gap-2">
              <AlertTriangle size={16} className="text-gold" />
              اعتبار رو به اتمام
            </h2>
            {overview.attentionUsers.length === 0 ? (
              <p className="text-sm text-muted">همه دوره‌ها وضعیت خوبی دارند.</p>
            ) : (
              <div className="space-y-2">
                {overview.attentionUsers.map((user) => (
                  <button
                    key={user.id}
                    onClick={() => openUser(user.id)}
                    className="w-full flex items-center gap-3 rounded-2xl border border-line px-3 py-2 text-right hover:bg-paper"
                  >
                    <Avatar
                      firstName={user.firstName}
                      lastName={user.lastName}
                      size="sm"
                    />
                    <div className="flex-1">
                      <div className="text-sm font-medium">
                        {user.firstName} {user.lastName}
                      </div>
                      <div className="text-xs text-muted">
                        {user.remainingSessions.toLocaleString("fa-IR")} از{" "}
                        {user.totalSessions.toLocaleString("fa-IR")} باقی مانده
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <h2 className="font-semibold text-ink mb-4">آخرین حضورها</h2>
            {overview.recentAttendance.length === 0 ? (
              <p className="text-sm text-muted">هنوز حضوری ثبت نشده است.</p>
            ) : (
              <div className="space-y-2">
                {overview.recentAttendance.map((session) => (
                  <button
                    key={session.id}
                    type="button"
                    onClick={() => openUser(session.userId)}
                    className="w-full flex items-center justify-between text-sm gap-3 rounded-xl px-2 py-1.5 hover:bg-paper text-right"
                  >
                    <span className="inline-flex items-center gap-2 min-w-0">
                      <CheckCircle2 size={14} className="text-success shrink-0" />
                      <span className="truncate">{session.title}</span>
                    </span>
                    <span className="text-xs text-muted shrink-0">
                      {formatRelative(session.usedAt || session.date)}
                    </span>
                  </button>
                ))}
              </div>
            )}
            <Link
              to="/settings"
              className="mt-5 flex items-center justify-between rounded-2xl border border-line px-3 py-2.5 hover:bg-paper"
            >
              <span className="text-sm text-muted inline-flex items-center gap-2">
                <UserRoundSearch size={14} />
                دستگاه RFID
              </span>
              <span
                className={`inline-flex items-center gap-1 text-sm font-medium ${
                  ping === "online" ? "text-success" : "text-danger"
                }`}
              >
                {ping === "online" ? <Wifi size={15} /> : <WifiOff size={15} />}
                {ping === "online" ? "متصل" : "قطع"}
              </span>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
