import { useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";
import {
  Bell,
  Copy,
  MessageCircle,
  MessageSquare,
  Phone,
} from "lucide-react";
import PageHeader from "../components/ui/PageHeader";
import EmptyState from "../components/ui/EmptyState";
import { useUsersStore } from "../store/users";
import { onAppDataChange, emitAppDataChange } from "../lib/bus";
import {
  DEFAULT_REMINDER_TEMPLATES,
  REMINDER_KIND_LABELS,
  REMINDER_KINDS,
  REMINDER_TEMPLATE_HINT,
} from "@shared/reminders";
import type {
  ReminderChannel,
  ReminderItem,
  ReminderKind,
  ReminderSnapshot,
} from "../global";

const emptySnapshot: ReminderSnapshot = {
  academyName: "هما",
  templates: { ...DEFAULT_REMINDER_TEMPLATES },
  counts: { session_tomorrow: 0, low_credit: 0, debt: 0 },
  pendingCounts: { session_tomorrow: 0, low_credit: 0, debt: 0 },
  items: [],
};

export default function Reminders() {
  const openUser = useUsersStore((s) => s.openUser);
  const [tab, setTab] = useState<ReminderKind>("session_tomorrow");
  const [snapshot, setSnapshot] = useState<ReminderSnapshot>(emptySnapshot);
  const [hideSent, setHideSent] = useState(true);
  const [templates, setTemplates] = useState(emptySnapshot.templates);
  const [academyName, setAcademyName] = useState("هما");
  const [busyKey, setBusyKey] = useState<string | null>(null);

  const load = async () => {
    const next = await window.electronAPI?.remindersSnapshot();
    if (!next) return;
    setSnapshot(next);
    setTemplates(next.templates);
    setAcademyName(next.academyName);
  };

  useEffect(() => {
    void load();
    return onAppDataChange(() => void load());
  }, []);

  const rows = useMemo(() => {
    return snapshot.items.filter((item) => {
      if (item.kind !== tab) return false;
      if (hideSent && item.sentAt) return false;
      return true;
    });
  }, [snapshot.items, tab, hideSent]);

  const send = async (item: ReminderItem, channel: ReminderChannel) => {
    setBusyKey(`${item.key}:${channel}`);
    try {
      if (channel === "copy") {
        await navigator.clipboard.writeText(item.message);
        toast.success("متن پیام کپی شد");
      } else {
        await window.electronAPI?.remindersOpen({
          channel,
          phone: item.phone,
          message: item.message,
        });
      }
      const next = await window.electronAPI?.remindersMarkSent({
        kind: item.kind,
        userId: item.userId,
        sessionId: item.sessionId,
        channel,
        message: item.message,
      });
      if (next) setSnapshot(next);
      emitAppDataChange();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "ارسال انجام نشد");
    } finally {
      setBusyKey(null);
    }
  };

  const copyAll = async () => {
    if (rows.length === 0) return;
    const text = rows
      .map(
        (item) =>
          `${item.firstName} ${item.lastName} (${item.phone})\n${item.message}`
      )
      .join("\n\n——\n\n");
    await navigator.clipboard.writeText(text);
    toast.success(
      `${rows.length.toLocaleString("fa-IR")} پیام در حافظه کپی شد`
    );
  };

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="ارتباط با مشتری"
        title="یادآوری پیامک و واتساپ"
        description="پیام‌ها روی همین رایانه ساخته می‌شوند و با واتساپ، پیامک سیستم یا کپی ارسال می‌گردند. سرور ابری در کار نیست."
        actions={
          <button className="btn btn-ghost" onClick={() => void copyAll()}>
            <Copy size={16} /> کپی همهٔ این فهرست
          </button>
        }
      />

      <div className="flex flex-wrap gap-2">
        {REMINDER_KINDS.map((kind) => (
          <button
            key={kind}
            className={`chip ${tab === kind ? "chip-on" : ""}`}
            onClick={() => setTab(kind)}
          >
            {REMINDER_KIND_LABELS[kind]}
            <span className="text-xs opacity-70">
              {snapshot.pendingCounts[kind].toLocaleString("fa-IR")}
            </span>
          </button>
        ))}
        <label className="mr-auto text-sm text-muted inline-flex items-center gap-2">
          <input
            type="checkbox"
            checked={hideSent}
            onChange={(e) => setHideSent(e.target.checked)}
          />
          ارسال‌شدهٔ امروز پنهان شود
        </label>
      </div>

      {rows.length === 0 ? (
        <div className="surface-card rounded-3xl">
          <EmptyState
            icon={<Bell size={22} />}
            title="موردی برای ارسال نیست"
            description={
              hideSent
                ? "یا کسی در این دسته نیست، یا امروز برای همه ارسال شده است."
                : "در این دسته مشتری یا جلسه‌ای پیدا نشد."
            }
          />
        </div>
      ) : (
        <div className="space-y-3">
          {rows.map((item) => (
            <div
              key={item.key}
              className="surface-card rounded-3xl p-4 space-y-3"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <button
                  type="button"
                  className="text-right"
                  onClick={() => openUser(item.userId)}
                >
                  <div className="font-semibold text-ink">
                    {item.firstName} {item.lastName}
                  </div>
                  <p className="text-sm text-muted mt-0.5">{item.subtitle}</p>
                </button>
                <a
                  href={`tel:${item.phone}`}
                  className="text-sm text-muted inline-flex items-center gap-1"
                  dir="ltr"
                >
                  <Phone size={14} /> {item.phone}
                </a>
              </div>
              <pre className="whitespace-pre-wrap text-sm bg-paper border border-line rounded-2xl p-3 font-sans text-ink">
                {item.message}
              </pre>
              <div className="flex flex-wrap gap-2">
                <button
                  className="btn btn-success"
                  disabled={busyKey !== null || !item.whatsappUrl}
                  onClick={() => void send(item, "whatsapp")}
                >
                  <MessageCircle size={16} /> واتساپ
                </button>
                <button
                  className="btn btn-primary"
                  disabled={busyKey !== null || !item.smsUrl}
                  onClick={() => void send(item, "sms")}
                >
                  <MessageSquare size={16} /> پیامک
                </button>
                <button
                  className="btn btn-ghost"
                  disabled={busyKey !== null}
                  onClick={() => void send(item, "copy")}
                >
                  <Copy size={16} /> کپی متن
                </button>
                {item.sentAt && (
                  <span className="text-xs text-success self-center">
                    امروز ارسال شد
                  </span>
                )}
                {!item.whatsappUrl && (
                  <span className="text-xs text-danger self-center">
                    شماره برای واتساپ/پیامک معتبر نیست
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <section className="surface-card rounded-3xl p-6 space-y-4">
        <h2 className="font-semibold text-ink">متن پیام‌ها</h2>
        <p className="text-sm text-muted">{REMINDER_TEMPLATE_HINT}</p>
        <label className="block text-sm text-muted">
          نام آموزشگاه
          <input
            className="mt-1 w-full rounded-2xl border border-line px-3 py-2.5 text-ink"
            value={academyName}
            onChange={(e) => setAcademyName(e.target.value)}
          />
        </label>
        {REMINDER_KINDS.map((kind) => (
          <label key={kind} className="block text-sm text-muted">
            {REMINDER_KIND_LABELS[kind]}
            <textarea
              rows={4}
              className="mt-1 w-full rounded-2xl border border-line px-3 py-2.5 text-ink"
              value={templates[kind]}
              onChange={(e) =>
                setTemplates((prev) => ({ ...prev, [kind]: e.target.value }))
              }
            />
          </label>
        ))}
        <button
          className="btn btn-primary"
          onClick={async () => {
            await window.electronAPI?.settingsSet({
              academyName,
              reminderTemplates: templates,
            });
            toast.success("متن پیام‌ها ذخیره شد");
            await load();
          }}
        >
          ذخیره متن‌ها
        </button>
      </section>
    </div>
  );
}
