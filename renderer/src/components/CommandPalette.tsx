import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  CalendarDays,
  LayoutDashboard,
  Plus,
  Search,
  Settings,
  Users,
  Wallet,
  School,
  Monitor,
} from "lucide-react";
import { useUsersStore } from "../store/users";
import type { UserFindAllItem } from "../global";

const PAGES = [
  { id: "dash", title: "داشبورد", hint: "نمای کلی روز", path: "/", icon: LayoutDashboard },
  { id: "users", title: "مشتریان", hint: "فهرست و جستجو", path: "/users", icon: Users },
  { id: "sessions", title: "تقویم جلسات", hint: "برنامه هفته", path: "/sessions", icon: CalendarDays },
  { id: "billing", title: "مالی", hint: "درآمد و گزارش", path: "/billing", icon: Wallet },
  { id: "academy", title: "آموزشگاه", hint: "کلاس و مربی", path: "/academy", icon: School },
  { id: "kiosk", title: "کیوسک", hint: "میز ورودی", path: "/kiosk", icon: Monitor },
  { id: "settings", title: "تنظیمات", hint: "RFID و پشتیبان", path: "/settings", icon: Settings },
  { id: "new", title: "مشتری جدید", hint: "Ctrl + N", path: "/users/new", icon: Plus },
];

export default function CommandPalette({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const navigate = useNavigate();
  const openUser = useUsersStore((s) => s.openUser);
  const [query, setQuery] = useState("");
  const [users, setUsers] = useState<UserFindAllItem[]>([]);
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    setQuery("");
    setActive(0);
    const t = window.setTimeout(() => inputRef.current?.focus(), 30);
    return () => window.clearTimeout(t);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    const timer = window.setTimeout(async () => {
      const result = await window.electronAPI?.getUsers(1, 8, query.trim());
      if (!cancelled) setUsers(result?.data ?? []);
    }, 160);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [open, query]);

  const pages = useMemo(() => {
    const q = query.trim();
    if (!q) return PAGES;
    return PAGES.filter((item) => item.title.includes(q) || item.hint.includes(q));
  }, [query]);

  const items = useMemo(
    () => [
      ...pages.map((page) => ({
        id: `p-${page.id}`,
        group: "صفحات",
        title: page.title,
        hint: page.hint,
        icon: page.icon,
        run: () => {
          navigate(page.path);
          onClose();
        },
      })),
      ...users.map((user) => ({
        id: `u-${user.id}`,
        group: "مشتریان",
        title: `${user.firstName} ${user.lastName}`,
        hint: user.phone,
        icon: Users,
        run: () => {
          openUser(user.id);
          onClose();
        },
      })),
    ],
    [pages, users, navigate, onClose, openUser]
  );

  useEffect(() => {
    setActive(0);
  }, [query, items.length]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setActive((v) => Math.min(items.length - 1, v + 1));
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setActive((v) => Math.max(0, v - 1));
      }
      if (e.key === "Enter" && items[active]) {
        e.preventDefault();
        items[active].run();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, items, active, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[90] flex items-start justify-center pt-[12vh] px-4">
      <div className="absolute inset-0 bg-shell/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-[min(36rem,92vw)] surface-card rounded-3xl overflow-hidden shadow-2xl">
        <div className="flex items-center gap-3 px-4 py-3 border-b border-line">
          <Search size={16} className="text-muted" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="جستجوی صفحه، مشتری یا میانبر..."
            className="flex-1 bg-transparent outline-none text-ink"
          />
          <kbd className="kbd">Esc</kbd>
        </div>
        <div className="max-h-[22rem] overflow-y-auto py-2">
          {items.length === 0 && (
            <p className="text-sm text-muted text-center py-8">موردی پیدا نشد</p>
          )}
          {items.map((item, index) => {
            const Icon = item.icon;
            const showGroup =
              index === 0 || items[index - 1].group !== item.group;
            return (
              <div key={item.id}>
                {showGroup && (
                  <div className="px-4 pt-2 pb-1 text-[11px] text-muted">
                    {item.group}
                  </div>
                )}
                <button
                  type="button"
                  onMouseEnter={() => setActive(index)}
                  onClick={item.run}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 text-right ${
                    index === active ? "bg-brand-soft" : "hover:bg-paper"
                  }`}
                >
                  <span className="w-8 h-8 rounded-xl bg-paper text-brand flex items-center justify-center">
                    <Icon size={15} />
                  </span>
                  <span className="flex-1 min-w-0">
                    <span className="block text-sm font-medium text-ink truncate">
                      {item.title}
                    </span>
                    {item.hint && (
                      <span className="block text-xs text-muted truncate">
                        {item.hint}
                      </span>
                    )}
                  </span>
                </button>
              </div>
            );
          })}
        </div>
        <div className="px-4 py-2 border-t border-line text-[11px] text-muted flex items-center gap-3">
          <span>
            <kbd className="kbd">↑</kbd> <kbd className="kbd">↓</kbd> حرکت
          </span>
          <span>
            <kbd className="kbd">Enter</kbd> انتخاب
          </span>
        </div>
      </div>
    </div>
  );
}
