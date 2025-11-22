import { useState } from "react";
import { useUsersStore } from "../../store/users";
import { motion } from "framer-motion";

export default function UserForm({ onCancel }: { onCancel: () => void }) {
  const { editingUser, addUser, updateUser } = useUsersStore();
  const [firstName, setFirstName] = useState(editingUser?.firstName || "");
  const [lastName, setLastName] = useState(editingUser?.lastName || "");
  const [phone, setPhone] = useState(editingUser?.phone || "");
  const [nationalId, setNationalId] = useState(editingUser?.nationalId || "");
  const [sessions, setSessions] = useState(editingUser?.sessions ?? 0);

  const submit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!firstName.trim() || !lastName.trim())
      return alert("نام و نام خانوادگی را وارد کنید.");
    const payload = {
      id: editingUser?.id,
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      phone: phone.trim(),
      nationalId: nationalId.trim(),
      sessions,
    };
    if (editingUser && editingUser.id) {
      updateUser({ ...payload, id: editingUser.id });
    } else {
      addUser(payload);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 8 }}
      className="backdrop-blur-xl bg-white/70 border border-white/30 rounded-3xl shadow-2xl p-6 w-full max-w-2xl"
    >
      <form onSubmit={submit} className="space-y-4 ">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">
            {editingUser ? "ویرایش کاربر" : "کاربر جدید"}
          </h2>
          <div className="text-sm text-slate-400">
            شناسه: {editingUser?.id ?? "—"}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <input
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            placeholder="نام"
            className="px-3 py-2 border rounded-lg"
          />
          <input
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            placeholder="نام خانوادگی"
            className="px-3 py-2 border rounded-lg"
          />
          <input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="تلفن"
            className="px-3 py-2 border rounded-lg"
          />
          <input
            value={nationalId}
            onChange={(e) => setNationalId(e.target.value)}
            placeholder="کد ملی"
            className="px-3 py-2 border rounded-lg"
          />
        </div>

        <div className="flex items-center gap-3">
          <label className="text-sm text-slate-600">تعداد جلسات</label>
          <div className="inline-flex items-center gap-2">
            <button
              type="button"
              onClick={() => setSessions((s) => Math.max(0, s - 1))}
              className="px-3 p-1 rounded-md border"
            >
              -
            </button>
            <div className="px-3 py-1 border rounded-md">{sessions}</div>
            <button
              type="button"
              onClick={() => setSessions((s) => s + 1)}
              className="px-3 p-1 rounded-md border"
            >
              +
            </button>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 rounded-lg border"
          >
            انصراف
          </button>
          <button
            type="submit"
            className="px-4 py-2 rounded-lg bg-linear-to-r from-sky-500 to-indigo-600 text-white"
          >
            ذخیره
          </button>
        </div>
      </form>
    </motion.div>
  );
}
