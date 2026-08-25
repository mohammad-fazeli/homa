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
import { sameHour } from "@shared/dates";
import { isValidNationalId, isValidPhone } from "@shared/validation";

interface FormState {
  firstName: string;
  lastName: string;
  phone: string;
  nationalId: string;
  uidCart: string;
}

interface CourseDraft {
  id: number;
  cost: string;
  sessions: number;
  records: RecordItem[];
}

let draftSeq = -1;

function emptyCourse(): CourseDraft {
  return { id: draftSeq--, cost: "", sessions: 0, records: [] };
}

export default function UserForm({ onCancel }: { onCancel: () => void }) {
  const {
    user,
    editingUser,
    addUser,
    updateUser,
    saveCourse,
    deleteCourse,
    setCapturingUid,
  } = useUsersStore();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<FormState>({
    firstName: "",
    lastName: "",
    phone: "",
    nationalId: "",
    uidCart: "",
  });
  const [courses, setCourses] = useState<CourseDraft[]>([emptyCourse()]);
  const [active, setActive] = useState(0);

  const current = courses[active] ?? courses[0];

  const updateField = (key: keyof FormState, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const patchCourse = (index: number, patch: Partial<CourseDraft>) => {
    setCourses((prev) =>
      prev.map((course, i) => (i === index ? { ...course, ...patch } : course))
    );
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
        uidCart: user.uidCart || "",
      });
      const loaded =
        user.courses.length > 0
          ? user.courses.map((course) => ({
              id: course.id,
              cost: course.cost?.toLocaleString() ?? "",
              sessions: course.totalSessions,
              records:
                course.sessions.map((s) => ({
                  ...s,
                  userId: user.id,
                })) ?? [],
            }))
          : [emptyCourse()];
      setCourses(loaded);
      setActive(0);
    } else if (!editingUser) {
      setForm({
        firstName: "",
        lastName: "",
        phone: "",
        nationalId: "",
        uidCart: "",
      });
      setCourses([emptyCourse()]);
      setActive(0);
    }
  }, [editingUser, user]);

  useEffect(() => {
    if (!current) return;
    if (current.sessions < current.records.length) {
      patchCourse(active, {
        records: current.records.slice(0, current.sessions),
      });
    }
  }, [current?.sessions, current?.records.length, active]);

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
    if (!isValidPhone(form.phone)) {
      toast.error("شماره تلفن باید ۱۱ رقم و با ۰۹ شروع شود.");
      return;
    }
    if (!isValidNationalId(form.nationalId)) {
      toast.error("کد ملی نامعتبر است.");
      return;
    }

    setSaving(true);
    try {
      if (editingUser && user) {
        await updateUser({ ...form, id: user.id });
        for (const course of courses) {
          await saveCourse(
            user.id,
            {
              id: course.id > 0 ? course.id : undefined,
              cost: parseInt(course.cost.replaceAll(",", "") || "0", 10),
              sessions: course.sessions,
            },
            course.records.map((r) => ({
              ...r,
              courseId: course.id > 0 ? course.id : -1,
            }))
          );
        }
        toast.success("مشتری به‌روزرسانی شد");
      } else {
        const first = courses[0];
        await addUser(
          { ...form },
          {
            sessions: first?.sessions ?? 0,
            cost: parseInt(first?.cost.replaceAll(",", "") || "0", 10),
          },
          (first?.records ?? []).map((r) => new Date(r.date).toISOString())
        );
        toast.success("مشتری جدید ذخیره شد");
      }
      onCancel();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "خطا در ذخیره اطلاعات");
    } finally {
      setSaving(false);
    }
  };

  const handleAddOrRemoveRecord = useCallback(
    (date: Date) => {
      if (!current) return;
      const exist = current.records.find((r) =>
        sameHour(new Date(r.date), date)
      );
      if (exist) {
        patchCourse(active, {
          records: current.records.filter((r) => r.id !== exist.id),
        });
        return;
      }
      if (current.sessions > current.records.length) {
        patchCourse(active, {
          records: [
            ...current.records,
            {
              id: Date.now(),
              date: date.toISOString(),
              used: 0,
              usedAt: null,
              userId: user?.id ?? -1,
            },
          ],
        });
      } else {
        toast.error("تاریخ تمام جلسات این دوره تنظیم شد.");
      }
    },
    [current, active, user]
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
            اطلاعات مشتری و دوره‌ها را وارد کنید
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
          {form.uidCart ? (
            <div className="text-emerald-600 md:col-span-2">
              {editingUser
                ? "کارت فعلی ثبت شده. برای تعویض، کارت جدید را روی دستگاه بگذارید"
                : "کارت شناسایی شد"}
            </div>
          ) : (
            <div className="text-red-500 md:col-span-2">
              کارت را در دستگاه بگذارید
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            {courses.map((course, index) => (
              <button
                key={course.id}
                type="button"
                onClick={() => setActive(index)}
                className={`px-3 py-1.5 rounded-lg text-sm ${
                  index === active
                    ? "bg-indigo-600 text-white"
                    : "bg-slate-100 text-slate-600"
                }`}
              >
                دوره {index + 1}
              </button>
            ))}
            {editingUser && (
              <button
                type="button"
                onClick={() => {
                  setCourses((prev) => [...prev, emptyCourse()]);
                  setActive(courses.length);
                }}
                className="px-3 py-1.5 rounded-lg text-sm border border-dashed border-slate-300"
              >
                + دوره جدید
              </button>
            )}
            {editingUser && current && current.id > 0 && courses.length > 1 && (
              <button
                type="button"
                onClick={async () => {
                  if (!confirm("این دوره حذف شود؟")) return;
                  try {
                    await deleteCourse(current.id);
                    toast.success("دوره حذف شد");
                  } catch (err) {
                    toast.error(
                      err instanceof Error ? err.message : "حذف دوره ناموفق بود"
                    );
                  }
                }}
                className="px-3 py-1.5 rounded-lg text-sm text-red-600"
              >
                حذف این دوره
              </button>
            )}
          </div>

          {current && (
            <>
              <Field
                label="هزینه دوره (تومان)"
                value={parseInt(
                  current.cost.replaceAll(",", "") || "0",
                  10
                ).toLocaleString()}
                onChange={(v) => patchCourse(active, { cost: v })}
                icon={<CreditCard size={18} className="text-slate-400" />}
              />

              <div className="flex items-center justify-between bg-slate-50 border border-slate-200 rounded-xl p-4">
                <span className="text-slate-700 font-medium">تعداد جلسات</span>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() =>
                      patchCourse(active, {
                        sessions: Math.max(0, current.sessions - 1),
                      })
                    }
                    className="w-10 h-10 flex items-center justify-center bg-white border border-slate-300 rounded-xl"
                  >
                    <Minus size={18} />
                  </button>
                  <div className="text-xl font-semibold w-12 text-center">
                    {current.sessions}
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      patchCourse(active, { sessions: current.sessions + 1 })
                    }
                    className="w-10 h-10 flex items-center justify-center bg-white border border-slate-300 rounded-xl"
                  >
                    <Plus size={18} />
                  </button>
                </div>
              </div>

              <WeeklyCalendar
                records={current.records}
                currentUserId={user?.id}
                onAddEvent={handleAddOrRemoveRecord}
              />
            </>
          )}
        </div>

        <div className="flex justify-end gap-4 pt-4">
          <button
            type="button"
            onClick={onCancel}
            className="px-5 py-2.5 rounded-xl border border-slate-300 text-slate-600 hover:bg-slate-100"
          >
            انصراف
          </button>
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2.5 rounded-xl text-white bg-linear-to-r from-sky-500 to-indigo-600 disabled:opacity-60"
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
      <div className="flex items-center gap-2 rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 focus-within:border-indigo-500 focus-within:bg-white">
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
