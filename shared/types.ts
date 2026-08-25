export interface UserAttributes {
  id: number;
  firstName: string;
  lastName: string;
  phone: string;
  nationalId: string;
  uidCart: string;
}

export type UserCreateInput = Omit<UserAttributes, "id">;

export type UserUpdateInput = UserAttributes;

export interface CourseAttributes {
  id: number;
  userId: number;
  cost: number;
  sessions: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export type CourseCreateInput = Omit<
  CourseAttributes,
  "id" | "createdAt" | "updatedAt"
>;

export type CourseResult = CourseAttributes;

export type CourseUpdateInput = CourseAttributes;

export interface SessionAttributes {
  id: number;
  courseId: number;
  date: string | Date;
  used: 0 | 1;
  usedAt: string | Date | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export type SessionCreateInput = Omit<
  SessionAttributes,
  "id" | "createdAt" | "updatedAt"
>;

export type SessionUpdateInput = SessionAttributes;

export type SessionResult = SessionAttributes & {
  userId: number;
  title: string;
  start: Date;
};

export interface NextSessionInfo {
  nextSessionDate: string | Date | null;
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

export interface UserFindAllResult {
  data: UserFindAllItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface UserCourseSessionItem {
  id: number;
  date: string | Date;
  used: 0 | 1;
  usedAt: string | Date | null;
}

export interface UserCourseDetail {
  id: number;
  cost: number;
  totalSessions: number;
  createdAt?: string | Date;
  sessions: UserCourseSessionItem[];
}

export interface UserFindByIdResult {
  id: number;
  firstName: string;
  lastName: string;
  phone: string;
  nationalId: string;
  uidCart: string;
  course: UserCourseDetail | null;
  courses: UserCourseDetail[];
}

export interface UseSessionResult {
  success: boolean;
  message: string;
  code?:
    | "INVALID_CARD"
    | "NO_SESSION"
    | "OUT_OF_TOLERANCE"
    | "ALREADY_USED"
    | "OK";
  sessionId?: number;
  userName?: string;
}

export interface RfidPortInfo {
  path: string;
  manufacturer?: string;
}

export interface AppSettings {
  rfidPort?: string;
}

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

export interface DashboardStats {
  activeUsers: number;
  weeklySessions: number;
  monthlyRevenue: number;
}

export interface WeeklySessionItem {
  day: number;
  value: number;
}

export interface MonthlyIncomeItem {
  month: string;
  value: number;
}

export interface AppConnectionStatus {
  status: "online";
  timestamp: number;
}
