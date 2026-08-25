import React from "react";
import { Edit2, Eye, MinusCircle, PlusCircle, Trash2, User } from "lucide-react";
import { useUsersStore } from "../store/users";
import { useNavigate } from "react-router-dom";
import { UserFindAllItem } from "../global";
import { toast } from "react-toastify";

interface UserItemProps {
  user: UserFindAllItem;
}

const UserItem: React.FC<UserItemProps> = ({ user }) => {
  const navigate = useNavigate();
  const { setDeleteUserId, setViewUserId, setPickSessionUserId, removeLastSession } =
    useUsersStore();

  return (
    <tr className="hover:bg-slate-50 transition-colors">
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
        {user.course?.nextSessionDate
          ? new Date(user.course.nextSessionDate).toLocaleString("fa-IR")
          : "ندارد"}
      </td>
      <td className="px-6 py-4 text-center">
        <div className="inline-flex items-center gap-2">
          <button
            onClick={async () => {
              try {
                await removeLastSession(user.id);
              } catch (err) {
                toast.error(
                  err instanceof Error ? err.message : "حذف جلسه ناموفق بود"
                );
              }
            }}
            className="p-1 rounded-md hover:bg-slate-100"
            title="حذف آخرین جلسه استفاده‌نشده"
          >
            <MinusCircle size={20} />
          </button>
          <div className="px-3 py-1 rounded-md bg-slate-100 font-medium">
            {user.course?.totalSessions || 0}
          </div>
          <button
            onClick={() => setPickSessionUserId(user.id)}
            className="p-1 rounded-md hover:bg-slate-100"
            title="افزودن جلسه"
          >
            <PlusCircle size={20} />
          </button>
        </div>
      </td>
      <td className="px-6 py-4 text-center">
        <div className="inline-flex items-center gap-2">
          <button
            onClick={() => setViewUserId(user.id)}
            className="px-3 py-2.5 rounded-md border border-slate-200"
            title="مشاهده"
          >
            <Eye size={14} />
          </button>
          <button
            onClick={() => navigate(`/users/edit/${user.id}`)}
            className="px-3 py-2.5 rounded-md border border-slate-200"
            title="ویرایش"
          >
            <Edit2 size={14} />
          </button>
          <button
            onClick={() => setDeleteUserId(user.id)}
            className="px-3 py-2.5 rounded-md border border-red-100 text-red-600"
            title="حذف"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </td>
    </tr>
  );
};

export default UserItem;
