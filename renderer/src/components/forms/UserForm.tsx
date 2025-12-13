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
import WeeklyCalendar, { RecordItem } from "../WeeklyCalendarComponent.";
import { Link } from "react-router-dom";

interface FormState {
  firstName: string;
  lastName: string;
  phone: string;
  nationalId: string;
  sessions: number;
  cost: string;
}

export default function UserForm({ onCancel }: { onCancel: () => void }) {
  const { user, editingUser, addUser, updateUser, clearUser } = useUsersStore();

  const [form, setForm] = useState<FormState>({
    firstName: "",
    lastName: "",
    phone: "",
    nationalId: "",
    sessions: 0,
    cost: "",
  });

  const [records, setRecords] = useState<RecordItem[]>([]);

  const updateField = (key: keyof FormState, value: string | number) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  /** مقداردهی اولیه هنگام ویرایش */
  useEffect(() => {
    if (editingUser && user) {
      setForm({
        firstName: user.firstName,
        lastName: user.lastName,
        phone: user.phone,
        nationalId: user.nationalId,
        sessions: user.course?.totalSessions ?? 0,
        cost: user.course?.cost?.toLocaleString() ?? "",
      });

      setRecords(
        user.course?.sessions?.map((s) => ({ ...s, userId: user.id })) ?? []
      );
    } else {
      setForm({
        firstName: "",
        lastName: "",
        phone: "",
        nationalId: "",
        sessions: 0,
        cost: "",
      });
      setRecords([]);
      clearUser();
    }
  }, [editingUser]);

  useEffect(() => {
    if (form.sessions < records.length) {
      const diff = records.length - form.sessions;

      setRecords((prev) => prev.slice(0, prev.length - diff));
    }
  }, [form.sessions]);

  /** ثبت فرم */
  const submit = (e?: React.FormEvent) => {
    e?.preventDefault();

    if (!form.firstName.trim() || !form.lastName.trim()) {
      return alert("نام و نام‌خانوادگی را وارد کنید.");
    }
    if (!form.phone.trim()) {
      return alert("شماره تماس را وارد کنید.");
    }
    if (!form.nationalId.trim()) {
      return alert("کد ملی را وارد کنید.");
    }

    const payload = {
      firstName: form.firstName.trim(),
      lastName: form.lastName.trim(),
      phone: form.phone.trim(),
      nationalId: form.nationalId.trim(),
      sessions: form.sessions,
      cost: parseInt(form.cost.replaceAll(",", "") || "0"),
    };

    if (editingUser && user) {
      updateUser(
        { ...payload, id: user.id },
        {
          cost: payload.cost,
          sessions: payload.sessions,
          id: user.course?.id || -1,
        },
        records.map((r) => {
          return { ...r, courseId: user.course?.id || -1 };
        })
      );
    } else {
      addUser(
        {
          firstName: payload.firstName,
          lastName: payload.lastName,
          phone: payload.phone,
          nationalId: payload.nationalId,
        },
        { sessions: payload.sessions, cost: payload.cost },
        records.map((r) => r.date.toString())
      );
    }

    onCancel();
  };

  /** مدیریت کلیک روی تقویم */
  const handleAddOrRemoveRecord = useCallback(
    (date: Date) => {
      const iso = date.toLocaleString();
      const exist = records.find(
        (r) => new Date(r.date).toLocaleString() === iso
      );
      console.log("🚀 ~ iso:", iso);
      console.log("🚀 ~ records:", records);

      if (exist) {
        setRecords((prev) => prev.filter((r) => r.id !== exist.id));
        return;
      }
      if (form.sessions > records.length) {
        setRecords((prev) => [
          ...prev,
          {
            id: Date.now(),
            date: iso,
            used: 0,
            usedAt: null,
            userId: user?.id ?? -1,
          },
        ]);
      } else {
        return alert("تاریخ تمام جلسات تنظیم شد.");
      }
    },
    [records, user, form.sessions]
  );

  return (
    <div className="bg-white shadow-[0_8px_30px_rgb(0,0,0,0.08)] rounded-3xl p-10 max-w-4xl mx-auto border border-slate-100">
      {/* Header */}
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
        {/* Inputs */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
              form.cost.replaceAll(",", "") || "0"
            ).toLocaleString()}
            onChange={(v) => updateField("cost", v)}
            icon={<CreditCard size={18} className="text-slate-400" />}
          />
        </div>

        {/* Sessions Counter */}
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

        {/* Weekly calendar */}
        <WeeklyCalendar
          records={records}
          currentUserId={user?.id}
          onAddEvent={handleAddOrRemoveRecord}
        />

        {/* Buttons */}
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
            className="px-6 py-2.5 rounded-xl text-white bg-linear-to-r from-sky-500 to-indigo-600 shadow-md hover:shadow-lg transition"
          >
            ذخیره
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
