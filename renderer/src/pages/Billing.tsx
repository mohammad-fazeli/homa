import { useEffect, useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  AlertCircle,
  Banknote,
  CalendarRange,
  Download,
  Pencil,
  Percent,
  Plus,
  Printer,
  Receipt,
  Search,
  Trash2,
  TrendingUp,
  Users,
  Wallet,
} from "lucide-react";
import { toast } from "react-toastify";
import PageHeader from "../components/ui/PageHeader";
import { Card, CardContent } from "../components/card";
import EmptyState from "../components/ui/EmptyState";
import Modal from "../components/Modal";
import ConfirmDialog from "../components/ui/ConfirmDialog";
import { useBillingStore } from "../store/billing";
import { useUsersStore } from "../store/users";
import { onAppDataChange } from "../lib/bus";
import { exportCsv, stampFile } from "../lib/csv";
import {
  addDaysIso,
  dateInputToIso,
  formatDate,
  formatDateTime,
  formatMoney,
  formatMonth,
  startOfLocalDay,
  toDateInputValue,
} from "../lib/format";
import {
  DEBT_AGING_LABELS,
  PAYMENT_KIND_LABELS,
  PAYMENT_METHOD_LABELS,
  PAYMENT_METHODS,
} from "@shared/finance";
import type { PaymentKind, PaymentMethod } from "../global";

const METHOD_COLORS: Record<string, string> = {
  cash: "#14635c",
  card: "#c4893a",
  transfer: "#3d5a80",
  check: "#7a3e65",
  online: "#2f7d57",
};
const TABS = [
  ["overview", "نمای کلی"],
  ["payments", "اسناد صندوق"],
  ["debtors", "بدهکاران"],
  ["reports", "گزارش دوره"],
] as const;

export default function Billing() {
  const {
    summary,
    revenueData,
    sessionStats,
    logs,
    aging,
    byMethod,
    topDebtors,
    recentPayments,
    payments,
    paymentFilter,
    debtors,
    report,
    reportFrom,
    reportTo,
    tab,
    setTab,
    setPaymentFilter,
    setReportRange,
    openPayment,
    loadOverview,
    loadPayments,
    loadDebtors,
    loadReport,
    removePayment,
  } = useBillingStore();
  const openUser = useUsersStore((s) => s.openUser);
  const [search, setSearch] = useState("");
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [expanded, setExpanded] = useState<number | null>(null);

  useEffect(() => {
    void loadOverview();
    const today = startOfLocalDay();
    if (!reportFrom) {
      setReportRange(today.toISOString(), addDaysIso(today, 1));
    }
    return onAppDataChange(() => {
      void loadOverview();
      void loadPayments();
      void loadDebtors();
    });
  }, [loadOverview, loadPayments, loadDebtors, reportFrom, setReportRange]);

  useEffect(() => {
    if (tab === "payments") void loadPayments();
    if (tab === "debtors") void loadDebtors();
    if (tab === "reports") void loadReport();
  }, [tab, loadPayments, loadDebtors, loadReport, paymentFilter, reportFrom, reportTo]);

  const chartData = useMemo(
    () => revenueData.map((row) => ({ ...row, label: formatMonth(row.month) })),
    [revenueData]
  );
  const methodPie = byMethod
    .filter((row) => row.amount > 0)
    .map((row) => ({
      method: row.method,
      amount: row.amount,
      name: PAYMENT_METHOD_LABELS[row.method],
    }));

  const exportPayments = () => {
    exportCsv(
      stampFile("payments"),
      ["تاریخ", "مشتری", "دوره", "نوع", "روش", "مبلغ", "پیگیری", "توضیح"],
      payments.data.map((row) => [
        formatDateTime(row.paidAt),
        row.userFullName ?? "",
        row.courseTitle ?? "",
        PAYMENT_KIND_LABELS[row.kind],
        PAYMENT_METHOD_LABELS[row.method],
        row.amount,
        row.reference ?? "",
        row.note ?? "",
      ])
    );
    toast.success("خروجی اسناد ذخیره شد");
  };

  const exportDebtors = () => {
    exportCsv(
      stampFile("debtors"),
      ["مشتری", "تلفن", "قرارداد", "اعمال‌شده", "بدهی", "بستانکاری", "آخرین پرداخت"],
      debtors.map((row) => [
        `${row.firstName} ${row.lastName}`,
        row.phone,
        row.contracted,
        row.applied,
        row.debt,
        row.credit,
        row.lastPaidAt ? formatDateTime(row.lastPaidAt) : "",
      ])
    );
    toast.success("فهرست بدهکاران ذخیره شد");
  };

  const setPreset = (days: number | "month") => {
    const start = startOfLocalDay();
    if (days === "month") {
      const month = new Date(start.getFullYear(), start.getMonth(), 1);
      setReportRange(month.toISOString(), addDaysIso(start, 1));
    } else {
      setReportRange(addDaysIso(start, -days + 1), addDaysIso(start, 1));
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="صندوق آموزشگاه"
        title="مالی"
        description="دریافت واقعی، بدهی مشتریان، استرداد، تخفیف و گزارش صندوق از قرارداد جداست."
        actions={
          <div className="flex flex-wrap gap-2 no-print">
            <button className="btn btn-ghost" onClick={exportPayments}>
              <Download size={16} /> خروجی اسناد
            </button>
            <button className="btn btn-primary" onClick={() => openPayment()}>
              <Plus size={16} /> ثبت دریافت
            </button>
          </div>
        }
      />

      <div className="flex flex-wrap gap-2 no-print">
        {TABS.map(([id, label]) => (
          <button
            key={id}
            className={`chip ${tab === id ? "chip-on" : ""}`}
            onClick={() => setTab(id)}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === "overview" && (
        <>
          <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
            <Kpi title="صندوق امروز" value={formatMoney(summary.todayNet)} hint={`دریافت ${formatMoney(summary.todayCollected)}`} icon={Banknote} gold />
            <Kpi title="دریافت این ماه" value={formatMoney(summary.monthNet)} hint={`استرداد ${formatMoney(summary.monthRefunded)}`} icon={Wallet} />
            <Kpi title="بدهی کل" value={formatMoney(summary.totalOutstanding)} hint={`${summary.debtorCount.toLocaleString("fa-IR")} بدهکار`} icon={AlertCircle} warn={summary.totalOutstanding > 0} />
            <Kpi title="نرخ تسویه" value={`${summary.settlementRate.toLocaleString("fa-IR")}٪`} hint={`وصول نقدی ${summary.collectionRate.toLocaleString("fa-IR")}٪`} icon={Percent} />
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
            <Card className="xl:col-span-2">
              <CardContent>
                <h2 className="font-semibold mb-4">قرارداد و دریافت ماهانه</h2>
                <div className="h-72" dir="ltr">
                  {chartData.length === 0 ? (
                    <EmptyState icon={<TrendingUp size={20} />} title="هنوز سندی نیست" />
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={chartData}>
                        <defs>
                          <linearGradient id="cash" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#14635c" stopOpacity={0.35} />
                            <stop offset="100%" stopColor="#14635c" stopOpacity={0} />
                          </linearGradient>
                          <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#c4893a" stopOpacity={0.28} />
                            <stop offset="100%" stopColor="#c4893a" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e4d6c2" />
                        <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                        <Tooltip formatter={(value: number) => formatMoney(Number(value))} />
                        <Area type="monotone" dataKey="revenue" name="قرارداد" stroke="#c4893a" fill="url(#rev)" strokeWidth={2} />
                        <Area type="monotone" dataKey="collected" name="دریافت" stroke="#14635c" fill="url(#cash)" strokeWidth={3} />
                      </AreaChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent>
                <h2 className="font-semibold mb-4">روش‌های دریافت</h2>
                <div className="h-52">
                  {methodPie.length === 0 ? (
                    <EmptyState icon={<Wallet size={20} />} title="دریافتی ثبت نشده" />
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={methodPie} dataKey="amount" innerRadius={48} outerRadius={74} paddingAngle={3}>
                          {methodPie.map((row) => (
                            <Cell key={row.method} fill={METHOD_COLORS[row.method] ?? "#14635c"} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value: number) => formatMoney(Number(value))} />
                      </PieChart>
                    </ResponsiveContainer>
                  )}
                </div>
                <div className="space-y-2 text-sm">
                  {methodPie.map((row) => (
                    <div key={row.method} className="flex justify-between">
                      <span>{PAYMENT_METHOD_LABELS[row.method]}</span>
                      <span className="font-medium">{formatMoney(row.amount)}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
            <Card>
              <CardContent>
                <h2 className="font-semibold mb-3">عمر بدهی</h2>
                <div className="h-44" dir="ltr">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={aging}>
                      <XAxis dataKey="label" tick={{ fontSize: 10 }} />
                      <YAxis hide />
                      <Tooltip formatter={(value: number) => formatMoney(Number(value))} />
                      <Bar dataKey="amount" fill="#c4893a" radius={[8, 8, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                {aging.every((row) => row.amount === 0) && (
                  <p className="text-sm text-muted text-center">بدهی معوقی نیست.</p>
                )}
              </CardContent>
            </Card>
            <Card className="xl:col-span-2">
              <CardContent>
                <div className="flex items-center justify-between mb-3">
                  <h2 className="font-semibold">بدهکاران بزرگ</h2>
                  <button className="text-sm text-brand" onClick={() => setTab("debtors")}>
                    همه
                  </button>
                </div>
                {topDebtors.length === 0 ? (
                  <EmptyState icon={<Users size={20} />} title="بدهکاری باقی نمانده" />
                ) : (
                  <div className="space-y-2">
                    {topDebtors.map((row) => (
                      <button
                        key={row.userId}
                        className="w-full rounded-2xl border border-line px-3 py-2.5 flex items-center justify-between hover:bg-paper"
                        onClick={() => openUser(row.userId)}
                      >
                        <span>
                          {row.firstName} {row.lastName}
                        </span>
                        <span className="text-gold font-semibold">{formatMoney(row.debt)}</span>
                      </button>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            <Card>
              <CardContent>
                <h2 className="font-semibold mb-3">آخرین اسناد صندوق</h2>
                {recentPayments.length === 0 ? (
                  <EmptyState icon={<Receipt size={20} />} title="سندی ثبت نشده" />
                ) : (
                  <div className="space-y-2">
                    {recentPayments.map((row) => (
                      <div key={row.id} className="flex items-center justify-between text-sm py-1">
                        <div>
                          <div>{row.userFullName}</div>
                          <div className="text-xs text-muted">
                            {PAYMENT_KIND_LABELS[row.kind]} · {PAYMENT_METHOD_LABELS[row.method]}
                          </div>
                        </div>
                        <span className={row.kind === "refund" ? "text-danger" : "text-success"}>
                          {row.kind === "refund" ? "−" : "+"}
                          {formatMoney(row.amount)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
            <Card>
              <CardContent>
                <h2 className="font-semibold mb-3">تغییر قرارداد دوره‌ها</h2>
                {logs.length === 0 ? (
                  <p className="text-sm text-muted">تغییری ثبت نشده است.</p>
                ) : (
                  logs.map((log) => (
                    <div key={log.id} className="flex justify-between text-sm py-1.5 border-b border-line last:border-none">
                      <span>{log.userFullName}</span>
                      <span className={log.change > 0 ? "text-success" : "text-danger"}>
                        {log.change > 0 ? "+" : ""}
                        {log.change.toLocaleString("fa-IR")}
                      </span>
                    </div>
                  ))
                )}
                <p className="text-xs text-muted mt-3">
                  جلسات استفاده‌شده {sessionStats.used.toLocaleString("fa-IR")} · باقی {sessionStats.remaining.toLocaleString("fa-IR")}
                </p>
              </CardContent>
            </Card>
          </div>
        </>
      )}

      {tab === "payments" && (
        <Card>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-2">
              <div className="relative">
                <Search size={15} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted" />
                <input
                  className="rounded-2xl border border-line bg-paper pr-9 pl-3 py-2 text-sm w-52"
                  placeholder="جستجوی مشتری یا پیگیری"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onBlur={() => setPaymentFilter({ search })}
                />
              </div>
              <select
                className="rounded-2xl border border-line bg-paper px-3 py-2 text-sm"
                value={paymentFilter.method ?? "all"}
                onChange={(e) => setPaymentFilter({ method: e.target.value as PaymentMethod | "all" })}
              >
                <option value="all">همه روش‌ها</option>
                {PAYMENT_METHODS.map((item) => (
                  <option key={item} value={item}>
                    {PAYMENT_METHOD_LABELS[item]}
                  </option>
                ))}
              </select>
              <select
                className="rounded-2xl border border-line bg-paper px-3 py-2 text-sm"
                value={paymentFilter.kind ?? "all"}
                onChange={(e) => setPaymentFilter({ kind: e.target.value as PaymentKind | "all" })}
              >
                <option value="all">همه انواع</option>
                {Object.entries(PAYMENT_KIND_LABELS).map(([id, label]) => (
                  <option key={id} value={id}>
                    {label}
                  </option>
                ))}
              </select>
              <div className="ms-auto text-sm text-muted">
                خالص {formatMoney(payments.net)} · {payments.total.toLocaleString("fa-IR")} سند
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-muted border-b border-line">
                  <tr>
                    <th className="text-right py-2 font-medium">تاریخ</th>
                    <th className="text-right font-medium">مشتری</th>
                    <th className="text-right font-medium">نوع</th>
                    <th className="text-right font-medium">روش</th>
                    <th className="text-right font-medium">مبلغ</th>
                    <th className="no-print" />
                  </tr>
                </thead>
                <tbody>
                  {payments.data.length === 0 && (
                    <tr>
                      <td colSpan={6}>
                        <EmptyState icon={<Receipt size={20} />} title="سندی با این فیلتر نیست" />
                      </td>
                    </tr>
                  )}
                  {payments.data.map((row) => (
                    <tr key={row.id} className="border-b border-line last:border-none">
                      <td className="py-2.5">{formatDateTime(row.paidAt)}</td>
                      <td>
                        <button className="hover:text-brand" onClick={() => openUser(row.userId)}>
                          {row.userFullName}
                        </button>
                        {row.courseTitle && <div className="text-xs text-muted">{row.courseTitle}</div>}
                      </td>
                      <td>{PAYMENT_KIND_LABELS[row.kind]}</td>
                      <td>{PAYMENT_METHOD_LABELS[row.method]}</td>
                      <td className={row.kind === "refund" ? "text-danger font-semibold" : "font-semibold"}>
                        {formatMoney(row.amount)}
                      </td>
                      <td className="no-print">
                        <div className="flex gap-1 justify-end">
                          <button
                            className="p-1.5 rounded-xl hover:bg-paper"
                            onClick={() =>
                              openPayment({
                                paymentId: row.id,
                                userId: row.userId,
                                courseId: row.courseId,
                                amount: row.amount,
                                kind: row.kind,
                                method: row.method,
                                note: row.note,
                                reference: row.reference,
                                paidAt: row.paidAt,
                              })
                            }
                          >
                            <Pencil size={14} />
                          </button>
                          <button className="p-1.5 rounded-xl hover:bg-paper text-danger" onClick={() => setDeleteId(row.id)}>
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {tab === "debtors" && (
        <Card>
          <CardContent className="space-y-3">
            <div className="flex justify-between items-center">
              <p className="text-sm text-muted">
                {debtors.filter((row) => row.debt > 0).length.toLocaleString("fa-IR")} بدهکار ·{" "}
                {debtors.filter((row) => row.credit > 0).length.toLocaleString("fa-IR")} بستانکار
              </p>
              <button className="btn btn-ghost" onClick={exportDebtors}>
                <Download size={16} /> خروجی بدهکاران
              </button>
            </div>
            {debtors.length === 0 ? (
              <EmptyState icon={<Users size={20} />} title="حساب همه تسویه است" />
            ) : (
              debtors.map((row) => (
                <div key={row.userId} className="rounded-2xl border border-line p-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <button className="text-right" onClick={() => openUser(row.userId)}>
                      <div className="font-medium">
                        {row.firstName} {row.lastName}
                      </div>
                      <div className="text-xs text-muted" dir="ltr">
                        {row.phone}
                      </div>
                    </button>
                    <div className="flex items-center gap-2">
                      {row.debt > 0 && <span className="text-gold font-semibold">{formatMoney(row.debt)}</span>}
                      {row.credit > 0 && <span className="text-success text-sm">بستانکار {formatMoney(row.credit)}</span>}
                      {row.debt > 0 && (
                        <button
                          className="btn btn-primary py-1.5 text-sm"
                          onClick={() =>
                            openPayment({ userId: row.userId, amount: row.debt, kind: "payment" })
                          }
                        >
                          دریافت
                        </button>
                      )}
                      <button className="text-xs text-muted" onClick={() => setExpanded(expanded === row.userId ? null : row.userId)}>
                        دوره‌ها
                      </button>
                    </div>
                  </div>
                  {expanded === row.userId && (
                    <div className="mt-3 space-y-1 text-xs text-muted">
                      {row.courses.map((course) => (
                        <div key={course.id} className="flex justify-between">
                          <span>{course.title}</span>
                          <span>
                            {course.debt > 0 ? `مانده ${formatMoney(course.debt)}` : "تسویه"}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))
            )}
          </CardContent>
        </Card>
      )}

      {tab === "reports" && (
        <div className="space-y-4 print-area">
          <div className="hidden print:block text-center mb-4">
            <h1 className="text-2xl font-bold">صندوق هما</h1>
            <p className="text-sm text-muted">
              {report ? `${formatDate(report.from)} تا ${formatDate(report.to)}` : ""}
            </p>
          </div>
          <div className="flex flex-wrap gap-2 no-print">
            <button className="chip" onClick={() => setPreset(1)}>امروز</button>
            <button className="chip" onClick={() => setPreset(7)}>۷ روز</button>
            <button className="chip" onClick={() => setPreset("month")}>این ماه</button>
            <input
              type="date"
              className="rounded-2xl border border-line px-3 py-2 text-sm"
              value={reportFrom ? toDateInputValue(reportFrom) : ""}
              onChange={(e) => setReportRange(dateInputToIso(e.target.value), reportTo)}
            />
            <input
              type="date"
              className="rounded-2xl border border-line px-3 py-2 text-sm"
              value={reportTo ? toDateInputValue(addDaysIso(reportTo, -1)) : ""}
              onChange={(e) => setReportRange(reportFrom, addDaysIso(dateInputToIso(e.target.value), 1))}
            />
            <button className="btn btn-ghost" onClick={() => window.print()}>
              <Printer size={16} /> چاپ صندوق
            </button>
          </div>
          {report && (
            <>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <Kpi title="دریافت" value={formatMoney(report.collected)} icon={Banknote} />
                <Kpi title="استرداد" value={formatMoney(report.refunded)} icon={Receipt} />
                <Kpi title="تخفیف" value={formatMoney(report.discounted)} icon={Percent} />
                <Kpi title="خالص صندوق" value={formatMoney(report.net)} icon={Wallet} gold />
              </div>
              <Card>
                <CardContent>
                  <h2 className="font-semibold mb-3">به تفکیک روز</h2>
                  <table className="w-full text-sm">
                    <thead className="text-muted border-b border-line">
                      <tr>
                        <th className="text-right py-2">روز</th>
                        <th className="text-right">دریافت</th>
                        <th className="text-right">استرداد</th>
                        <th className="text-right">خالص</th>
                      </tr>
                    </thead>
                    <tbody>
                      {report.byDay.map((row) => (
                        <tr key={row.date} className="border-b border-line last:border-none">
                          <td className="py-2">{formatDate(row.date)}</td>
                          <td>{formatMoney(row.collected)}</td>
                          <td>{formatMoney(row.refunded)}</td>
                          <td className="font-medium">{formatMoney(row.net)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </CardContent>
              </Card>
            </>
          )}
        </div>
      )}

      {deleteId !== null && (
        <Modal onClose={() => setDeleteId(null)}>
          <ConfirmDialog
            title="حذف سند مالی؟"
            description="با حذف این سند، بدهی و صندوق دوباره محاسبه می‌شود."
            confirmLabel="حذف سند"
            onCancel={() => setDeleteId(null)}
            onConfirm={() => {
              void removePayment(deleteId)
                .then(() => {
                  toast.success("سند حذف شد");
                  setDeleteId(null);
                })
                .catch((err) => toast.error(err instanceof Error ? err.message : "حذف ناموفق بود"));
            }}
          />
        </Modal>
      )}
    </div>
  );
}

function Kpi({
  title,
  value,
  hint,
  icon: Icon,
  gold,
  warn,
}: {
  title: string;
  value: string;
  hint?: string;
  icon: typeof Wallet;
  gold?: boolean;
  warn?: boolean;
}) {
  return (
    <Card className={gold ? "ring-1 ring-gold/30" : warn ? "ring-1 ring-gold/20" : ""}>
      <CardContent className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs text-muted">{title}</p>
          <p className="text-lg font-bold mt-1 text-ink">{value}</p>
          {hint && <p className="text-xs text-muted mt-1">{hint}</p>}
        </div>
        <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${gold ? "bg-gold-soft text-gold" : "bg-brand-soft text-brand"}`}>
          <Icon size={18} />
        </div>
      </CardContent>
    </Card>
  );
}
