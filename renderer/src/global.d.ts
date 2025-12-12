export interface UserAttributes {
  id: number;
  firstName: string;
  lastName: string;
  phone: string;
  nationalId: string;
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

export type SessionResult = SessionAttributes & {
  userId: number;
  title: string;
  start: Date;
};

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
  updateUser: (user: UserUpdateInput) => Promise<UserFindByIdResult>;
  deleteUser: (id: number) => Promise<number>;
  //calender
  getCalender: (start: string, end: string) => Promise<SessionResult[]>;
};

declare global {
  interface Window {
    electronAPI?: RendererElectronAPI;
  }
}
