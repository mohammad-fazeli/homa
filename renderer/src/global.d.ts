export * from "../../shared/types";
import type {
  UserCreateInput,
  UserFindAllResult,
  UserFindByIdResult,
  UserUpdateInput,
  SessionUpdateInput,
  SessionResult,
  BillingSummary,
  RevenueByMonthItem,
  SessionStats,
  BillingLogItem,
  DashboardStats,
  DashboardOverview,
  UseSessionResult,
  RfidPortInfo,
  UserListFilter,
  UserFilterCounts,
  AppSettings,
  CourseWriteInput,
  AcademySnapshot,
  RoomWriteInput,
  InstructorWriteInput,
  CourseTemplateWriteInput,
  PaymentAttributes,
  PaymentCreateInput,
  PaymentUpdateInput,
  PaymentListFilter,
  PaymentListResult,
  DebtorRow,
  CashReport,
  BillingOverview,
  SessionStatus,
} from "../../shared/types";

export type RendererElectronAPI = {
  minimize: () => void;
  maximize: () => void;
  close: () => void;
  addUser: (
    user: UserCreateInput,
    course?: CourseWriteInput,
    sessions?: string[]
  ) => Promise<UserFindByIdResult>;
  getUser: (userid: number) => Promise<UserFindByIdResult>;
  getUsers: (
    page: number,
    limit: number,
    search?: string,
    filter?: UserListFilter
  ) => Promise<UserFindAllResult>;
  getUserFilterCounts: () => Promise<UserFilterCounts>;
  updateUser: (
    user: UserUpdateInput,
    course?: CourseWriteInput & { id: number },
    sessions?: SessionUpdateInput[]
  ) => Promise<UserFindByIdResult>;
  saveCourse: (
    userId: number,
    course: CourseWriteInput,
    sessions?: SessionUpdateInput[]
  ) => Promise<UserFindByIdResult>;
  deleteCourse: (courseId: number) => Promise<number>;
  deleteUser: (id: number) => Promise<number>;
  addSession: (userId: number, dateIso: string) => Promise<UserFindByIdResult>;
  removeLastSession: (userId: number) => Promise<UserFindByIdResult>;
  useSession: (
    uidCart: string,
    options?: { force?: boolean; sessionId?: number }
  ) => Promise<UseSessionResult>;
  markSession: (sessionId: number) => Promise<UseSessionResult>;
  unmarkSession: (sessionId: number) => Promise<UseSessionResult>;
  checkDevice: () => Promise<"online" | "offline">;
  rfidListPorts: () => Promise<RfidPortInfo[]>;
  rfidGetPort: () => Promise<string>;
  rfidSetPort: (
    portPath: string
  ) => Promise<{ ok: boolean; status: "online" | "offline" }>;
  dbBackup: () => Promise<{ ok?: boolean; cancelled?: boolean; path?: string }>;
  dbRestore: () => Promise<{ ok?: boolean; cancelled?: boolean }>;
  getCalendar: (start: string, end: string) => Promise<SessionResult[]>;
  getCalender: (start: string, end: string) => Promise<SessionResult[]>;
  billingGetSummary: () => Promise<BillingSummary>;
  billingGetRevenueByMonth: () => Promise<RevenueByMonthItem[]>;
  billingGetSessionStats: () => Promise<SessionStats>;
  billingGetRecentLogs: (limit?: number) => Promise<BillingLogItem[]>;
  dashboardGetStats: () => Promise<DashboardStats>;
  dashboardGetOverview: () => Promise<DashboardOverview>;
  settingsGet: () => Promise<AppSettings>;
  settingsSet: (partial: AppSettings) => Promise<AppSettings>;
  settingsSetPin: (pin: string) => Promise<AppSettings>;
  settingsClearPin: () => Promise<AppSettings>;
  settingsVerifyPin: (pin: string) => Promise<boolean>;
  academySnapshot: () => Promise<AcademySnapshot>;
  academySaveRoom: (data: RoomWriteInput) => Promise<unknown>;
  academyDeleteRoom: (id: number) => Promise<number>;
  academySaveInstructor: (data: InstructorWriteInput) => Promise<unknown>;
  academyDeleteInstructor: (id: number) => Promise<number>;
  academySaveTemplate: (data: CourseTemplateWriteInput) => Promise<unknown>;
  academyDeleteTemplate: (id: number) => Promise<number>;
  billingListPayments: (
    filter?: PaymentListFilter | number,
    userId?: number
  ) => Promise<PaymentListResult>;
  billingCreatePayment: (data: PaymentCreateInput) => Promise<PaymentAttributes>;
  billingUpdatePayment: (data: PaymentUpdateInput) => Promise<PaymentAttributes>;
  billingDeletePayment: (id: number) => Promise<number>;
  billingGetOverview: () => Promise<BillingOverview>;
  billingListDebtors: () => Promise<DebtorRow[]>;
  billingGetRangeReport: (from: string, to: string) => Promise<CashReport>;
  setSessionStatus: (
    sessionId: number,
    status: SessionStatus
  ) => Promise<UseSessionResult>;
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
