import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { DoorOpen, GraduationCap, Layers, Plus, Trash2 } from "lucide-react";
import PageHeader from "../components/ui/PageHeader";
import { useAcademyStore } from "../store/academy";
import { onAppDataChange, emitAppDataChange } from "../lib/bus";
import type { AcademySnapshot } from "../global";

const COLORS = ["#14635c", "#c4893a", "#3d5a80", "#7a3e65", "#2f7d57", "#8a4b2a"];

export default function Academy() {
  const { rooms, instructors, templates, load } = useAcademyStore();
  const [tab, setTab] = useState<"rooms" | "instructors" | "templates">("rooms");

  useEffect(() => {
    void load();
    return onAppDataChange(() => void load());
  }, [load]);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="ساختار آموزشگاه"
        title="کلاس‌ها و مربیان"
        description="چند کلاس همزمان، ظرفیت هر اتاق، مربیان و بسته‌های آماده دوره."
      />
      <div className="flex flex-wrap gap-2">
        {(
          [
            ["rooms", "کلاس‌ها", DoorOpen],
            ["instructors", "مربیان", GraduationCap],
            ["templates", "بسته‌ها", Layers],
          ] as const
        ).map(([id, label, Icon]) => (
          <button
            key={id}
            className={`chip ${tab === id ? "chip-on" : ""}`}
            onClick={() => setTab(id)}
          >
            <Icon size={14} /> {label}
          </button>
        ))}
      </div>
      {tab === "rooms" && <RoomsPanel rooms={rooms} onSaved={load} />}
      {tab === "instructors" && (
        <InstructorsPanel instructors={instructors} onSaved={load} />
      )}
      {tab === "templates" && (
        <TemplatesPanel templates={templates} onSaved={load} />
      )}
    </div>
  );
}

function RoomsPanel({
  rooms,
  onSaved,
}: {
  rooms: AcademySnapshot["rooms"];
  onSaved: () => Promise<void>;
}) {
  const [name, setName] = useState("");
  const [capacity, setCapacity] = useState(8);
  const [color, setColor] = useState(COLORS[0]);

  return (
    <div className="grid lg:grid-cols-[20rem_1fr] gap-4">
      <form
        className="surface-card rounded-3xl p-5 space-y-3"
        onSubmit={async (e) => {
          e.preventDefault();
          try {
            await window.electronAPI?.academySaveRoom({ name, color, capacity });
            setName("");
            toast.success("کلاس ذخیره شد");
            emitAppDataChange();
            await onSaved();
          } catch (err) {
            toast.error(err instanceof Error ? err.message : "خطا");
          }
        }}
      >
        <h3 className="font-semibold">کلاس جدید</h3>
        <input
          className="w-full rounded-2xl border border-line px-3 py-2.5"
          placeholder="نام کلاس"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <input
          type="number"
          min={1}
          className="w-full rounded-2xl border border-line px-3 py-2.5"
          value={capacity}
          onChange={(e) => setCapacity(Number(e.target.value))}
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
          <Plus size={16} /> افزودن کلاس
        </button>
      </form>
      <div className="grid sm:grid-cols-2 gap-3">
        {rooms.map((room) => (
          <div key={room.id} className="surface-card rounded-3xl p-4 flex items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full" style={{ background: room.color }} />
                <div className="font-semibold">{room.name}</div>
              </div>
              <p className="text-sm text-muted mt-1">
                ظرفیت {room.capacity.toLocaleString("fa-IR")} نفر در هر ساعت
              </p>
            </div>
            <button
              className="text-danger"
              onClick={async () => {
                await window.electronAPI?.academyDeleteRoom(room.id);
                emitAppDataChange();
                await onSaved();
              }}
            >
              <Trash2 size={16} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

function InstructorsPanel({
  instructors,
  onSaved,
}: {
  instructors: AcademySnapshot["instructors"];
  onSaved: () => Promise<void>;
}) {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [color, setColor] = useState(COLORS[1]);

  return (
    <div className="grid lg:grid-cols-[20rem_1fr] gap-4">
      <form
        className="surface-card rounded-3xl p-5 space-y-3"
        onSubmit={async (e) => {
          e.preventDefault();
          try {
            await window.electronAPI?.academySaveInstructor({
              firstName,
              lastName,
              color,
            });
            setFirstName("");
            setLastName("");
            toast.success("مربی ذخیره شد");
            emitAppDataChange();
            await onSaved();
          } catch (err) {
            toast.error(err instanceof Error ? err.message : "خطا");
          }
        }}
      >
        <h3 className="font-semibold">مربی جدید</h3>
        <input className="w-full rounded-2xl border border-line px-3 py-2.5" placeholder="نام" value={firstName} onChange={(e) => setFirstName(e.target.value)} />
        <input className="w-full rounded-2xl border border-line px-3 py-2.5" placeholder="نام خانوادگی" value={lastName} onChange={(e) => setLastName(e.target.value)} />
        <div className="flex flex-wrap gap-2">
          {COLORS.map((item) => (
            <button key={item} type="button" className={`w-7 h-7 rounded-full ${color === item ? "ring-2 ring-ink" : ""}`} style={{ background: item }} onClick={() => setColor(item)} />
          ))}
        </div>
        <button className="btn btn-primary w-full"><Plus size={16} /> افزودن مربی</button>
      </form>
      <div className="grid sm:grid-cols-2 gap-3">
        {instructors.map((item) => (
          <div key={item.id} className="surface-card rounded-3xl p-4 flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full" style={{ background: item.color }} />
                <div className="font-semibold">{item.firstName} {item.lastName}</div>
              </div>
              {item.phone && <p className="text-sm text-muted mt-1" dir="ltr">{item.phone}</p>}
            </div>
            <button className="text-danger" onClick={async () => { await window.electronAPI?.academyDeleteInstructor(item.id); emitAppDataChange(); await onSaved(); }}>
              <Trash2 size={16} />
            </button>
          </div>
        ))}
        {instructors.length === 0 && (
          <p className="text-muted text-sm">هنوز مربی ثبت نشده است.</p>
        )}
      </div>
    </div>
  );
}

function TemplatesPanel({
  templates,
  onSaved,
}: {
  templates: AcademySnapshot["templates"];
  onSaved: () => Promise<void>;
}) {
  const [name, setName] = useState("");
  const [sessions, setSessions] = useState(8);
  const [cost, setCost] = useState(0);

  return (
    <div className="grid lg:grid-cols-[20rem_1fr] gap-4">
      <form
        className="surface-card rounded-3xl p-5 space-y-3"
        onSubmit={async (e) => {
          e.preventDefault();
          try {
            await window.electronAPI?.academySaveTemplate({ name, sessions, cost });
            setName("");
            toast.success("بسته ذخیره شد");
            emitAppDataChange();
            await onSaved();
          } catch (err) {
            toast.error(err instanceof Error ? err.message : "خطا");
          }
        }}
      >
        <h3 className="font-semibold">بسته دوره</h3>
        <input className="w-full rounded-2xl border border-line px-3 py-2.5" placeholder="مثلاً پکیج ۸ جلسه پیانو" value={name} onChange={(e) => setName(e.target.value)} />
        <input type="number" min={1} className="w-full rounded-2xl border border-line px-3 py-2.5" value={sessions} onChange={(e) => setSessions(Number(e.target.value))} />
        <input type="number" min={0} className="w-full rounded-2xl border border-line px-3 py-2.5" value={cost} onChange={(e) => setCost(Number(e.target.value))} />
        <button className="btn btn-primary w-full"><Plus size={16} /> افزودن بسته</button>
      </form>
      <div className="grid sm:grid-cols-2 gap-3">
        {templates.map((item) => (
          <div key={item.id} className="surface-card rounded-3xl p-4 flex items-start justify-between">
            <div>
              <div className="font-semibold">{item.name}</div>
              <p className="text-sm text-muted mt-1">
                {item.sessions.toLocaleString("fa-IR")} جلسه · {item.cost.toLocaleString("fa-IR")} تومان
              </p>
            </div>
            <button className="text-danger" onClick={async () => { await window.electronAPI?.academyDeleteTemplate(item.id); emitAppDataChange(); await onSaved(); }}>
              <Trash2 size={16} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
