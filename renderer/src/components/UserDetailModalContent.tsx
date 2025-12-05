import { motion } from "framer-motion";
import { Calendar, Clock } from "lucide-react";
import { useMemo, useState } from "react";
import { InputDatePicker } from "jalaali-react-date-picker";
import { Moment } from "moment";
import { SessionLogType, UserType } from "../global";

export default function UserLogsModalContent({
  user,
  logs,
}: {
  user: UserType;
  logs: SessionLogType[];
}) {
  const [from, setFrom] = useState<Moment | null>();
  const [to, setTo] = useState<Moment | null>();

  const fromTime = from
    ? new Date(from.startOf("day").toString()).getTime()
    : null;
  const toTime = to ? new Date(to.endOf("day").toString()).getTime() : null;

  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      const createdTime = new Date(log.createdAt).getTime();
      if (fromTime && createdTime < fromTime) return false;
      if (toTime && createdTime > toTime) return false;
      return true;
    });
  }, [logs, fromTime, toTime]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="backdrop-blur-xl bg-white/20 border border-white/30 rounded-3xl shadow-2xl p-6 w-full max-w-2xl"
    >
      {/* عنوان */}
      <h2 className="text-2xl font-bold text-center text-slate-800 mb-6">
        {user.firstName} {user.lastName}
      </h2>

      {/* فیلتر تاریخ */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        <div className="flex flex-col gap-1">
          <label className="text-sm text-slate-600 flex items-center gap-2">
            <Calendar size={16} /> از تاریخ
          </label>

          <InputDatePicker
            value={from}
            onChange={(date) => {
              setFrom(date);
            }}
            closeOnChange={true}
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-sm text-slate-600 flex items-center gap-2">
            <Calendar size={16} /> تا تاریخ
          </label>
          <InputDatePicker
            value={to}
            onChange={(date) => {
              setTo(date);
            }}
            closeOnChange={true}
          />
        </div>
      </div>

      {/* لیست لاگ‌ها */}
      <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
        {filteredLogs.length === 0 && (
          <p className="text-center text-slate-500 py-6">
            هیچ تغییری در این بازه زمانی وجود ندارد.
          </p>
        )}

        {filteredLogs.map((log) => (
          <div
            key={log.id}
            className="bg-white/30 backdrop-blur-md border border-white/40 rounded-xl p-4 shadow-sm hover:bg-white/40 transition"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="font-semibold text-slate-800">
                تغییر: {log.change}
              </span>
              <span className="flex items-center gap-1 text-sm text-slate-600">
                <Clock size={14} />
                {new Date(log.createdAt).toLocaleString("fa-IR")}
              </span>
            </div>

            <div className="grid grid-cols-3 text-sm text-slate-700 bg-white/40 rounded-lg p-2">
              <div className="text-center">
                <div className="text-xs text-slate-500">قبل</div>
                <div className="font-medium">{log.previousValue}</div>
              </div>
              <div className="text-center">
                <div className="text-xs text-slate-500">تغییر</div>
                <div className="font-medium">{log.change}</div>
              </div>
              <div className="text-center">
                <div className="text-xs text-slate-500">بعد</div>
                <div className="font-medium">{log.newValue}</div>
              </div>
            </div>

            {log.description && (
              <p className="text-sm text-slate-600 mt-3 bg-white/30 p-2 rounded-lg">
                {log.description}
              </p>
            )}
          </div>
        ))}
      </div>
    </motion.div>
  );
}
