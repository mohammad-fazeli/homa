export interface UserAttributes {
  id: number;
  firstName: string;
  lastName: string;
  phone: string;
  nationalId: string;
  uidCart: string;
}
export interface UserCourseSummary {
  id: number;
  userId: number;
  cost: number;
  totalSessions: number;
  nextSessionDate: string | Date | null;
}

export interface UserFindAllItem {
  id: number;
  firstName: string;
  lastName: string;
  phone: string;
  nationalId: string;
  course: UserCourseSummary;
}

export interface UserCourseSessionItem {
  id: number;
  date: string | Date;
  used: 0 | 1;
  usedAt: string | Date | null;
}

export interface UserFindByIdResult {
  id: number;
  firstName: string;
  lastName: string;
  phone: string;
  nationalId: string;
  uidCart: string;
  course: {
    id: number;
    cost: number;
    totalSessions: number;
    sessions: UserCourseSessionItem[];
  } | null;
}

export interface UserFindAllResult {
  data: UserFindAllItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface UserCreateInput extends Omit<UserAttributes, "id"> {}

export interface UserUpdateInput extends UserAttributes {}

export interface SessionAttributes {
  id: number;
  courseId: number;
  date: string | Date;
  used: 0 | 1;
  usedAt: string | Date | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface SessionUpdateInput extends SessionAttributes {}

export type SessionResult = SessionAttributes & {
  userId: number;
  title: string;
  start: Date;
};

export interface BillingSummary {
  totalUsers: number;
  totalCourses: number;
  totalRevenue: number;
  avgCoursePrice: number;
}

export interface RevenueByMonthItem {
  month: string;
  revenue: number;
}

export interface SessionStats {
  used: number;
  remaining: number;
}

export interface BillingLogItem {
  id: number;
  userFullName: string;
  change: number;
  description: string | null;
  date: string;
}

// ==========================
// Dashboard Types
// ==========================

export interface DashboardStats {
  activeUsers: number;
  weeklySessions: number;
  monthlyRevenue: number;
}

export type RendererElectronAPI = {
  minimize: () => void;
  maximize: () => void;
  close: () => void;
  //user

  addUser: (
    user: UserCreateInput,
    course?: { cost: number; sessions: number },
    sessions?: string[]
  ) => Promise<UserFindByIdResult>;
  getUser: (userid: number) => Promise<UserFindByIdResult>;
  getUsers: (page: number, limit: number) => Promise<UserFindAllResult>;
  updateUser: (
    user: UserUpdateInput,
    course?: { cost: number; sessions: number; id: number },
    sessions?: SessionUpdateInput[]
  ) => Promise<UserFindByIdResult>;
  deleteUser: (id: number) => Promise<number>;
  useSession: (uidCart: string) => Promise<{
    success: boolean;
    message: string;
  }>;
  checkDevice: () => Promise<"online" | "offline">;

  //calender
  getCalender: (start: string, end: string) => Promise<SessionResult[]>;
  //billing
  billingGetSummary: () => Promise<BillingSummary>;
  billingGetRevenueByMonth: () => Promise<RevenueByMonthItem[]>;
  billingGetSessionStats: () => Promise<SessionStats>;
  billingGetRecentLogs: () => Promise<BillingLogItem[]>;
  //DASHBOARD
  dashboardGetStats: () => Promise<DashboardStats>;
  //RFID
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
