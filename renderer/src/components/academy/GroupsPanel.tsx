import { useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";
import { Plus, Trash2, Users, CalendarPlus } from "lucide-react";
import { WEEKDAY_LABELS } from "@shared/dates";
import { emitAppDataChange } from "../../lib/bus";
import { toDateInputValue } from "../../lib/format";
import type {
  AcademySnapshot,
  ClassGroupDetail,
  UserFindAllItem,
} from "../../global";

const COLORS = ["#14635c", "#c4893a", "#3d5a80", "#7a3e65", "#2f7d57", "#8a4b2a"];
const HOURS = Array.from({ length: 15 }, (_, i) => i + 8);

export default function GroupsPanel({
  groups,
  rooms,
  instructors,
  templates,
  onSaved,
}: {
  groups: ClassGroupDetail[];
  rooms: AcademySnapshot["rooms"];
  instructors: AcademySnapshot["instructors"];
  templates: AcademySnapshot["templates"];
  onSaved: () => Promise<void>;
}) {
  const [name, setName] = useState("");
  const [roomId, setRoomId] = useState<number | "">("");
  const [instructorId, setInstructorId] = useState<number | "">("");
  const [templateId, setTemplateId] = useState<number | "">("");
  const [weekdays, setWeekdays] = useState<number[]>([0]);
  const [hour, setHour] = useState(16);
  const [sessions, setSessions] = useState(8);
  const [cost, setCost] = useState(0);
  const [color, setColor] = useState(COLORS[0]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [query, setQuery] = useState("");
  const [hits, setHits] = useState<UserFindAllItem[]>([]);
  const [paidNow, setPaidNow] = useState(true);
  const [startDate, setStartDate] = useState(toDateInputValue());
  const [busy, setBusy] = useState(false);

  const selected = groups.find((group) => group.id === selectedId) ?? groups[0];

  useEffect(() => {
    if (selectedId == null && groups[0]) setSelectedId(groups[0].id);
  }, [groups, selectedId]);

  useEffect(() => {
    const term = query.trim();
    if (term.length < 2) {
      setHits([]);
      return;
    }
    const handle = window.setTimeout(async () => {
      const result = await window.electronAPI?.getUsers(1, 8, term, "all");
      setHits(result?.data ?? []);
    }, 180);
    return () => window.clearTimeout(handle);
  }, [query]);

  const memberIds = useMemo(
    () => new Set(selected?.members.map((member) => member.userId) ?? []),
    [selected]
  );

  const toggleDay = (day: number) => {
    setWeekdays((prev) =>
      prev.includes(day) ? prev.filter((item) => item !== day) : [...prev, day].sort()
    );
  };

  return (
    <div className="grid lg:grid-cols-[20rem_1fr] gap-4">
      <form
        className="surface-card rounded-3xl p-5 space-y-3"
        onSubmit={async (e) => {
          e.preventDefault();
          try {
            const group = await window.electronAPI?.academySaveGroup({
              name,
              roomId: roomId === "" ? null : roomId,
              instructorId: instructorId === "" ? null : instructorId,
              templateId: templateId === "" ? null : templateId,
              weekdays,
              hour,
              sessions,
              cost,
              color,
            });
            setName("");
            toast.success("گروه ذخیره شد");
            emitAppDataChange();
            await onSaved();
            if (group?.id) setSelectedId(group.id);
          } catch (err) {
            toast.error(err instanceof Error ? err.message : "خطا");
          }
        }}
      >
        <h3 className="font-semibold">گروه جدید</h3>
        <input
          className="w-full rounded-2xl border border-line px-3 py-2.5"
          placeholder="مثلاً پیانو کودکان"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <select
          className="w-full rounded-2xl border border-line px-3 py-2.5 bg-surface"
          value={roomId}
          onChange={(e) => {
            const next = e.target.value ? Number(e.target.value) : "";
            setRoomId(next);
            const room = rooms.find((item) => item.id === next);
            if (room) setColor(room.color);
          }}
        >
          <option value="">کلاس</option>
          {rooms.map((room) => (
            <option key={room.id} value={room.id}>
              {room.name} ({room.capacity.toLocaleString("fa-IR")} نفر)
            </option>
          ))}
        </select>
        <select
          className="w-full rounded-2xl border border-line px-3 py-2.5 bg-surface"
          value={instructorId}
          onChange={(e) =>
            setInstructorId(e.target.value ? Number(e.target.value) : "")
          }
        >
          <option value="">مربی</option>
          {instructors.map((item) => (
            <option key={item.id} value={item.id}>
              {item.firstName} {item.lastName}
            </option>
          ))}
        </select>
        <select
          className="w-full rounded-2xl border border-line px-3 py-2.5 bg-surface"
          value={templateId}
          onChange={(e) => {
            const next = e.target.value ? Number(e.target.value) : "";
            setTemplateId(next);
            const template = templates.find((item) => item.id === next);
            if (template) {
              setSessions(template.sessions);
              setCost(template.cost);
            }
          }}
        >
          <option value="">بسته دوره</option>
          {templates.map((item) => (
            <option key={item.id} value={item.id}>
              {item.name}
            </option>
          ))}
        </select>
        <div className="flex flex-wrap gap-1">
          {WEEKDAY_LABELS.map((label, day) => (
            <button
              key={label}
              type="button"
              className={`chip ${weekdays.includes(day) ? "chip-on" : ""}`}
              onClick={() => toggleDay(day)}
            >
              {label}
            </button>
          ))}
        </div>
        <div className="grid grid-cols-2 gap-2">
          <select
            className="rounded-2xl border border-line px-3 py-2.5 bg-surface"
            value={hour}
            onChange={(e) => setHour(Number(e.target.value))}
          >
            {HOURS.map((item) => (
              <option key={item} value={item}>
                {item.toLocaleString("fa-IR")}:۰۰
              </option>
            ))}
          </select>
          <input
            type="number"
            min={1}
            className="rounded-2xl border border-line px-3 py-2.5"
            value={sessions}
            onChange={(e) => setSessions(Number(e.target.value))}
          />
        </div>
        <input
          type="number"
          min={0}
          className="w-full rounded-2xl border border-line px-3 py-2.5"
          placeholder="هزینه هر نفر"
          value={cost}
          onChange={(e) => setCost(Number(e.target.value))}
        />
        <div className="flex flex-wrap gap-2">
          {COLORS.map((item) => (
            <button
              key={item}
              type="button"
              className={`w-7 h-7 rounded-full ${color === item ? "ring-2 ring-ink" : ""}`}
              style={{ background: item }}
              onClick={() => setColor(item)}
            />
          ))}
        </div>
        <button className="btn btn-primary w-full">
          <Plus size={16} /> ساخت گروه
        </button>
      </form>

      <div className="space-y-3">
        {groups.length === 0 && (
          <p className="text-muted text-sm surface-card rounded-3xl p-6">
            هنوز گروهی نیست. یک نام، کلاس و روز هفته بگذارید تا برای همه اعضا یکجا جلسه ساخته شود.
          </p>
        )}
        <div className="grid sm:grid-cols-2 gap-3">
          {groups.map((group) => (
            <div
              key={group.id}
              className={`surface-card rounded-3xl p-4 ${
                selected?.id === group.id ? "ring-2 ring-brand" : ""
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <button
                  type="button"
                  className="text-right flex-1 min-w-0"
                  onClick={() => setSelectedId(group.id)}
                >
                  <div className="flex items-center gap-2">
                    <span
                      className="w-3 h-3 rounded-full"
                      style={{ background: group.color || group.roomColor || COLORS[0] }}
                    />
                    <div className="font-semibold">{group.name}</div>
                  </div>
                  <p className="text-sm text-muted mt-1">
                    {[
                      group.roomName,
                      group.instructorName,
                      `${group.memberCount.toLocaleString("fa-IR")} عضو`,
                    ]
                      .filter(Boolean)
                      .join(" · ")}
                  </p>
                  <p className="text-xs text-muted mt-1">
                    {group.weekdays.map((day) => WEEKDAY_LABELS[day]).join("، ") || "بدون روز"}
                    {group.hour != null
                      ? ` · ${group.hour.toLocaleString("fa-IR")}:۰۰`
                      : ""}
                  </p>
                </button>
                <button
                  type="button"
                  className="text-danger"
                  onClick={async () => {
                    await window.electronAPI?.academyDeleteGroup(group.id);
                    if (selectedId === group.id) setSelectedId(null);
                    emitAppDataChange();
                    await onSaved();
                  }}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>

        {selected && (
          <div className="surface-card rounded-3xl p-5 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="font-semibold inline-flex items-center gap-2">
                <Users size={16} /> اعضای {selected.name}
              </div>
              <label className="text-sm text-muted inline-flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={paidNow}
                  onChange={(e) => setPaidNow(e.target.checked)}
                />
                هزینه عضو جدید پرداخت شد
              </label>
            </div>
            <input
              className="w-full rounded-2xl border border-line px-3 py-2.5"
              placeholder="جستجوی مشتری برای افزودن"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            {hits.length > 0 && (
              <div className="rounded-2xl border border-line divide-y divide-line">
                {hits.map((user) => (
                  <button
                    key={user.id}
                    type="button"
                    disabled={memberIds.has(user.id) || busy}
                    className="w-full text-right px-3 py-2 text-sm hover:bg-paper disabled:opacity-40"
                    onClick={async () => {
                      setBusy(true);
                      try {
                        await window.electronAPI?.academyAddGroupMember(
                          selected.id,
                          user.id,
                          paidNow
                        );
                        setQuery("");
                        setHits([]);
                        toast.success("عضو اضافه شد");
                        emitAppDataChange();
                        await onSaved();
                      } catch (err) {
                        toast.error(err instanceof Error ? err.message : "خطا");
                      } finally {
                        setBusy(false);
                      }
                    }}
                  >
                    {user.firstName} {user.lastName}
                    <span className="text-muted mr-2" dir="ltr">
                      {user.phone}
                    </span>
                  </button>
                ))}
              </div>
            )}
            <div className="space-y-2">
              {selected.members.length === 0 && (
                <p className="text-sm text-muted">هنوز عضوی ندارد.</p>
              )}
              {selected.members.map((member) => (
                <div
                  key={member.id}
                  className="flex items-center justify-between rounded-2xl border border-line px-3 py-2 text-sm"
                >
                  <div>
                    {member.firstName} {member.lastName}
                    <span className="text-muted mr-2">
                      {member.remainingSessions.toLocaleString("fa-IR")} جلسه مانده
                    </span>
                  </div>
                  <button
                    className="text-danger"
                    onClick={async () => {
                      await window.electronAPI?.academyRemoveGroupMember(
                        selected.id,
                        member.userId
                      );
                      emitAppDataChange();
                      await onSaved();
                    }}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
            <div className="flex flex-wrap items-end gap-2 pt-2 border-t border-line">
              <label className="text-sm text-muted">
                از تاریخ
                <input
                  type="date"
                  className="mt-1 block rounded-2xl border border-line px-3 py-2"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </label>
              <button
                type="button"
                className="btn btn-gold"
                disabled={busy}
                onClick={async () => {
                  setBusy(true);
                  try {
                    const result =
                      await window.electronAPI?.academyGenerateGroupSessions({
                        groupId: selected.id,
                        startDate,
                      });
                    toast.success(
                      result?.created
                        ? `${result.created.toLocaleString("fa-IR")} جلسه برای گروه ساخته شد`
                        : "جلسه‌ای برای ساختن نماند"
                    );
                    emitAppDataChange();
                    await onSaved();
                  } catch (err) {
                    toast.error(err instanceof Error ? err.message : "خطا");
                  } finally {
                    setBusy(false);
                  }
                }}
              >
                <CalendarPlus size={16} /> تولید جلسات برای همه
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
