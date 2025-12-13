import { useEffect } from "react";
import { Plus, Search } from "lucide-react";
import { useUsersStore } from "../store/users";
import UsersList from "../components/UsersList";
import { Link } from "react-router-dom";

export default function Users() {
  const { users, query, isLoading, setQuery, loadUsers, page } =
    useUsersStore();

  useEffect(() => {
    loadUsers();
  }, [loadUsers, page]);

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

  return (
    <div>
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

          <Link
            to="/user/new"
            className="inline-flex items-center gap-2 bg-linear-to-r from-sky-500 to-indigo-600 text-white px-4 py-2 rounded-lg shadow-md hover:shadow-lg cursor-pointer"
          >
            <Plus size={16} /> ساخت کاربر جدید
          </Link>
        </div>
      </header>

      <main className="max-w-6xl mx-auto">
        <UsersList isLoading={isLoading} users={filtered} />
      </main>
    </div>
  );
}
