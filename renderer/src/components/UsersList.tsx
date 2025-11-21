import React from "react";
import { UserType } from "../global";
import { Edit2, MinusCircle, PlusCircle, Trash2, User } from "lucide-react";
import Modal from "./Modal";
import UserForm from "./forms/UserForm";
import ConfirmDelete from "./forms/ConfirmDelete";
import { useUsersStore } from "../store/users";

interface UsersListProps {
  isLoading: boolean;
  users: UserType[];
}

const UsersList: React.FC<UsersListProps> = ({ isLoading, users }) => {
  const {
    showModal,
    setShowModal,
    editingUser,
    setEditingUser,
    deleteUserId,
    setDeleteUserId,

    updateUser,
    deleteUser,
    changeSessions,
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
            <tr key={u.id} className="hover:bg-slate-50 transition-colors">
              <td className="px-6 py-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-linear-to-br from-indigo-400 to-sky-400 flex items-center justify-center text-white font-semibold">
                    <User />
                  </div>
                  <div>
                    <div className="font-medium text-slate-800">
                      {u.firstName} {u.lastName}
                    </div>
                    <div className="text-xs text-slate-400">شناسه: {u.id}</div>
                  </div>
                </div>
              </td>

              <td className="px-6 py-4 hidden md:table-cell text-slate-600 text-center">
                {u.phone}
              </td>
              <td className="px-6 py-4 hidden lg:table-cell text-slate-600 text-center">
                {u.nationalId}
              </td>

              <td className="px-6 py-4 text-center">
                <div className="inline-flex items-center gap-2">
                  <button
                    onClick={() => changeSessions(u.id, -1)}
                    className="p-1 rounded-md hover:bg-slate-100 cursor-pointer"
                    title="کم کردن جلسه"
                  >
                    <MinusCircle size={20} />
                  </button>

                  <div className="px-3 pt-1 rounded-md bg-slate-100 font-medium">
                    {u.sessions}
                  </div>

                  <button
                    onClick={() => changeSessions(u.id, +1)}
                    className="p-1 rounded-md hover:bg-slate-100 cursor-pointer"
                    title="اضافه کردن جلسه"
                  >
                    <PlusCircle size={20} />
                  </button>
                </div>
              </td>

              <td className="px-6 py-4 text-center">
                <div className="inline-flex items-center gap-2">
                  <button
                    onClick={() => {
                      setEditingUser(u);
                      setShowModal(true);
                    }}
                    className="px-3 py-2.5 rounded-md border border-slate-200 hover:shadow-sm cursor-pointer"
                    title="ویرایش"
                  >
                    <Edit2 size={14} />
                  </button>

                  <button
                    onClick={() => {
                      setDeleteUserId(u.id);
                    }}
                    className="px-3 py-2.5 rounded-md border border-red-100 text-red-600 hover:bg-red-50 cursor-pointer"
                    title="حذف"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Edit Modal */}
      {showModal && (
        <Modal
          onClose={() => {
            setShowModal(false);
            setEditingUser(null);
          }}
        >
          <UserForm
            initial={editingUser || undefined}
            onCancel={() => {
              setShowModal(false);
              setEditingUser(null);
            }}
            onSave={updateUser}
          />
        </Modal>
      )}

      {/* Delete Modal */}
      {deleteUserId && (
        <Modal onClose={() => setDeleteUserId(null)}>
          <ConfirmDelete
            onCancel={() => setDeleteUserId(null)}
            onConfirm={() => deleteUser(deleteUserId)}
          />
        </Modal>
      )}
    </div>
  );
};

export default UsersList;
