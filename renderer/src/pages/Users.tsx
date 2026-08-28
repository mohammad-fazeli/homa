import { useEffect, useState } from "react";
import { Download, Plus, Search, Upload } from "lucide-react";
import { useUsersStore } from "../store/users";
import UsersList from "../components/UsersList";
import { Link, useSearchParams } from "react-router-dom";
import Modal from "../components/Modal";
import ConfirmDelete from "../components/forms/ConfirmDelete";
import ImportCustomersModal from "../components/ImportCustomersModal";
import { toast } from "react-toastify";
import PageHeader from "../components/ui/PageHeader";
import { formatDateTime } from "../lib/format";
import { exportCsv, stampFile } from "../lib/csv";
import { onAppDataChange } from "../lib/bus";
import type { UserListFilter } from "../global";

const FILTERS: Array<{ id: UserListFilter; label: string }> = [
  { id: "all", label: "همه" },
  { id: "today", label: "جلسه امروز" },
  { id: "low_credit", label: "اعتبار کم" },
  { id: "no_card", label: "بدون کارت" },
  { id: "expired", label: "منقضی" },
  { id: "debt", label: "بدهکار" },
];

export default function Users() {
  const {
    users,
    query,
    filter,
    filterCounts,
    isLoading,
    setQuery,
    setFilter,
    loadUsers,
    page,
    total,
    deleteUserId,
    setDeleteUserId,
    deleteUser,
  } = useUsersStore();
  const [draft, setDraft] = useState(query);
  const [searchParams, setSearchParams] = useSearchParams();
  const [importOpen, setImportOpen] = useState(false);

  useEffect(() => {
    if (searchParams.get("import") !== "1") return;
    setImportOpen(true);
    const next = new URLSearchParams(searchParams);
    next.delete("import");
    setSearchParams(next, { replace: true });
  }, [searchParams, setSearchParams]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (draft !== query) setQuery(draft);
    }, 300);
    return () => clearTimeout(timer);
  }, [draft, query, setQuery]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers, page, query, filter]);

  useEffect(() => onAppDataChange(loadUsers), [loadUsers]);

  const exportCurrent = async () => {
    try {
      const result = await window.electronAPI?.getUsers(1, 5000, query, filter);
      const rows = result?.data ?? [];
      exportCsv(
        stampFile("customers"),
        [
          "نام",
          "نام خانوادگی",
          "تلفن",
          "کد ملی",
          "کارت",
          "استفاده‌شده",
          "باقی‌مانده",
          "جلسه بعدی",
          "بدهی",
        ],
        rows.map((user) => [
          user.firstName,
          user.lastName,
          user.phone,
          user.nationalId,
          user.hasCard ? "دارد" : "ندارد",
          user.usedSessions,
          user.remainingSessions,
          user.course?.nextSessionDate
            ? formatDateTime(user.course.nextSessionDate)
            : "",
          user.debt,
        ])
      );
      toast.success("فایل CSV ذخیره شد");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "خروجی ناموفق بود");
    }
  };

  return (
    <div>
      <PageHeader
        eyebrow="دفتر مشتریان"
        title="مشتریان"
        description="جستجو، فیلتر، ورود Excel و رزرو جلسه از همین صفحه. Ctrl+K جستجوی سراسری است."
        actions={
          <>
            <button type="button" className="btn btn-ghost" onClick={exportCurrent}>
              <Download size={16} /> خروجی CSV
            </button>
            <button
              type="button"
              className="btn btn-ghost"
              onClick={() => setImportOpen(true)}
            >
              <Upload size={16} /> ورود Excel
            </button>
            <Link to="/users/new" className="btn btn-primary">
              <Plus size={16} /> مشتری جدید
            </Link>
          </>
        }
      />

      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div className="relative">
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="نام، تلفن، کد ملی یا شماره کارت..."
            className="w-80 max-w-full pr-10 py-2.5 pl-4 rounded-2xl border border-line bg-surface outline-none focus:border-brand"
          />
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted">
            <Search size={16} />
          </span>
        </div>
        <p className="text-sm text-muted">
          {total.toLocaleString("fa-IR")} مشتری
        </p>
      </div>

      <div className="flex flex-wrap gap-2 mb-5">
        {FILTERS.map((item) => {
          const count = filterCounts[item.id];
          const on = filter === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setFilter(item.id)}
              className={`chip ${on ? "chip-on" : ""}`}
            >
              {item.label}
              <span className={on ? "text-white/80" : "text-muted"}>
                {count.toLocaleString("fa-IR")}
              </span>
            </button>
          );
        })}
      </div>

      <UsersList isLoading={isLoading} users={users} />

      {importOpen && (
        <ImportCustomersModal
          onClose={() => setImportOpen(false)}
          onImported={() => void loadUsers()}
        />
      )}

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
    </div>
  );
}
