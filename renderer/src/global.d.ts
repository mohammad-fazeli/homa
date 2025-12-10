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
  used: boolean;
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

export type RendererElectronAPI = {
  minimize: () => void;
  maximize: () => void;
  close: () => void;
  addUser: (
    user: UserCreateInput,
    course?: { cost: number; sessions: number },
    sessions?: Date[]
  ) => Promise<UserFindAllResult>;
  getUser: (userid: number) => Promise<UserFindByIdResult>;
  getUsers: (page: number, limit: number) => Promise<UserFindAllResult>;
  updateUser: (user: UserUpdateInput) => Promise<UserFindByIdResult>;
  deleteUser: (id: number) => Promise<number>;
};

declare global {
  interface Window {
    electronAPI?: RendererElectronAPI;
  }
}
