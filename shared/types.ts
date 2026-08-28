export type SessionStatus =
  | "scheduled"
  | "present"
  | "absent"
  | "cancelled"
  | "makeup";

export type PaymentMethod = "cash" | "card" | "transfer" | "check" | "online";

export type PaymentKind = "payment" | "refund" | "discount";

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
  groupId?: number | null;
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
  groupId?: number | null;
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
  photoUrl?: string | null;
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
  groupId: number | null;
  groupName: string | null;
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
  credit: number;
  contracted: number;
  paidAmount: number;
  photoUrl?: string | null;
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
  photoUrl?: string | null;
}

export interface RfidPortInfo {
  path: string;
  manufacturer?: string;
}

export type ReminderKind = "session_tomorrow" | "low_credit" | "debt";

export type ReminderChannel = "whatsapp" | "sms" | "copy";

export interface AppSettings {
  rfidPort?: string;
  attendanceToleranceMinutes?: number;
  lockEnabled?: boolean;
  lockPinHash?: string;
  academyName?: string;
  reminderTemplates?: Partial<Record<ReminderKind, string>>;
  autoBackupEnabled?: boolean;
  autoBackupFolder?: string;
  autoBackupKeep?: number;
  lastAutoBackupAt?: string;
  lastAutoBackupPath?: string;
  autoBackupError?: string;
}

export type AutoBackupStatus = {
  enabled: boolean;
  folder: string;
  folderMissing: boolean;
  keep: number;
  lastAt: string;
  lastPath: string;
  lastError: string;
};

export type AutoBackupRunResult = {
  ok: boolean;
  skipped?: boolean;
  cancelled?: boolean;
  path?: string;
  error?: string;
};

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
  photoUrl?: string | null;
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
  kind: PaymentKind;
  note: string | null;
  reference: string | null;
  paidAt: string;
  userFullName?: string;
  userPhone?: string;
  courseTitle?: string | null;
}

export type PaymentCreateInput = {
  userId: number;
  courseId?: number | null;
  amount: number;
  method: PaymentMethod;
  kind?: PaymentKind;
  note?: string | null;
  reference?: string | null;
  paidAt?: string;
};

export type PaymentUpdateInput = {
  id: number;
  courseId?: number | null;
  amount?: number;
  method?: PaymentMethod;
  kind?: PaymentKind;
  note?: string | null;
  reference?: string | null;
  paidAt?: string;
};

export type PaymentListFilter = {
  userId?: number;
  courseId?: number;
  method?: PaymentMethod | "all";
  kind?: PaymentKind | "all";
  search?: string;
  from?: string;
  to?: string;
  limit?: number;
  offset?: number;
};

export interface PaymentListResult {
  data: PaymentAttributes[];
  total: number;
  collected: number;
  refunded: number;
  discounted: number;
  net: number;
}

export interface MethodBreakdownItem {
  method: PaymentMethod;
  count: number;
  amount: number;
}

export interface DebtorCourseItem {
  id: number;
  title: string;
  cost: number;
  paidAmount: number;
  debt: number;
  createdAt: string | null;
}

export interface DebtorRow {
  userId: number;
  firstName: string;
  lastName: string;
  phone: string;
  contracted: number;
  applied: number;
  collected: number;
  discounted: number;
  refunded: number;
  debt: number;
  credit: number;
  lastPaidAt: string | null;
  oldestUnpaidAt: string | null;
  courses: DebtorCourseItem[];
}

export type DebtAgingBucket = "d0" | "d30" | "d60" | "d90";

export interface DebtAgingItem {
  bucket: DebtAgingBucket;
  label: string;
  count: number;
  amount: number;
}

export interface CashReportDay {
  date: string;
  collected: number;
  refunded: number;
  discounted: number;
  net: number;
  count: number;
}

export interface CashReport {
  from: string;
  to: string;
  collected: number;
  refunded: number;
  discounted: number;
  net: number;
  count: number;
  byMethod: MethodBreakdownItem[];
  byDay: CashReportDay[];
  payments: PaymentAttributes[];
}

export interface BillingSummary {
  totalUsers: number;
  totalCourses: number;
  totalRevenue: number;
  totalCollected: number;
  totalRefunded: number;
  totalDiscounted: number;
  netCash: number;
  totalOutstanding: number;
  totalCredit: number;
  avgCoursePrice: number;
  debtorCount: number;
  creditorCount: number;
  collectionRate: number;
  settlementRate: number;
  todayCollected: number;
  todayRefunded: number;
  todayNet: number;
  weekCollected: number;
  monthCollected: number;
  monthRefunded: number;
  monthNet: number;
}

export interface BillingOverview {
  summary: BillingSummary;
  byMethod: MethodBreakdownItem[];
  revenueByMonth: RevenueByMonthItem[];
  sessionStats: SessionStats;
  aging: DebtAgingItem[];
  topDebtors: DebtorRow[];
  recentPayments: PaymentAttributes[];
  logs: BillingLogItem[];
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
  photoUrl?: string | null;
}

export interface DashboardAttentionUser {
  id: number;
  firstName: string;
  lastName: string;
  remainingSessions: number;
  totalSessions: number;
  expired?: boolean;
  photoUrl?: string | null;
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

export interface AcademyHoliday {
  id: number;
  dayKey: string;
  title: string;
  createdAt?: string;
  updatedAt?: string;
}

export type AcademyHolidayWriteInput = {
  id?: number;
  dayKey: string;
  title?: string | null;
};

export interface AcademySnapshot {
  rooms: RoomAttributes[];
  instructors: InstructorAttributes[];
  templates: CourseTemplateAttributes[];
  groups: ClassGroupDetail[];
  holidays: AcademyHoliday[];
  closedWeekdays: number[];
}

export interface ClassGroupAttributes {
  id: number;
  name: string;
  roomId: number | null;
  instructorId: number | null;
  templateId: number | null;
  color: string;
  notes: string | null;
  weekdays: number[];
  hour: number | null;
  sessions: number;
  cost: number;
}

export type ClassGroupWriteInput = {
  id?: number;
  name: string;
  roomId?: number | null;
  instructorId?: number | null;
  templateId?: number | null;
  color?: string;
  notes?: string | null;
  weekdays?: number[];
  hour?: number | null;
  sessions?: number;
  cost?: number;
};

export interface ClassGroupMemberItem {
  id: number;
  groupId: number;
  userId: number;
  courseId: number | null;
  firstName: string;
  lastName: string;
  phone: string;
  totalSessions: number;
  remainingSessions: number;
}

export interface ClassGroupDetail extends ClassGroupAttributes {
  roomName: string | null;
  roomColor: string | null;
  roomCapacity: number | null;
  instructorName: string | null;
  templateName: string | null;
  memberCount: number;
  members: ClassGroupMemberItem[];
}

export type ClassGroupGenerateInput = {
  groupId: number;
  startDate?: string;
  weekdays?: number[];
  hour?: number;
  count?: number;
};

export type ClassGroupGenerateResult = {
  created: number;
  skipped: number;
  group: ClassGroupDetail;
};

export interface ReminderItem {
  key: string;
  kind: ReminderKind;
  userId: number;
  sessionId: number | null;
  firstName: string;
  lastName: string;
  phone: string;
  message: string;
  whatsappUrl: string | null;
  smsUrl: string | null;
  sentAt: string | null;
  sentChannel: ReminderChannel | null;
  subtitle: string;
}

export interface ReminderCounts {
  session_tomorrow: number;
  low_credit: number;
  debt: number;
}

export interface ReminderSnapshot {
  academyName: string;
  templates: Record<ReminderKind, string>;
  counts: ReminderCounts;
  pendingCounts: ReminderCounts;
  items: ReminderItem[];
}

export type ReminderMarkSentInput = {
  kind: ReminderKind;
  userId: number;
  channel: ReminderChannel;
  sessionId?: number | null;
  message: string;
};

export type {
  CustomerImportCommitResult,
  CustomerImportPreview,
} from "./import-customers";

export type { PhotoKind } from "./photos";
