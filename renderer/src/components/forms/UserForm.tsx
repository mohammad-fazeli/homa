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
import Modal from "../Modal";
import ConfirmDialog from "../ui/ConfirmDialog";

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
  const [confirmDeleteCourse, setConfirmDeleteCourse] = useState(false);

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
      <div className="surface-card rounded-3xl p-10 max-w-4xl mx-auto text-center text-muted">
        در حال بارگذاری...
      </div>
    );
  }

  return (
    <div className="surface-card rounded-3xl p-8 max-w-5xl mx-auto">
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-ink">
            {editingUser ? "ویرایش مشتری" : "مشتری جدید"}
          </h2>
          <p className="text-muted mt-1 text-sm">
            اطلاعات فردی، دوره و زمان جلسات را در یک صفحه کامل کنید.
          </p>
        </div>
        <Link
          to="/users"
          className="btn btn-ghost"
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
            icon={<User size={18} className="text-muted" />}
          />
          <Field
            label="نام خانوادگی"
            value={form.lastName}
            onChange={(v) => updateField("lastName", v)}
            icon={<User size={18} className="text-muted" />}
          />
          <Field
            label="شماره تلفن"
            value={form.phone}
            onChange={(v) => updateField("phone", v)}
            icon={<Phone size={18} className="text-muted" />}
          />
          <Field
            label="کد ملی"
            value={form.nationalId}
            onChange={(v) => updateField("nationalId", v)}
            icon={<IdCard size={18} className="text-muted" />}
          />
          <div
            className={`md:col-span-2 rounded-2xl border px-4 py-3 text-sm ${
              form.uidCart
                ? "border-brand/30 bg-brand-soft text-brand"
                : "border-dashed border-line bg-paper text-muted"
            }`}
          >
            {form.uidCart
              ? editingUser
                ? `کارت ثبت‌شده: ${form.uidCart} — برای تعویض، کارت جدید را روی دستگاه بگذارید`
                : `کارت شناسایی شد: ${form.uidCart}`
              : "اختیاری: کارت RFID را روی دستگاه بگذارید تا به این مشتری وصل شود."}
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            {courses.map((course, index) => (
              <button
                key={course.id}
                type="button"
                onClick={() => setActive(index)}
                className={`px-3 py-1.5 rounded-2xl text-sm ${
                  index === active
                    ? "bg-brand text-white"
                    : "bg-paper text-muted"
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
                className="px-3 py-1.5 rounded-2xl text-sm border border-dashed border-line text-muted hover:bg-paper"
              >
                + دوره جدید
              </button>
            )}
            {editingUser && current && current.id > 0 && courses.length > 1 && (
              <button
                type="button"
                onClick={() => setConfirmDeleteCourse(true)}
                className="px-3 py-1.5 rounded-2xl text-sm text-danger hover:bg-paper"
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
                icon={<CreditCard size={18} className="text-muted" />}
              />

              <div className="flex items-center justify-between bg-paper border border-line rounded-2xl p-4">
                <div>
                  <span className="text-ink font-medium">تعداد جلسات</span>
                  <p className="text-xs text-muted mt-1">
                    {Math.max(0, current.sessions - current.records.length).toLocaleString("fa-IR")} جلسه برای زمان‌بندی باقی مانده
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() =>
                      patchCourse(active, {
                        sessions: Math.max(0, current.sessions - 1),
                      })
                    }
                    className="w-10 h-10 flex items-center justify-center bg-surface border border-line rounded-xl hover:bg-paper"
                  >
                    <Minus size={18} />
                  </button>
                  <div className="text-xl font-semibold w-12 text-center text-ink">
                    {current.sessions.toLocaleString("fa-IR")}
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      patchCourse(active, { sessions: current.sessions + 1 })
                    }
                    className="w-10 h-10 flex items-center justify-center bg-surface border border-line rounded-xl hover:bg-paper"
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
            className="btn btn-ghost"
          >
            انصراف
          </button>
          <button
            type="submit"
            disabled={saving}
            className="btn btn-primary disabled:opacity-60"
          >
            {saving ? "در حال ذخیره..." : "ذخیره"}
          </button>
        </div>
      </form>
      {confirmDeleteCourse && current && (
        <Modal onClose={() => setConfirmDeleteCourse(false)}>
          <ConfirmDialog
            title="حذف دوره"
            description="جلسات این دوره هم پاک می‌شود."
            confirmLabel="حذف دوره"
            onCancel={() => setConfirmDeleteCourse(false)}
            onConfirm={async () => {
              try {
                await deleteCourse(current.id);
                setConfirmDeleteCourse(false);
                toast.success("دوره حذف شد");
              } catch (err) {
                toast.error(
                  err instanceof Error ? err.message : "حذف دوره ناموفق بود"
                );
              }
            }}
          />
        </Modal>
      )}
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
      <label className="text-sm text-muted">{label}</label>
      <div className="flex items-center gap-2 rounded-2xl border border-line bg-paper px-3 py-2.5 focus-within:border-brand focus-within:bg-surface">
        {icon}
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="flex-1 bg-transparent outline-none text-ink"
        />
      </div>
    </div>
  );
}
