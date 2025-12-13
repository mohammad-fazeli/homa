import React, { useEffect } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { useBillingStore } from "../store/billing";

const PIE_COLORS = ["#22c55e", "#e5e7eb"];

// =======================
// Component
// =======================
const Billing: React.FC = () => {
  const { logs, revenueData, sessionStats, summary, loadData } =
    useBillingStore();

  useEffect(() => {
    loadData();
  }, []);

  const pieData = [
    { name: "استفاده‌شده", value: sessionStats?.used },
    { name: "باقی‌مانده", value: sessionStats?.remaining },
  ];
  return (
    <div className="p-8 space-y-10 bg-gray-50 min-h-screen">
      {/* ================= Header ================= */}
      <div>
        <h1 className="text-2xl font-bold text-gray-800">گزارش مالی</h1>
        <p className="text-sm text-gray-500 mt-1">
          نمای کلی درآمد، جلسات و تراکنش‌ها
        </p>
      </div>

      {/* ================= Summary Cards ================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
        <SummaryCard title="کل کاربران" value={summary?.totalUsers || 0} />
        <SummaryCard title="کل دوره‌ها" value={summary?.totalCourses || 0} />
        <SummaryCard
          title="درآمد کل"
          value={`${summary?.totalRevenue.toLocaleString()} تومان`}
          highlight
        />
        <SummaryCard
          title="میانگین قیمت دوره"
          value={`${summary?.avgCoursePrice.toLocaleString()} تومان`}
        />
      </div>

      {/* ================= Charts ================= */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Revenue Line Chart */}
        <div className="xl:col-span-2 card">
          <CardTitle>درآمد ماهانه</CardTitle>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="revenue"
                  stroke="#2563eb"
                  strokeWidth={3}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Sessions Pie */}
        <div className="card">
          <CardTitle>وضعیت جلسات</CardTitle>
          <div className="h-72 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  dataKey="value"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={4}
                >
                  {pieData.map((_, index) => (
                    <Cell
                      key={index}
                      fill={PIE_COLORS[index % PIE_COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-center gap-6 text-sm mt-4">
            <Legend color="bg-green-500" label="استفاده‌شده" />
            <Legend color="bg-gray-300" label="باقی‌مانده" />
          </div>
        </div>
      </div>

      {/* ================= Logs ================= */}
      <div className="card">
        <CardTitle>آخرین لاگ‌های مالی</CardTitle>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b">
              <tr className="text-gray-500">
                <th className="text-right py-3">کاربر</th>
                <th className="text-right">تغییر</th>
                <th className="text-right">توضیح</th>
                <th className="text-right">تاریخ</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr
                  key={log.id}
                  className="border-b last:border-none hover:bg-gray-50 transition"
                >
                  <td className="py-3">{log.userFullName}</td>
                  <td
                    className={`font-bold ${
                      log.change > 0 ? "text-green-600" : "text-red-500"
                    }`}
                  >
                    {log.change > 0 ? `+${log.change}` : log.change}
                  </td>
                  <td>{log.description}</td>
                  <td>{log.date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// =======================
// UI Components
// =======================
type SummaryCardProps = {
  title: string;
  value: string | number;
  highlight?: boolean;
};

const SummaryCard: React.FC<SummaryCardProps> = ({
  title,
  value,
  highlight,
}) => (
  <div className={`card ${highlight ? "border-blue-500 border" : ""}`}>
    <p className="text-sm text-gray-500">{title}</p>
    <p className="text-2xl font-bold mt-2 text-gray-800">{value}</p>
  </div>
);

const CardTitle: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <h2 className="text-lg font-semibold mb-4 text-gray-800">{children}</h2>
);

const Legend: React.FC<{ color: string; label: string }> = ({
  color,
  label,
}) => (
  <div className="flex items-center gap-2">
    <span className={`w-3 h-3 rounded-full ${color}`} />
    <span>{label}</span>
  </div>
);

export default Billing;
