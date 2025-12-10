import { useState, useEffect } from "react";
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
import WeeklyCalendar from "../WeeklyCalendarComponent.";
import { Link } from "react-router-dom";

export default function UserForm({ onCancel }: { onCancel: () => void }) {
  const { user, editingUser, addUser, updateUser, getUser } = useUsersStore();

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [nationalId, setNationalId] = useState("");
  const [sessions, setSessions] = useState(0);
  const [cost, setCost] = useState("");
  const [records, setRecords] = useState<
    {
      id: number;
      date: string | Date;
      used: boolean;
      usedAt: string | Date | null;
      userId: number;
    }[]
  >([]);

  useEffect(() => {
    if (editingUser && user) {
      setFirstName(user.firstName || "");
      setLastName(user.lastName || "");
      setPhone(user.phone || "");
      setNationalId(user.nationalId || "");
      setSessions(user.course?.totalSessions || 0);
      setCost(user.course?.cost.toLocaleString() || "");
      if (user.course?.sessions) {
        setRecords(
          user.course.sessions.map((u) => {
            return { ...u, userId: user.id };
          })
        );
      }
      getUser(user.id);
    } else {
      setFirstName("");
      setLastName("");
      setPhone("");
      setNationalId("");
      setSessions(0);
      setCost("");
      setRecords([]);
    }
  }, [editingUser]);

  const submit = (e?: React.FormEvent) => {
    e?.preventDefault();

    if (!firstName.trim() || !lastName.trim())
      return alert("نام و نام‌خانوادگی را وارد کنید.");

    const payload = {
      id: user?.id,
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      phone: phone.trim(),
      nationalId: nationalId.trim(),
      sessions,
      cost: cost.trim(),
    };

    if (user && user.id) {
      updateUser({ ...payload, id: user.id });
    } else {
      addUser(
        {
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          phone: phone.trim(),
          nationalId: nationalId.trim(),
        },
        { sessions, cost: parseInt(cost) },
        records.map((r) => r.date.toString())
      );
    }

    onCancel();
  };

  const handleAddOrRemoveRecord = (date: Date) => {
    const iso = date.toISOString();

    const existing = records.find((r) => r.date === iso);

    if (existing) {
      // حذف با کلیک دوم
      setRecords((prev) => prev.filter((r) => r.id !== existing.id));
      return;
    }

    // اضافه کردن جلسه جدید
    const newRecord = {
      id: Date.now(),
      date: iso,
      used: false,
      usedAt: null,
      userId: user?.id || -1, // ← برای تشخیص رنگ
    };

    setRecords((prev) => [...prev, newRecord]);
  };

  return (
    <div className="bg-white shadow-[0_8px_30px_rgb(0,0,0,0.08)] rounded-3xl p-10 max-w-4xl mx-auto border border-slate-100">
      {/* هدر */}
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
          className="inline-flex items-center gap-2 bg-linear-to-r from-sky-500 to-indigo-600 text-white px-4 py-2 rounded-lg shadow-md hover:shadow-lg cursor-pointer"
        >
          بازگشت
          <ArrowLeft size={16} />
        </Link>
      </div>
      <form onSubmit={submit} className="space-y-8">
        {/* فیلدها */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Field
            label="نام"
            value={firstName}
            onChange={setFirstName}
            icon={<User size={18} className="text-slate-400" />}
          />

          <Field
            label="نام خانوادگی"
            value={lastName}
            onChange={setLastName}
            icon={<User size={18} className="text-slate-400" />}
          />

          <Field
            label="شماره تلفن"
            value={phone}
            onChange={setPhone}
            icon={<Phone size={18} className="text-slate-400" />}
          />

          <Field
            label="کد ملی"
            value={nationalId}
            onChange={setNationalId}
            icon={<IdCard size={18} className="text-slate-400" />}
          />

          <Field
            label="هزینه (تومان)"
            value={cost}
            onChange={setCost}
            icon={<CreditCard size={18} className="text-slate-400" />}
          />
        </div>

        {/* تعداد جلسات */}
        <div className="flex items-center justify-between bg-slate-50 border border-slate-200 rounded-xl p-4">
          <div className="text-slate-700 font-medium">تعداد جلسات</div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setSessions((s) => Math.max(0, s - 1))}
              className="w-10 h-10 flex items-center justify-center bg-white border border-slate-300 rounded-xl hover:bg-slate-100 transition"
            >
              <Minus size={18} />
            </button>

            <div className="text-xl font-semibold w-12 text-center">
              {sessions}
            </div>

            <button
              type="button"
              onClick={() => setSessions((s) => s + 1)}
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

        {/* دکمه‌ها */}
        <div className="flex items-center justify-end gap-4 pt-4">
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

function Field({ label, value, onChange, icon }: any) {
  return (
    <div className="space-y-1">
      <label className="text-sm text-slate-500">{label}</label>

      <div className="flex items-center gap-2 rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 focus-within:border-indigo-500 focus-within:bg-white transition">
        {icon}
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="flex-1 bg-transparent focus:outline-none text-slate-700"
        />
      </div>
    </div>
  );
}
