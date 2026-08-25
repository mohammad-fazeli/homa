import { useEffect } from "react";
import { Card, CardContent } from "../components/card";
import { Users, Calendar, CreditCard, Wifi, WifiOff, Plus } from "lucide-react";
import { motion } from "framer-motion";
import { useDashboardStore } from "../store/dashboard";
import { useRfidStatus } from "../components/useRfidStatus";
import { Link } from "react-router-dom";

export default function Dashboard() {
  const { loadData, statsResult } = useDashboardStore();
  const ping = useRfidStatus();

  useEffect(() => {
    loadData();
  }, [loadData]);

  return (
    <div className="p-8 space-y-10">
      <motion.h1
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-3xl font-bold bg-linear-to-r from-indigo-600 to-sky-500 bg-clip-text text-transparent"
      >
        داشبورد مدیریتی
      </motion.h1>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatCard
          title="مشتریان فعال"
          value={statsResult.activeUsers}
          icon={<Users className="text-indigo-500" />}
        />

        <StatCard
          title="جلسات این هفته"
          value={statsResult.weeklySessions}
          icon={<Calendar className="text-sky-500" />}
        />

        <StatCard
          title="درآمد این ماه"
          value={`${statsResult.monthlyRevenue.toLocaleString()} تومان`}
          icon={<CreditCard className="text-emerald-500" />}
        />

        <Link to="/settings">
        <Card className="rounded-2xl shadow-lg border border-slate-100">
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">وضعیت اتصال</p>
              <p
                className={`font-bold mt-1 ${
                  ping === "online" ? "text-emerald-600" : "text-red-500"
                }`}
              >
                {ping === "online" ? "متصل" : "قطع ارتباط"}
              </p>
            </div>
            {ping === "online" ? (
              <Wifi className="text-emerald-500" />
            ) : (
              <WifiOff className="text-red-500" />
            )}
          </CardContent>
        </Card>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <Link
          to="/users"
          className="inline-flex items-center gap-2 bg-linear-to-r from-sky-500 to-indigo-600 text-white px-4 py-2 rounded-lg shadow-md hover:shadow-lg cursor-pointer"
        >
          <Plus size={16} /> مشاهده کاربران
        </Link>
        <Link
          to="/users/new"
          className="inline-flex items-center gap-2 bg-linear-to-r from-sky-500 to-indigo-600 text-white px-4 py-2 rounded-lg shadow-md hover:shadow-lg cursor-pointer"
        >
          <Plus size={16} /> ساخت کاربر جدید
        </Link>
        <Link
          to="/sessions"
          className="inline-flex items-center gap-2 bg-linear-to-r from-sky-500 to-indigo-600 text-white px-4 py-2 rounded-lg shadow-md hover:shadow-lg cursor-pointer"
        >
          <Plus size={16} /> برنامه هفتگی
        </Link>
      </div>
    </div>
  );
}

type StatCardProps = {
  title: string;
  value: number | string;
  icon: React.ReactNode;
};

const StatCard = ({ title, value, icon }: StatCardProps) => (
  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
    <Card className="rounded-2xl shadow-lg border border-slate-100">
      <CardContent className="p-6 flex items-center justify-between">
        <div>
          <p className="text-slate-500 text-sm">{title}</p>
          <p className="text-2xl font-bold mt-2">{value}</p>
        </div>
        <div className="text-4xl opacity-70">{icon}</div>
      </CardContent>
    </Card>
  </motion.div>
);
