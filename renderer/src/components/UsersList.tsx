import React from "react";
import { UserType } from "../global";
import Modal from "./Modal";
import UserForm from "./forms/UserForm";
import ConfirmDelete from "./forms/ConfirmDelete";
import { useUsersStore } from "../store/users";
import UserItem from "./UserItem";
import UserDetailModalContent from "./UserDetailModalContent";

interface UsersListProps {
  isLoading: boolean;
  users: UserType[];
}

const UsersList: React.FC<UsersListProps> = ({ isLoading, users }) => {
  const {
    deleteUserId,
    sessionLog,
    showUser,
    setDeleteUserId,
    deleteUser,
    setShowUser,
    setSessionLog,
  } = useUsersStore();

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg">
      <table className="w-full">
        <thead className="bg-linear-to-r from-sky-50 to-indigo-50">
          <tr className="text-slate-500 text-sm">
            <th className="px-6 py-4 text-center">کاربر</th>
            <th className="px-6 py-4 text-center hidden md:table-cell">تلفن</th>
            <th className="px-6 py-4 text-center hidden lg:table-cell">
              کد ملی
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

      {/* Delete Modal */}
      {deleteUserId && (
        <Modal onClose={() => setDeleteUserId(null)}>
          <ConfirmDelete
            onCancel={() => setDeleteUserId(null)}
            onConfirm={() => deleteUser(deleteUserId)}
          />
        </Modal>
      )}

      {/* show user Modal */}
      {showUser && sessionLog && (
        <Modal
          onClose={() => {
            setShowUser(null);
            setSessionLog(null);
          }}
        >
          <UserDetailModalContent user={showUser} logs={sessionLog} />
        </Modal>
      )}
    </div>
  );
};

export default UsersList;
