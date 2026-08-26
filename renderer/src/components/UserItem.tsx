import React from "react";
import { Eye, MinusCircle, Pencil, PlusCircle, Trash2 } from "lucide-react";
import { useUsersStore } from "../store/users";
import { useNavigate } from "react-router-dom";
import { UserFindAllItem } from "../global";
import { toast } from "react-toastify";
import Avatar from "./ui/Avatar";
import ProgressBar from "./ui/ProgressBar";
import { formatDateTime } from "../lib/format";

export default function UserItem({ user }: { user: UserFindAllItem }) {
  const navigate = useNavigate();
  const {
    setDeleteUserId,
    openUser,
    setPickSessionUserId,
    removeLastSession,
  } = useUsersStore();

  const total = user.course?.totalSessions || 0;
  const used = user.usedSessions ?? 0;
  const remaining = user.remainingSessions ?? Math.max(0, total - used);
  const tone =
    remaining === 0 && total > 0 ? "danger" : remaining <= 2 ? "gold" : "brand";

  return (
    <tr
      className="hover:bg-paper/80 transition-colors cursor-pointer"
      onClick={() => openUser(user.id)}
    >
      <td className="px-5 py-4">
        <div className="flex items-center gap-3">
          <Avatar firstName={user.firstName} lastName={user.lastName} />
          <div>
            <div className="font-medium text-ink">
              {user.firstName} {user.lastName}
            </div>
            <div className="text-xs text-muted mt-0.5 flex items-center gap-2">
              <a
                href={`tel:${user.phone}`}
                dir="ltr"
                className="hover:text-brand"
                onClick={(e) => e.stopPropagation()}
              >
                {user.phone}
              </a>
              <span
                className={`px-1.5 py-0.5 rounded-full ${
                  user.hasCard
                    ? "bg-brand-soft text-brand"
                    : "bg-gold-soft text-gold"
                }`}
              >
                {user.hasCard ? "کارت دارد" : "بدون کارت"}
              </span>
            </div>
          </div>
        </div>
      </td>
      <td className="px-5 py-4 hidden lg:table-cell text-muted text-sm">
        {user.course?.nextSessionDate
          ? formatDateTime(user.course.nextSessionDate)
          : "جلسه‌ای نیست"}
      </td>
      <td className="px-5 py-4">
        <div className="min-w-40">
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="text-muted">
              {remaining.toLocaleString("fa-IR")} باقی‌مانده
            </span>
            <span className="text-ink">
              {used.toLocaleString("fa-IR")}/{total.toLocaleString("fa-IR")}
            </span>
          </div>
          <ProgressBar value={used} max={total} tone={tone} />
          <div className="inline-flex items-center gap-1 mt-2">
            <button
              onClick={async (e) => {
                e.stopPropagation();
                try {
                  await removeLastSession(user.id);
                } catch (err) {
                  toast.error(
                    err instanceof Error ? err.message : "حذف جلسه ناموفق بود"
                  );
                }
              }}
              className="p-1 rounded-lg hover:bg-paper text-muted"
              title="حذف آخرین جلسه استفاده‌نشده"
            >
              <MinusCircle size={16} />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setPickSessionUserId(user.id);
              }}
              className="p-1 rounded-lg hover:bg-paper text-brand"
              title="افزودن جلسه"
            >
              <PlusCircle size={16} />
            </button>
          </div>
        </div>
      </td>
      <td className="px-5 py-4">
        <div className="inline-flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => openUser(user.id)}
            className="p-2 rounded-xl border border-line hover:bg-paper"
            title="مشاهده"
          >
            <Eye size={15} />
          </button>
          <button
            onClick={() => navigate(`/users/edit/${user.id}`)}
            className="p-2 rounded-xl border border-line hover:bg-paper"
            title="ویرایش"
          >
            <Pencil size={15} />
          </button>
          <button
            onClick={() => setDeleteUserId(user.id)}
            className="p-2 rounded-xl border border-line text-danger hover:bg-paper"
            title="حذف"
          >
            <Trash2 size={15} />
          </button>
        </div>
      </td>
    </tr>
  );
}
