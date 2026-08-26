import { create } from "zustand";
import { DashboardOverview } from "../global";

const empty: DashboardOverview = {
  stats: {
    activeUsers: 0,
    weeklySessions: 0,
    monthlyRevenue: 0,
    todayCount: 0,
    attendedToday: 0,
    remainingSessions: 0,
  },
  todaySessions: [],
  upcomingSessions: [],
  recentAttendance: [],
  weeklyBreakdown: [],
  attentionUsers: [],
};

interface DashboardStore {
  overview: DashboardOverview;
  loading: boolean;
  loadData: () => Promise<void>;
}

export const useDashboardStore = create<DashboardStore>((set) => ({
  overview: empty,
  loading: false,

  loadData: async () => {
    set({ loading: true });
    const overview = await window.electronAPI?.dashboardGetOverview();
    if (overview) set({ overview, loading: false });
    else set({ loading: false });
  },
}));
