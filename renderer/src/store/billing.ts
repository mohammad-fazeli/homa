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

export const useBillingStore = create<BillingStore>((set, get) => ({
  summary: null,
  revenueData: [],
  sessionStats: null,
  logs: [],

  loadData: async () => {
    const summary = await window.electronAPI?.billingGetSummary();
    const revenueData = await window.electronAPI?.billingGetRevenueByMonth();
    const sessionStats = await window.electronAPI?.billingGetSessionStats();
    const logs = await window.electronAPI?.billingGetRecentLogs();
    if (summary && revenueData && sessionStats && logs) {
      set({
        summary,
        revenueData,
        sessionStats,
        logs,
      });
    }
  },
}));
