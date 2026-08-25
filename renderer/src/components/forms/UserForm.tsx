import { useState, useEffect, useCallback } from "react";
import { useUsersStore } from "../../store/users";
import {
  CreditCard,
  User,
  Phone,
  IdCard,
  Plus,
  Minus,
  ArrowLeft,
} from "lucide-react";
import WeeklyCalendar, { RecordItem } from "../WeeklyCalendar";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";

interface FormState {
  firstName: string;
  lastName: string;
  phone: string;
  nationalId: string;
  sessions: number;
  cost: string;
  uidCart: string;
}

function sameHour(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate() &&
    a.getHours() === b.getHours()
  );
}

export default function UserForm({ onCancel }: { onCancel: () => void }) {
  const {
    user,
    editingUser,
    addUser,
    updateUser,
    setCapturingUid,
  } = useUsersStore();
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState<FormState>({
    firstName: "",
    lastName: "",
    phone: "",
    nationalId: "",
    sessions: 0,
    cost: "",
    uidCart: "",
  });

  const [records, setRecords] = useState<RecordItem[]>([]);

  const updateField = (key: keyof FormState, value: string | number) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  useEffect(() => {
    setCapturingUid(true);
    return () => setCapturingUid(false);
  }, [setCapturingUid]);

  useEffect(() => {
    if (editingUser && user) {
      setForm({
        firstName: user.firstName,
        lastName: user.lastName,
        phone: user.phone,
        nationalId: user.nationalId,
        sessions: user.course?.totalSessions ?? 0,
        cost: user.course?.cost?.toLocaleString() ?? "",
        uidCart: user.uidCart || "",
      });

      setRecords(
        user.course?.sessions?.map((s) => ({ ...s, userId: user.id })) ?? []
      );
    } else if (!editingUser) {
      setForm({
        firstName: "",
        lastName: "",
        phone: "",
        nationalId: "",
        sessions: 0,
        cost: "",
        uidCart: "",
      });
      setRecords([]);
    }
  }, [editingUser, user]);

  useEffect(() => {
    if (form.sessions < records.length) {
      const diff = records.length - form.sessions;
      setRecords((prev) => prev.slice(0, prev.length - diff));
    }
  }, [form.sessions, records.length]);

  useEffect(() => {
    const onCard = (uid: string) => {
      setForm((prev) => ({ ...prev, uidCart: uid }));
    };
    window.electronAPI?.ipcRenderer.on("rfid-card-present", onCard);
    return () => {
      window.electronAPI?.ipcRenderer.removeListener(
        "rfid-card-present",
        onCard
      );
    };
  }, []);

  const submit = async (e?: React.FormEvent) => {
    e?.preventDefault();

    if (!form.firstName.trim() || !form.lastName.trim()) {
      toast.error("نام و نام‌خانوادگی را وارد کنید.");
      return;
    }
    if (!form.phone.trim()) {
      toast.error("شماره تماس را وارد کنید.");
      return;
    }
    if (!form.nationalId.trim()) {
      toast.error("کد ملی را وارد کنید.");
      return;
    }

    const payload = {
      firstName: form.firstName.trim(),
      lastName: form.lastName.trim(),
      phone: form.phone.trim(),
      nationalId: form.nationalId.trim(),
      sessions: form.sessions,
      cost: parseInt(form.cost.replaceAll(",", "") || "0", 10),
      uidCart: form.uidCart,
    };

    setSaving(true);
    try {
      if (editingUser && user) {
        await updateUser(
          { ...payload, id: user.id },
          {
            cost: payload.cost,
            sessions: payload.sessions,
            id: user.course?.id || -1,
          },
          records.map((r) => ({
            ...r,
            courseId: user.course?.id || -1,
          }))
        );
        toast.success("مشتری به‌روزرسانی شد");
      } else {
        await addUser(
          {
            firstName: payload.firstName,
            lastName: payload.lastName,
            phone: payload.phone,
            nationalId: payload.nationalId,
            uidCart: payload.uidCart,
          },
          { sessions: payload.sessions, cost: payload.cost },
          records.map((r) => new Date(r.date).toISOString())
        );
        toast.success("مشتری جدید ذخیره شد");
      }
      onCancel();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "خطا در ذخیره اطلاعات";
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  const handleAddOrRemoveRecord = useCallback(
    (date: Date) => {
      const exist = records.find((r) => sameHour(new Date(r.date), date));

      if (exist) {
        setRecords((prev) => prev.filter((r) => r.id !== exist.id));
        return;
      }
      if (form.sessions > records.length) {
        setRecords((prev) => [
          ...prev,
          {
            id: Date.now(),
            date: date.toISOString(),
            used: 0,
            usedAt: null,
            userId: user?.id ?? -1,
          },
        ]);
      } else {
        toast.error("تاریخ تمام جلسات تنظیم شد.");
      }
    },
    [records, user, form.sessions]
  );

  if (editingUser && !user) {
    return (
      <div className="bg-white rounded-3xl p-10 max-w-4xl mx-auto text-center text-slate-500">
        در حال بارگذاری...
      </div>
    );
  }

  return (
    <div className="bg-white shadow-[0_8px_30px_rgb(0,0,0,0.08)] rounded-3xl p-10 max-w-4xl mx-auto border border-slate-100">
      <div className="mb-10 flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold bg-linear-to-r from-indigo-600 to-sky-500 bg-clip-text text-transparent">
            {editingUser ? "ویرایش مشتری" : "مشتری جدید"}
          </h2>
          <p className="text-slate-500 mt-1 text-sm">
            اطلاعات مشتری را وارد کنید
          </p>
        </div>

        <Link
          to="/users"
          className="inline-flex items-center gap-2 bg-linear-to-r from-sky-500 to-indigo-600 text-white px-4 py-2 rounded-lg shadow-md hover:shadow-lg"
        >
          بازگشت <ArrowLeft size={16} />
        </Link>
      </div>

      <form onSubmit={submit} className="space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
          <Field
            label="نام"
            value={form.firstName}
            onChange={(v) => updateField("firstName", v)}
            icon={<User size={18} className="text-slate-400" />}
          />
          <Field
            label="نام خانوادگی"
            value={form.lastName}
            onChange={(v) => updateField("lastName", v)}
            icon={<User size={18} className="text-slate-400" />}
          />
          <Field
            label="شماره تلفن"
            value={form.phone}
            onChange={(v) => updateField("phone", v)}
            icon={<Phone size={18} className="text-slate-400" />}
          />
          <Field
            label="کد ملی"
            value={form.nationalId}
            onChange={(v) => updateField("nationalId", v)}
            icon={<IdCard size={18} className="text-slate-400" />}
          />
          <Field
            label="هزینه (تومان)"
            value={parseInt(
              form.cost.replaceAll(",", "") || "0",
              10
            ).toLocaleString()}
            onChange={(v) => updateField("cost", v)}
            icon={<CreditCard size={18} className="text-slate-400" />}
          />
          {form.uidCart ? (
            editingUser ? (
              <div className="text-emerald-600">
                کارت فعلی ثبت شده. برای تعویض، کارت جدید را روی دستگاه بگذارید
              </div>
            ) : (
              <div className="text-emerald-600">کارت شناسایی شد</div>
            )
          ) : (
            <div className="text-red-500">کارت را در دستگاه بگذارید</div>
          )}
        </div>

        <div className="flex items-center justify-between bg-slate-50 border border-slate-200 rounded-xl p-4">
          <span className="text-slate-700 font-medium">تعداد جلسات</span>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() =>
                updateField("sessions", Math.max(0, form.sessions - 1))
              }
              className="w-10 h-10 flex items-center justify-center bg-white border border-slate-300 rounded-xl hover:bg-slate-100 transition"
            >
              <Minus size={18} />
            </button>

            <div className="text-xl font-semibold w-12 text-center">
              {form.sessions}
            </div>

            <button
              type="button"
              onClick={() => updateField("sessions", form.sessions + 1)}
              className="w-10 h-10 flex items-center justify-center bg-white border border-slate-300 rounded-xl hover:bg-slate-100 transition"
            >
              <Plus size={18} />
            </button>
          </div>
        </div>

        <WeeklyCalendar
          records={records}
          currentUserId={user?.id}
          onAddEvent={handleAddOrRemoveRecord}
        />

        <div className="flex justify-end gap-4 pt-4">
          <button
            type="button"
            onClick={onCancel}
            className="px-5 py-2.5 rounded-xl border border-slate-300 text-slate-600 hover:bg-slate-100 transition shadow-sm"
          >
            انصراف
          </button>

          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2.5 rounded-xl text-white bg-linear-to-r from-sky-500 to-indigo-600 shadow-md hover:shadow-lg transition disabled:opacity-60"
          >
            {saving ? "در حال ذخیره..." : "ذخیره"}
          </button>
        </div>
      </form>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  icon,
}: {
  label: string;
  value: string | number;
  onChange: (v: string) => void;
  icon: JSX.Element;
}) {
  return (
    <div className="space-y-1">
      <label className="text-sm text-slate-500">{label}</label>

      <div className="flex items-center gap-2 rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 focus-within:border-indigo-500 focus-within:bg-white transition">
        {icon}
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="flex-1 bg-transparent outline-none text-slate-700"
        />
      </div>
    </div>
  );
}
