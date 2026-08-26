import { useEffect } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
} from "recharts";
import { Download } from "lucide-react";
import { useBillingStore } from "../store/billing";
import { Card, CardContent } from "../components/card";
import PageHeader from "../components/ui/PageHeader";
import { formatMoney, formatMonth, formatDateTime } from "../lib/format";
import { exportCsv, stampFile } from "../lib/csv";
import { onAppDataChange } from "../lib/bus";
import { toast } from "react-toastify";

const PIE_COLORS = ["#14635c", "#e4d6c2"];

export default function Billing() {
  const { logs, revenueData, sessionStats, summary, loadData } =
    useBillingStore();

  useEffect(() => {
    loadData();
    return onAppDataChange(loadData);
  }, [loadData]);

  const exportLogs = async () => {
    const rows = (await window.electronAPI?.billingGetRecentLogs(500)) ?? logs;
    exportCsv(
      stampFile("billing-logs"),
      ["مشتری", "تغییر", "توضیح", "تاریخ"],
      rows.map((log) => [
        log.userFullName,
        log.change,
        log.description ?? "",
        log.date ? formatDateTime(log.date) : "",
      ])
    );
    toast.success("گزارش مالی ذخیره شد");
  };

  const pieData = [
    { name: "استفاده‌شده", value: sessionStats?.used ?? 0 },
    { name: "باقی‌مانده", value: sessionStats?.remaining ?? 0 },
  ];

  const chartData = revenueData.map((row) => ({
    ...row,
    label: formatMonth(row.month),
  }));

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="گزارش"
        title="مالی"
        description="درآمد دوره‌ها، نسبت جلسات و آخرین تغییرات هزینه."
        actions={
          <button type="button" className="btn btn-ghost" onClick={() => void exportLogs()}>
            <Download size={16} /> خروجی CSV
          </button>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        <SummaryCard title="کل مشتریان" value={summary?.totalUsers ?? 0} />
        <SummaryCard title="کل دوره‌ها" value={summary?.totalCourses ?? 0} />
        <SummaryCard
          title="میانگین قیمت دوره"
          value={formatMoney(summary?.avgCoursePrice ?? 0)}
        />
        <SummaryCard
          title="قراردادها"
          value={formatMoney(summary?.totalRevenue ?? 0)}
        />
        <SummaryCard
          title="دریافت‌شده"
          value={formatMoney(summary?.totalCollected ?? 0)}
          highlight
        />
        <SummaryCard
          title="بدهی باقی"
          value={formatMoney(summary?.totalOutstanding ?? 0)}
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <Card className="xl:col-span-2">
          <CardContent>
            <h2 className="font-semibold text-ink mb-4">درآمد ماهانه</h2>
            <div className="h-72" dir="ltr">
              {chartData.length === 0 ? (
                <p className="text-sm text-muted h-full flex items-center justify-center">
                  هنوز درآمدی ثبت نشده است.
                </p>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#14635c" stopOpacity={0.35} />
                        <stop offset="100%" stopColor="#14635c" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e4d6c2" />
                    <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                    <Tooltip
                      formatter={(value: number) => formatMoney(Number(value))}
                    />
                    <Area
                      type="monotone"
                      dataKey="revenue"
                      stroke="#14635c"
                      fill="url(#rev)"
                      strokeWidth={3}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <h2 className="font-semibold text-ink mb-4">وضعیت جلسات</h2>
            <div className="h-56">
              {pieData.every((row) => row.value === 0) ? (
                <p className="text-sm text-muted h-full flex items-center justify-center">
                  هنوز جلسه‌ای ثبت نشده است.
                </p>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      dataKey="value"
                      innerRadius={58}
                      outerRadius={84}
                      paddingAngle={4}
                    >
                      {pieData.map((_, index) => (
                        <Cell
                          key={index}
                          fill={PIE_COLORS[index % PIE_COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value: number) =>
                        Number(value).toLocaleString("fa-IR")
                      }
                    />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
            <div className="flex justify-center gap-6 text-sm">
              <Legend color="bg-brand" label="استفاده‌شده" />
              <Legend color="bg-line" label="باقی‌مانده" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent>
          <h2 className="font-semibold text-ink mb-4">آخرین تغییرات هزینه</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-line text-muted">
                <tr>
                  <th className="text-right py-3 font-medium">مشتری</th>
                  <th className="text-right font-medium">تغییر</th>
                  <th className="text-right font-medium">توضیح</th>
                  <th className="text-right font-medium">تاریخ</th>
                </tr>
              </thead>
              <tbody>
                {logs.length === 0 && (
                  <tr>
                    <td colSpan={4} className="py-10 text-center text-muted">
                      هنوز لاگ مالی ثبت نشده است.
                    </td>
                  </tr>
                )}
                {logs.map((log) => (
                  <tr
                    key={log.id}
                    className="border-b border-line last:border-none hover:bg-paper/80"
                  >
                    <td className="py-3">{log.userFullName}</td>
                    <td
                      className={`font-bold ${
                        log.change > 0 ? "text-success" : "text-danger"
                      }`}
                    >
                      {log.change > 0 ? "+" : ""}
                      {log.change.toLocaleString("fa-IR")}
                    </td>
                    <td>{log.description}</td>
                    <td>{log.date ? formatDateTime(log.date) : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function SummaryCard({
  title,
  value,
  highlight,
}: {
  title: string;
  value: string | number;
  highlight?: boolean;
}) {
  return (
    <Card className={highlight ? "ring-1 ring-brand/30" : ""}>
      <CardContent>
        <p className="text-sm text-muted">{title}</p>
        <p className="text-2xl font-bold mt-2 text-ink">
          {typeof value === "number" ? value.toLocaleString("fa-IR") : value}
        </p>
      </CardContent>
    </Card>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className={`w-3 h-3 rounded-full ${color}`} />
      <span>{label}</span>
    </div>
  );
}
