import { UserFindAllItem } from "../global";
import UserItem from "./UserItem";
import Pagination from "./Pagination";
import { useUsersStore } from "../store/users";
import EmptyState from "./ui/EmptyState";
import { TableSkeleton } from "./ui/Skeleton";
import { Users } from "lucide-react";
import { Link } from "react-router-dom";

export default function UsersList({
  isLoading,
  users,
}: {
  isLoading: boolean;
  users: UserFindAllItem[];
}) {
  const { page, totalPages, setPage } = useUsersStore();

  return (
    <div className="overflow-hidden rounded-3xl border border-line bg-surface">
      <div className="overflow-auto max-h-[calc(100vh-19rem)]">
        <table className="w-full">
          <thead className="bg-paper/95 text-muted text-sm sticky top-0 z-10">
            <tr>
              <th className="px-5 py-3 text-right font-medium">مشتری</th>
              <th className="px-5 py-3 text-right font-medium hidden lg:table-cell">
                جلسه بعدی
              </th>
              <th className="px-5 py-3 text-right font-medium">پیشرفت دوره</th>
              <th className="px-5 py-3 text-right font-medium">اقدامات</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && users.length === 0 && (
              <tr>
                <td colSpan={4}>
                  <TableSkeleton />
                </td>
              </tr>
            )}
            {!isLoading && users.length === 0 && (
              <tr>
                <td colSpan={4}>
                  <EmptyState
                    icon={<Users size={22} />}
                    title="مشتری‌ای پیدا نشد"
                    description="یک مشتری جدید بسازید یا فیلتر و جستجو را عوض کنید."
                    action={
                      <Link to="/users/new" className="btn btn-primary text-sm">
                        ساخت مشتری
                      </Link>
                    }
                  />
                </td>
              </tr>
            )}
            {users.map((u) => (
              <UserItem user={u} key={u.id} />
            ))}
          </tbody>
        </table>
      </div>
      {totalPages > 1 && (
        <div className="py-4">
          <Pagination page={page} totalPages={totalPages} onChange={setPage} />
        </div>
      )}
    </div>
  );
}
