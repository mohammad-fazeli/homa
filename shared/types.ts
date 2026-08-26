export type SessionStatus =
  | "scheduled"
  | "present"
  | "absent"
  | "cancelled"
  | "makeup";

export type PaymentMethod = "cash" | "card" | "transfer";

export interface UserAttributes {
  id: number;
  firstName: string;
  lastName: string;
  phone: string;
  nationalId: string;
  uidCart: string;
  notes?: string | null;
}

export type UserCreateInput = Omit<UserAttributes, "id">;

export type UserUpdateInput = UserAttributes;

export interface CourseAttributes {
  id: number;
  userId: number;
  cost: number;
  sessions: number;
  title?: string | null;
  roomId?: number | null;
  instructorId?: number | null;
  templateId?: number | null;
  expiresAt?: string | Date | null;
  notes?: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export type CourseCreateInput = Omit<
  CourseAttributes,
  "id" | "createdAt" | "updatedAt"
>;

export type CourseResult = CourseAttributes;

export type CourseUpdateInput = CourseAttributes;

export interface CourseWriteInput {
  id?: number;
  cost: number;
  sessions: number;
  title?: string | null;
  roomId?: number | null;
  instructorId?: number | null;
  templateId?: number | null;
  expiresAt?: string | null;
  notes?: string | null;
  paidNow?: boolean;
}

export interface SessionAttributes {
  id: number;
  courseId: number;
  date: string | Date;
  used: 0 | 1;
  usedAt: string | Date | null;
  status?: SessionStatus;
  roomId?: number | null;
  instructorId?: number | null;
  notes?: string | null;
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
  status: SessionStatus;
  roomId: number | null;
  instructorId: number | null;
  courseTitle: string;
  roomName: string | null;
  roomColor: string | null;
  instructorName: string | null;
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
  title?: string | null;
  roomName?: string | null;
}

export interface UserFindAllItem {
  id: number;
  firstName: string;
  lastName: string;
  phone: string;
  nationalId: string;
  course: UserCourseSummary;
  usedSessions: number;
  remainingSessions: number;
  hasCard: boolean;
  courseTitle: string;
  roomName: string | null;
  debt: number;
  expired: boolean;
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
  status: SessionStatus;
  roomId: number | null;
  instructorId: number | null;
}

export interface UserCourseDetail {
  id: number;
  cost: number;
  totalSessions: number;
  title: string;
  roomId: number | null;
  instructorId: number | null;
  templateId: number | null;
  expiresAt: string | Date | null;
  notes: string | null;
  roomName: string | null;
  roomColor: string | null;
  instructorName: string | null;
  paidAmount: number;
  debt: number;
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
  notes: string | null;
  course: UserCourseDetail | null;
  courses: UserCourseDetail[];
  debt: number;
}

export type UserListFilter =
  | "all"
  | "no_card"
  | "low_credit"
  | "today"
  | "expired"
  | "debt";

export interface UserFilterCounts {
  all: number;
  no_card: number;
  low_credit: number;
  today: number;
  expired: number;
  debt: number;
}

export interface UseSessionResult {
  success: boolean;
  message: string;
  code?:
    | "INVALID_CARD"
    | "NO_SESSION"
    | "OUT_OF_TOLERANCE"
    | "ALREADY_USED"
    | "OK"
    | "UNMARKED";
  sessionId?: number;
  userName?: string;
  remainingSessions?: number;
  totalSessions?: number;
}

export interface RfidPortInfo {
  path: string;
  manufacturer?: string;
}

export interface AppSettings {
  rfidPort?: string;
  attendanceToleranceMinutes?: number;
  lockEnabled?: boolean;
  lockPinHash?: string;
}

export interface RoomAttributes {
  id: number;
  name: string;
  color: string;
  capacity: number;
  notes: string | null;
}

export type RoomWriteInput = {
  id?: number;
  name: string;
  color: string;
  capacity: number;
  notes?: string | null;
};

export interface InstructorAttributes {
  id: number;
  firstName: string;
  lastName: string;
  phone: string | null;
  color: string;
  notes: string | null;
}

export type InstructorWriteInput = {
  id?: number;
  firstName: string;
  lastName: string;
  phone?: string | null;
  color: string;
  notes?: string | null;
};

export interface CourseTemplateAttributes {
  id: number;
  name: string;
  sessions: number;
  cost: number;
  durationMinutes: number;
}

export type CourseTemplateWriteInput = {
  id?: number;
  name: string;
  sessions: number;
  cost: number;
  durationMinutes?: number;
};

export interface PaymentAttributes {
  id: number;
  userId: number;
  courseId: number | null;
  amount: number;
  method: PaymentMethod;
  note: string | null;
  paidAt: string;
  userFullName?: string;
  courseTitle?: string | null;
}

export type PaymentCreateInput = {
  userId: number;
  courseId?: number | null;
  amount: number;
  method: PaymentMethod;
  note?: string | null;
  paidAt?: string;
};

export interface BillingSummary {
  totalUsers: number;
  totalCourses: number;
  totalRevenue: number;
  totalCollected: number;
  totalOutstanding: number;
  avgCoursePrice: number;
}

export interface RevenueByMonthItem {
  month: string;
  revenue: number;
  collected: number;
}

export interface SessionStats {
  used: number;
  remaining: number;
  absent: number;
  cancelled: number;
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
  todayCount: number;
  attendedToday: number;
  remainingSessions: number;
}

export interface DashboardSessionItem {
  id: number;
  userId: number;
  title: string;
  date: string;
  used: 0 | 1;
  usedAt: string | Date | null;
  status: SessionStatus;
  roomName: string | null;
  roomColor: string | null;
  instructorName: string | null;
  courseTitle: string;
}

export interface DashboardAttentionUser {
  id: number;
  firstName: string;
  lastName: string;
  remainingSessions: number;
  totalSessions: number;
  expired?: boolean;
}

export interface RoomOccupancyItem {
  roomId: number;
  name: string;
  color: string;
  capacity: number;
  booked: number;
  present: number;
}

export interface WeeklyBreakdownItem {
  day: number;
  label: string;
  total: number;
  used: number;
}

export interface DashboardOverview {
  stats: DashboardStats;
  todaySessions: DashboardSessionItem[];
  upcomingSessions: DashboardSessionItem[];
  recentAttendance: DashboardSessionItem[];
  weeklyBreakdown: WeeklyBreakdownItem[];
  attentionUsers: DashboardAttentionUser[];
  roomOccupancy: RoomOccupancyItem[];
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

export interface AcademySnapshot {
  rooms: RoomAttributes[];
  instructors: InstructorAttributes[];
  templates: CourseTemplateAttributes[];
}
