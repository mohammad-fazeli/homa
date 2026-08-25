import { useEffect, useState } from "react";
import { Plus, Search } from "lucide-react";
import { useUsersStore } from "../store/users";
import UsersList from "../components/UsersList";
import { Link } from "react-router-dom";
import Modal from "../components/Modal";
import ConfirmDelete from "../components/forms/ConfirmDelete";
import WeeklyCalendar from "../components/WeeklyCalendar";
import { toast } from "react-toastify";

export default function Users() {
  const {
    users,
    query,
    isLoading,
    setQuery,
    loadUsers,
    page,
    deleteUserId,
    setDeleteUserId,
    deleteUser,
    viewUserId,
    setViewUserId,
    pickSessionUserId,
    setPickSessionUserId,
    addSession,
    getUser,
    user,
    clearUser,
  } = useUsersStore();
  const [draft, setDraft] = useState(query);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (draft !== query) setQuery(draft);
    }, 300);
    return () => clearTimeout(timer);
  }, [draft, query, setQuery]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers, page, query]);

  useEffect(() => {
    if (viewUserId) getUser(viewUserId);
  }, [viewUserId, getUser]);

  return (
    <div>
      <header className="max-w-6xl mx-auto mb-6">
        <div className="flex items-center justify-between gap-4">
          <div className="relative">
            <input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="جستجو بر اساس نام، تلفن یا کد ملی..."
              className="w-72 pr-10 py-2 pl-4 rounded-lg border bg-white border-slate-200 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder:text-slate-400"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
              <Search size={16} />
            </span>
          </div>
          <Link
            to="/users/new"
            className="inline-flex items-center gap-2 bg-linear-to-r from-sky-500 to-indigo-600 text-white px-4 py-2 rounded-lg shadow-md hover:shadow-lg cursor-pointer"
          >
            <Plus size={16} /> ساخت کاربر جدید
          </Link>
        </div>
      </header>

      <main className="max-w-6xl mx-auto">
        <UsersList isLoading={isLoading} users={users} />
      </main>

      {deleteUserId !== null && (
        <Modal onClose={() => setDeleteUserId(null)}>
          <ConfirmDelete
            onConfirm={async () => {
              try {
                await deleteUser(deleteUserId);
              } catch (err) {
                toast.error(
                  err instanceof Error ? err.message : "حذف کاربر ناموفق بود"
                );
              }
            }}
            onCancel={() => setDeleteUserId(null)}
          />
        </Modal>
      )}

      {viewUserId !== null && user && (
        <Modal
          onClose={() => {
            setViewUserId(null);
            clearUser();
          }}
        >
          <div className="relative bg-white rounded-2xl p-6 w-[32rem] max-h-[80vh] overflow-y-auto space-y-3">
            <h2 className="text-lg font-semibold">
              {user.firstName} {user.lastName}
            </h2>
            <p>تلفن: {user.phone}</p>
            <p>کد ملی: {user.nationalId}</p>
            <p>کارت: {user.uidCart || "ثبت نشده"}</p>
            <div className="space-y-2">
              {user.courses.length === 0 && (
                <p className="text-slate-400">دوره‌ای ثبت نشده است.</p>
              )}
              {user.courses.map((course, index) => (
                <div key={course.id} className="border rounded-lg p-3 text-sm">
                  <div className="font-medium">دوره {index + 1}</div>
                  <div>هزینه: {course.cost.toLocaleString()} تومان</div>
                  <div>جلسات: {course.totalSessions}</div>
                </div>
              ))}
            </div>
            <button
              className="px-4 py-2 rounded-lg border"
              onClick={() => {
                setViewUserId(null);
                clearUser();
              }}
            >
              بستن
            </button>
          </div>
        </Modal>
      )}

      {pickSessionUserId !== null && (
        <Modal onClose={() => setPickSessionUserId(null)}>
          <div className="relative bg-white rounded-2xl p-4 w-[min(90vw,52rem)]">
            <h2 className="text-lg font-semibold mb-3">انتخاب زمان جلسه جدید</h2>
            <WeeklyCalendar
              onAddEvent={async (date) => {
                try {
                  await addSession(pickSessionUserId, date.toISOString());
                  toast.success("جلسه اضافه شد");
                  setPickSessionUserId(null);
                } catch (err) {
                  toast.error(
                    err instanceof Error ? err.message : "افزودن جلسه ناموفق بود"
                  );
                }
              }}
            />
          </div>
        </Modal>
      )}
    </div>
  );
}
