import { create } from "zustand";
import type {
  BillingLogItem,
  BillingOverview,
  BillingSummary,
  CashReport,
  DebtorRow,
  PaymentAttributes,
  PaymentCreateInput,
  PaymentKind,
  PaymentListFilter,
  PaymentListResult,
  PaymentMethod,
  PaymentUpdateInput,
  RevenueByMonthItem,
  SessionStats,
} from "../global";
import { emitAppDataChange } from "../lib/bus";

export type BillingTab = "overview" | "payments" | "debtors" | "reports";

export type PaymentDraft = {
  paymentId?: number;
  userId?: number;
  courseId?: number | null;
  amount?: number;
  kind?: PaymentKind;
  method?: PaymentMethod;
  note?: string | null;
  reference?: string | null;
  paidAt?: string;
};

const emptySummary: BillingSummary = {
  totalUsers: 0,
  totalCourses: 0,
  totalRevenue: 0,
  totalCollected: 0,
  totalRefunded: 0,
  totalDiscounted: 0,
  netCash: 0,
  totalOutstanding: 0,
  totalCredit: 0,
  avgCoursePrice: 0,
  debtorCount: 0,
  creditorCount: 0,
  collectionRate: 0,
  settlementRate: 0,
  todayCollected: 0,
  todayRefunded: 0,
  todayNet: 0,
  weekCollected: 0,
  monthCollected: 0,
  monthRefunded: 0,
  monthNet: 0,
};

const emptyPayments: PaymentListResult = {
  data: [],
  total: 0,
  collected: 0,
  refunded: 0,
  discounted: 0,
  net: 0,
};

interface BillingStore {
  summary: BillingSummary;
  revenueData: RevenueByMonthItem[];
  sessionStats: SessionStats;
  logs: BillingLogItem[];
  aging: BillingOverview["aging"];
  byMethod: BillingOverview["byMethod"];
  topDebtors: DebtorRow[];
  recentPayments: PaymentAttributes[];
  payments: PaymentListResult;
  paymentFilter: PaymentListFilter;
  debtors: DebtorRow[];
  report: CashReport | null;
  reportFrom: string;
  reportTo: string;
  tab: BillingTab;
  draft: PaymentDraft | null;
  loading: boolean;
  setTab: (tab: BillingTab) => void;
  setPaymentFilter: (filter: PaymentListFilter) => void;
  setReportRange: (from: string, to: string) => void;
  openPayment: (draft?: PaymentDraft) => void;
  closePayment: () => void;
  loadOverview: () => Promise<void>;
  loadPayments: () => Promise<void>;
  loadDebtors: () => Promise<void>;
  loadReport: () => Promise<void>;
  savePayment: (data: PaymentCreateInput | PaymentUpdateInput) => Promise<void>;
  removePayment: (id: number) => Promise<void>;
}

export const useBillingStore = create<BillingStore>((set, get) => ({
  summary: emptySummary,
  revenueData: [],
  sessionStats: { used: 0, remaining: 0, absent: 0, cancelled: 0 },
  logs: [],
  aging: [],
  byMethod: [],
  topDebtors: [],
  recentPayments: [],
  payments: emptyPayments,
  paymentFilter: { limit: 80 },
  debtors: [],
  report: null,
  reportFrom: "",
  reportTo: "",
  tab: "overview",
  draft: null,
  loading: false,

  setTab: (tab) => set({ tab }),
  setPaymentFilter: (filter) => set({ paymentFilter: { ...get().paymentFilter, ...filter } }),
  setReportRange: (from, to) => set({ reportFrom: from, reportTo: to }),
  openPayment: (draft = {}) => set({ draft }),
  closePayment: () => set({ draft: null }),

  loadOverview: async () => {
    const overview = await window.electronAPI?.billingGetOverview();
    if (!overview) return;
    set({
      summary: overview.summary,
      revenueData: overview.revenueByMonth,
      sessionStats: overview.sessionStats,
      logs: overview.logs,
      aging: overview.aging,
      byMethod: overview.byMethod,
      topDebtors: overview.topDebtors,
      recentPayments: overview.recentPayments,
    });
  },

  loadPayments: async () => {
    const payments = await window.electronAPI?.billingListPayments(get().paymentFilter);
    if (payments) set({ payments });
  },

  loadDebtors: async () => {
    const debtors = await window.electronAPI?.billingListDebtors();
    if (debtors) set({ debtors });
  },

  loadReport: async () => {
    const { reportFrom, reportTo } = get();
    if (!reportFrom || !reportTo) return;
    const report = await window.electronAPI?.billingGetRangeReport(reportFrom, reportTo);
    if (report) set({ report });
  },

  savePayment: async (data) => {
    if ("id" in data && data.id) {
      await window.electronAPI?.billingUpdatePayment(data);
    } else {
      await window.electronAPI?.billingCreatePayment(data as PaymentCreateInput);
    }
    set({ draft: null });
    emitAppDataChange();
  },

  removePayment: async (id) => {
    await window.electronAPI?.billingDeletePayment(id);
    emitAppDataChange();
  },
}));
