import { useEffect } from "react";
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
import { Card, CardContent } from "../components/card";

const PIE_COLORS = ["#22c55e", "#e5e7eb"];

const Billing = () => {
  const { logs, revenueData, sessionStats, summary, loadData } =
    useBillingStore();

  useEffect(() => {
    loadData();
  }, [loadData]);

  const pieData = [
    { name: "استفاده‌شده", value: sessionStats?.used ?? 0 },
    { name: "باقی‌مانده", value: sessionStats?.remaining ?? 0 },
  ];

  return (
    <div className="p-8 space-y-10 min-h-screen">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">گزارش مالی</h1>
        <p className="text-sm text-gray-500 mt-1">
          نمای کلی درآمد، جلسات و تراکنش‌ها
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
        <SummaryCard title="کل کاربران" value={summary?.totalUsers ?? 0} />
        <SummaryCard title="کل دوره‌ها" value={summary?.totalCourses ?? 0} />
        <SummaryCard
          title="درآمد کل"
          value={`${(summary?.totalRevenue ?? 0).toLocaleString()} تومان`}
          highlight
        />
        <SummaryCard
          title="میانگین قیمت دوره"
          value={`${(summary?.avgCoursePrice ?? 0).toLocaleString()} تومان`}
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <Card className="xl:col-span-2">
          <CardContent>
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
          </CardContent>
        </Card>

        <Card>
          <CardContent>
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
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent>
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
                {logs.length === 0 && (
                  <tr>
                    <td
                      colSpan={4}
                      className="py-8 text-center text-slate-400"
                    >
                      هنوز لاگ مالی ثبت نشده است.
                    </td>
                  </tr>
                )}
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
                    <td>
                      {log.date
                        ? new Date(log.date).toLocaleString("fa-IR")
                        : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

type SummaryCardProps = {
  title: string;
  value: string | number;
  highlight?: boolean;
};

const SummaryCard = ({ title, value, highlight }: SummaryCardProps) => (
  <Card className={highlight ? "border-blue-500 border" : ""}>
    <CardContent>
      <p className="text-sm text-gray-500">{title}</p>
      <p className="text-2xl font-bold mt-2 text-gray-800">{value}</p>
    </CardContent>
  </Card>
);

const CardTitle = ({ children }: { children: React.ReactNode }) => (
  <h2 className="text-lg font-semibold mb-4 text-gray-800">{children}</h2>
);

const Legend = ({ color, label }: { color: string; label: string }) => (
  <div className="flex items-center gap-2">
    <span className={`w-3 h-3 rounded-full ${color}`} />
    <span>{label}</span>
  </div>
);

export default Billing;
