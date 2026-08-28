import { NavLink, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  CalendarDays,
  Wallet,
  Settings,
  Plus,
  School,
  Monitor,
  Wifi,
  WifiOff,
} from "lucide-react";
import { useRfidStatus } from "./useRfidStatus";

const items = [
  { name: "داشبورد", path: "/", icon: LayoutDashboard, end: true },
  { name: "مشتریان", path: "/users", icon: Users, end: true },
  { name: "تقویم جلسات", path: "/sessions", icon: CalendarDays },
  { name: "مالی", path: "/billing", icon: Wallet },
  { name: "آموزشگاه", path: "/academy", icon: School },
  { name: "کیوسک", path: "/kiosk", icon: Monitor },
  { name: "تنظیمات", path: "/settings", icon: Settings },
];

export default function Sidebar() {
  const ping = useRfidStatus();
  const navigate = useNavigate();

  return (
    <aside className="w-[16.5rem] h-full bg-shell text-white flex flex-col shrink-0 no-print">
      <div className="px-5 pt-6 pb-5">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-linear-to-br from-gold to-brand flex items-center justify-center shadow-lg shadow-black/20">
            <svg viewBox="0 0 32 32" className="w-6 h-6 fill-white">
              <path d="M16 3c1.2 4.2 4 7 8.5 8.5C20 13 17.2 15.8 16 20c-1.2-4.2-4-7-8.5-8.5C12 10 14.8 7.2 16 3z" />
              <path d="M8 21c3 .8 5 2.6 6 5.5C13.2 24 11 22.2 8 21zm16 0c-3 .8-5 2.6-6 5.5 1.8-2.5 4-4.3 6-5.5z" />
            </svg>
          </div>
          <div>
            <div className="text-lg font-bold leading-none">هما</div>
            <p className="text-[11px] text-white/45 mt-1">میز کار آموزشگاه</p>
          </div>
        </div>
        <button
          onClick={() => navigate("/users/new")}
          className="mt-5 w-full inline-flex items-center justify-center gap-2 rounded-2xl bg-gold text-shell font-medium py-2.5 text-sm hover:brightness-110 transition"
        >
          <Plus size={16} />
          مشتری جدید
        </button>
      </div>

      <nav className="flex-1 px-3 space-y-1 overflow-y-auto">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.end}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-2xl text-sm transition ${
                  isActive
                    ? "bg-white/10 text-white shadow-[inset_3px_0_0_0_#c4893a]"
                    : "text-white/65 hover:bg-white/6 hover:text-white"
                }`
              }
            >
              <Icon size={18} />
              {item.name}
            </NavLink>
          );
        })}
      </nav>

      <div className="p-4">
        <NavLink
          to="/settings"
          className="flex items-center gap-3 rounded-2xl bg-white/5 border border-white/8 px-3 py-3"
        >
          {ping === "online" ? (
            <span className="relative flex h-8 w-8 items-center justify-center">
              <span className="absolute inset-0 rounded-full bg-success/30 pulse-ring" />
              <Wifi size={16} className="text-emerald-300" />
            </span>
          ) : (
            <WifiOff size={16} className="text-rose-300" />
          )}
          <div className="min-w-0">
            <div className="text-xs text-white/45">دستگاه RFID</div>
            <div
              className={`text-sm font-medium ${
                ping === "online" ? "text-emerald-300" : "text-rose-300"
              }`}
            >
              {ping === "online" ? "متصل و آماده" : "قطع است"}
            </div>
          </div>
        </NavLink>
        <p className="mt-3 px-1 text-[11px] text-white/35">
          جستجو <span className="text-white/55">Ctrl+K</span>
        </p>
      </div>
    </aside>
  );
}
