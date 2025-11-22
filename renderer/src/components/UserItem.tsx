import React from "react";
import { UserType } from "../global";
import {
  Edit2,
  Eye,
  MinusCircle,
  PlusCircle,
  Trash2,
  User,
} from "lucide-react";
import { useUsersStore } from "../store/users";

interface UserItemProps {
  user: UserType;
}

const UserItem: React.FC<UserItemProps> = ({ user }) => {
  const { setShowModal, setEditingUser, changeSessions, getUser } =
    useUsersStore();

  return (
    <tr key={user.id} className="hover:bg-slate-50 transition-colors">
      <td className="px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-linear-to-br from-indigo-400 to-sky-400 flex items-center justify-center text-white font-semibold">
            <User />
          </div>
          <div>
            <div className="font-medium text-slate-800">
              {user.firstName} {user.lastName}
            </div>
            <div className="text-xs text-slate-400">شناسه: {user.id}</div>
          </div>
        </div>
      </td>

      <td className="px-6 py-4 hidden md:table-cell text-slate-600 text-center">
        {user.phone}
      </td>
      <td className="px-6 py-4 hidden lg:table-cell text-slate-600 text-center">
        {user.nationalId}
      </td>

      <td className="px-6 py-4 text-center">
        <div className="inline-flex items-center gap-2">
          <button
            onClick={() => changeSessions(user.id, -1)}
            className="p-1 rounded-md hover:bg-slate-100 cursor-pointer"
            title="کم کردن جلسه"
          >
            <MinusCircle size={20} />
          </button>

          <div className="px-3 pt-1 rounded-md bg-slate-100 font-medium">
            {user.sessions}
          </div>

          <button
            onClick={() => changeSessions(user.id, +1)}
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
              setEditingUser(user);
              setShowModal(true);
            }}
            className="px-3 py-2.5 rounded-md border border-slate-200 hover:shadow-sm cursor-pointer"
            title="ویرایش"
          >
            <Edit2 size={14} />
          </button>

          <button
            onClick={() => {
              getUser(user.id);
            }}
            className="px-3 py-2.5 rounded-md border border-red-100 text-red-600 hover:bg-red-50 cursor-pointer"
            title="مشاهده"
          >
            <Eye size={14} />
          </button>
        </div>
      </td>
    </tr>
  );
};

export default UserItem;
