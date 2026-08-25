import { create } from "zustand";
import { DashboardStats } from "../global";

interface DashboardStore {
  statsResult: DashboardStats;
  loadData: () => Promise<void>;
}

export const useDashboardStore = create<DashboardStore>((set) => ({
  statsResult: {
    activeUsers: 0,
    weeklySessions: 0,
    monthlyRevenue: 0,
  },

  loadData: async () => {
    const statsResult = await window.electronAPI?.dashboardGetStats();
    if (statsResult) {
      set({ statsResult });
    }
  },
}));
