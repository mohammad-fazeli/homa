import { Copy, CreditCard, Pencil, Phone, PlusCircle } from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";
import Modal from "./Modal";
import Avatar from "./ui/Avatar";
import ProgressBar from "./ui/ProgressBar";
import { useUsersStore } from "../store/users";
import { useAttendanceStore } from "../store/attendance";
import { formatDateTime, formatMoney, sessionStatusLabel } from "../lib/format";

export default function UserProfileModal() {
  const { viewUserId, user, closeUser, setPickSessionUserId } = useUsersStore();
  const { markSession, unmarkSession } = useAttendanceStore();

  if (viewUserId === null) return null;

  return (
    <Modal onClose={closeUser}>
      <div className="relative bg-surface rounded-3xl p-6 w-[36rem] max-w-[92vw] max-h-[82vh] overflow-y-auto space-y-5">
        {!user ? (
          <p className="text-muted text-sm py-10 text-center">
            در حال بارگذاری پروفایل...
          </p>
        ) : (
          <>
            <div className="flex items-start gap-4">
              <Avatar firstName={user.firstName} lastName={user.lastName} size="lg" />
              <div className="flex-1 min-w-0">
                <h2 className="text-xl font-bold text-ink">
                  {user.firstName} {user.lastName}
                </h2>
                <p className="text-sm text-muted mt-1" dir="ltr">
                  کد ملی {user.nationalId}
                </p>
              </div>
              <Link
                to={`/users/edit/${user.id}`}
                onClick={closeUser}
                className="btn btn-ghost text-brand"
              >
                <Pencil size={14} /> ویرایش
              </Link>
            </div>

            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="rounded-2xl border border-line p-3">
                <div className="text-xs text-muted mb-1">تلفن</div>
                <div className="flex items-center justify-between gap-2">
                  <a
                    href={`tel:${user.phone}`}
                    className="inline-flex items-center gap-1 text-ink hover:text-brand"
                    dir="ltr"
                  >
                    <Phone size={14} /> {user.phone}
                  </a>
                  <button
                    className="text-muted hover:text-brand"
                    title="کپی شماره"
                    onClick={() => {
                      navigator.clipboard.writeText(user.phone);
                      toast.success("شماره کپی شد");
                    }}
                  >
                    <Copy size={14} />
                  </button>
                </div>
              </div>
              <div className="rounded-2xl border border-line p-3">
                <div className="text-xs text-muted mb-1">کارت RFID</div>
                <div className="inline-flex items-center gap-1">
                  <CreditCard size={14} />
                  {user.uidCart || "ثبت نشده"}
                </div>
              </div>
            </div>

            <div className="space-y-3">
              {user.courses.length === 0 && (
                <p className="text-muted text-sm">دوره‌ای ثبت نشده است.</p>
              )}
              {user.courses.map((course, index) => {
                const used = course.sessions.filter((s) => s.used === 1).length;
                const remaining = Math.max(0, course.totalSessions - used);
                const tone =
                  remaining === 0 && course.totalSessions > 0
                    ? "danger"
                    : remaining <= 2
                      ? "gold"
                      : "brand";
                return (
                  <div key={course.id} className="rounded-2xl border border-line p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="font-medium">{course.title || `دوره ${index + 1}`}</div>
                      <div className="text-sm text-muted">
                        {formatMoney(course.cost)}
                      </div>
                    </div>
                    {(course.roomName || course.instructorName || course.debt > 0) && (
                      <p className="text-xs text-muted mb-2">
                        {[course.roomName, course.instructorName, course.debt > 0 ? `بدهی ${formatMoney(course.debt)}` : null]
                          .filter(Boolean)
                          .join(" · ")}
                      </p>
                    )}
                    <div className="flex items-center justify-between text-xs text-muted mb-2">
                      <span>
                        {used.toLocaleString("fa-IR")} از{" "}
                        {course.totalSessions.toLocaleString("fa-IR")} جلسه استفاده شده
                      </span>
                      <span>{remaining.toLocaleString("fa-IR")} باقی‌مانده</span>
                    </div>
                    <ProgressBar
                      value={used}
                      max={course.totalSessions}
                      tone={tone}
                    />
                    <div className="space-y-1 max-h-44 overflow-auto mt-3">
                      {course.sessions.map((session) => (
                        <div
                          key={session.id}
                          className="flex items-center justify-between gap-2 text-xs py-1"
                        >
                          <span className="text-ink">
                            {formatDateTime(session.date)}
                          </span>
                          <span className="flex items-center gap-2">
                            <span
                              className={
                                session.used ? "text-success" : "text-muted"
                              }
                            >
                              {sessionStatusLabel(session.status)}
                            </span>
                            {session.used ? (
                              <button
                                className="text-muted hover:text-danger"
                                onClick={() => unmarkSession(session.id)}
                              >
                                لغو
                              </button>
                            ) : (
                              <button
                                className="text-brand hover:text-brand-dark"
                                onClick={() => markSession(session.id)}
                              >
                                ثبت حضور
                              </button>
                            )}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex flex-wrap justify-between gap-2 pt-1">
              <button
                className="btn btn-ghost"
                onClick={() => {
                  setPickSessionUserId(user.id);
                  closeUser();
                }}
              >
                <PlusCircle size={15} /> جلسه جدید
              </button>
              <button className="btn btn-ghost" onClick={closeUser}>
                بستن
              </button>
            </div>
          </>
        )}
      </div>
    </Modal>
  );
}
