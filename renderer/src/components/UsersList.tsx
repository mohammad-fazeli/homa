import React from "react";
import { UserType } from "../global";
import UserItem from "./UserItem";
import Pagination from "./Pagination";
import { useUsersStore } from "../store/users";

interface UsersListProps {
  isLoading: boolean;
  users: UserType[];
}

const UsersList: React.FC<UsersListProps> = ({ isLoading, users }) => {
  const { page, totalPages, setPage } = useUsersStore();
  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg pb-5">
      <table className="w-full">
        <thead className="bg-linear-to-r from-sky-50 to-indigo-50">
          <tr className="text-slate-500 text-sm">
            <th className="px-6 py-4 text-center">کاربر</th>
            <th className="px-6 py-4 text-center hidden md:table-cell">تلفن</th>
            <th className="px-6 py-4 text-center hidden lg:table-cell">
              جلسه بعدی
            </th>
            <th className="px-6 py-4 text-center">جلسات</th>
            <th className="px-6 py-4 text-center">اقدامات</th>
          </tr>
        </thead>
        <tbody>
          {isLoading && (
            <tr>
              <td colSpan={5} className="px-6 py-12 text-center text-slate-400">
                در حال بارگذاری...
              </td>
            </tr>
          )}

          {!isLoading && users.length === 0 && (
            <tr>
              <td colSpan={5} className="px-6 py-12 text-center text-slate-400">
                موردی برای نمایش وجود ندارد.
              </td>
            </tr>
          )}

          {users.map((u) => (
            <UserItem user={u} key={u.id} />
          ))}
        </tbody>
      </table>
      <Pagination page={page} totalPages={totalPages} onChange={setPage} />
    </div>
  );
};

export default UsersList;
