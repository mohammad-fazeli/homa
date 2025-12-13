// =====================
//   USER TYPES
// =====================

export interface UserAttributes {
  id: number;
  firstName: string;
  lastName: string;
  phone: string;
  nationalId: string;
}

export interface UserCreateInput extends Omit<UserAttributes, "id"> {}

export interface UserUpdateInput extends UserAttributes {}

// =====================
//   COURSE TYPES
// =====================

export interface CourseCreateInput
  extends Omit<CourseAttributes, "id" | "createdAt"> {}

export interface CourseAttributes {
  id: number;
  userId: number;
  cost: number;
  sessions: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface CourseCreateInput
  extends Omit<CourseAttributes, "id" | "createdAt" | "updatedAt"> {}

export type CourseResult = CourseAttributes;

export interface CourseUpdateInput extends CourseAttributes {}

// =====================
//   SESSION TYPES
// =====================

export interface SessionAttributes {
  id: number;
  courseId: number;
  date: string | Date;
  used: 0 | 1;
  usedAt: string | Date | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface SessionCreateInput
  extends Omit<SessionAttributes, "id" | "createdAt" | "updatedAt"> {}

export interface SessionUpdateInput extends SessionAttributes {}

export type SessionResult = SessionAttributes & {
  userId: number;
  title: string;
  start: Date;
};

export interface SessionCreateInput extends Omit<SessionAttributes, "id"> {}

// =====================
//   NESTED OUTPUT TYPES
// =====================

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

// -----------------------

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
  course: {
    id: number;
    cost: number;
    totalSessions: number;
    sessions: UserCourseSessionItem[];
  } | null;
}
