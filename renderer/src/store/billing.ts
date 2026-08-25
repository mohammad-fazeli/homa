import { create } from "zustand";
import {
  BillingLogItem,
  BillingSummary,
  RevenueByMonthItem,
  SessionStats,
} from "../global";

interface BillingStore {
  summary: BillingSummary | null;
  revenueData: RevenueByMonthItem[];
  sessionStats: SessionStats | null;
  logs: BillingLogItem[];
  loadData: () => Promise<void>;
}

export const useBillingStore = create<BillingStore>((set) => ({
  summary: null,
  revenueData: [],
  sessionStats: null,
  logs: [],

  loadData: async () => {
    const [summary, revenueData, sessionStats, logs] = await Promise.all([
      window.electronAPI?.billingGetSummary(),
      window.electronAPI?.billingGetRevenueByMonth(),
      window.electronAPI?.billingGetSessionStats(),
      window.electronAPI?.billingGetRecentLogs(),
    ]);

    set({
      summary: summary ?? null,
      revenueData: revenueData ?? [],
      sessionStats: sessionStats ?? { used: 0, remaining: 0 },
      logs: logs ?? [],
    });
  },
}));
