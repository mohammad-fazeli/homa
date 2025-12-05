import { useEffect } from "react";
import { Plus, Download, Search } from "lucide-react";
import { useUsersStore } from "../store/users";
import Modal from "../components/Modal";
import UserForm from "../components/forms/UserForm";
import UsersList from "../components/UsersList";

export default function Home() {
  const {
    users,
    query,
    showModal,
    isLoading,

    setQuery,
    setShowModal,
    loadUsers,
    addUser,
    setEditingUser,
  } = useUsersStore();

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const filtered = users.filter((u) => {
    const full = (
      u.firstName +
      " " +
      u.lastName +
      " " +
      u.phone +
      " " +
      u.nationalId
    ).toLowerCase();
    return full.includes(query.toLowerCase());
  });

  const exportCSV = () => {
    const rows = [
      ["id", "firstName", "lastName", "phone", "nationalId", "sessions"],
      ...users.map((u) => [
        u.id,
        u.firstName,
        u.lastName,
        u.phone,
        u.nationalId,
        u.sessions,
      ]),
    ];
    const csv = rows.map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `users-${new Date().toISOString()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="">
      <header className="max-w-6xl mx-auto mb-6">
        <div className="flex items-center justify-between gap-4">
          <div className="relative">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="جستجو بر اساس نام، تلفن یا کد ملی..."
              className="w-72 pr-10 py-2 pl-4 rounded-lg border bg-white border-slate-200 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder:text-slate-400"
            />
            <button className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
              <Search size={16} />
            </button>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => {
                setShowModal(true);
                setEditingUser(null);
              }}
              className="inline-flex items-center gap-2 bg-linear-to-r from-sky-500 to-indigo-600 text-white px-4 py-2 rounded-lg shadow-md hover:shadow-lg cursor-pointer"
            >
              <Plus size={16} /> ساخت کاربر جدید
            </button>

            <button
              onClick={exportCSV}
              className="inline-flex items-center gap-2 bg-white border border-slate-200 px-3 py-2 rounded-lg shadow-sm hover:shadow cursor-pointer"
            >
              <Download size={16} /> خروجی
            </button>
          </div>
        </div>
      </header>
      <main className="max-w-6xl mx-auto">
        <UsersList isLoading={isLoading} users={filtered} />
      </main>
      {showModal && (
        <Modal onClose={() => setShowModal(false)}>
          <UserForm onCancel={() => setShowModal(false)} />
        </Modal>
      )}
    </div>
  );
}
