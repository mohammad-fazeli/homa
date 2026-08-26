import { useEffect } from "react";
import WeeklyCalendar from "../components/WeeklyCalendar";
import PageHeader from "../components/ui/PageHeader";
import { useCalendarStore } from "../store/calendar";
import { useUsersStore } from "../store/users";
import { useAttendanceStore } from "../store/attendance";
import { onAppDataChange } from "../lib/bus";

export default function Sessions() {
  const refresh = useCalendarStore((s) => s.refresh);
  const openUser = useUsersStore((s) => s.openUser);
  const { markSession, unmarkSession } = useAttendanceStore();

  useEffect(() => onAppDataChange(() => refresh()), [refresh]);

  return (
    <div>
      <PageHeader
        eyebrow="زمان‌بندی"
        title="تقویم جلسات"
        description="روی جلسه کلیک کنید تا پروفایل باز شود یا حضور را دستی ثبت و لغو کنید."
      />
      <WeeklyCalendar
        onOpenUser={openUser}
        onMark={(id) => void markSession(id)}
        onUnmark={(id) => void unmarkSession(id)}
      />
    </div>
  );
}
