export * from "../../shared/types";

export type RendererElectronAPI = {
  minimize: () => void;
  maximize: () => void;
  close: () => void;
  addUser: (
    user: import("../../shared/types").UserCreateInput,
    course?: { cost: number; sessions: number },
    sessions?: string[]
  ) => Promise<import("../../shared/types").UserFindByIdResult>;
  getUser: (
    userid: number
  ) => Promise<import("../../shared/types").UserFindByIdResult>;
  getUsers: (
    page: number,
    limit: number,
    search?: string
  ) => Promise<import("../../shared/types").UserFindAllResult>;
  updateUser: (
    user: import("../../shared/types").UserUpdateInput,
    course?: { cost: number; sessions: number; id: number },
    sessions?: import("../../shared/types").SessionUpdateInput[]
  ) => Promise<import("../../shared/types").UserFindByIdResult>;
  deleteUser: (id: number) => Promise<number>;
  useSession: (uidCart: string) => Promise<{
    success: boolean;
    message: string;
  }>;
  checkDevice: () => Promise<"online" | "offline">;
  getCalender: (
    start: string,
    end: string
  ) => Promise<import("../../shared/types").SessionResult[]>;
  billingGetSummary: () => Promise<import("../../shared/types").BillingSummary>;
  billingGetRevenueByMonth: () => Promise<
    import("../../shared/types").RevenueByMonthItem[]
  >;
  billingGetSessionStats: () => Promise<
    import("../../shared/types").SessionStats
  >;
  billingGetRecentLogs: () => Promise<
    import("../../shared/types").BillingLogItem[]
  >;
  dashboardGetStats: () => Promise<
    import("../../shared/types").DashboardStats
  >;
  ipcRenderer: {
    on: (channel: string, listener: (...args: any[]) => void) => any;
    removeListener: (channel: string, listener: any) => any;
  };
};

declare global {
  interface Window {
    electronAPI?: RendererElectronAPI;
  }
}
