export type UserType = {
  id: number;
  firstName: string;
  lastName: string;
  phone: string;
  nationalId: string;
  course?: {
    id: number;
    cost: number;
    totalSessions: number;
    sessions: { id: number; date: string; used: boolean; usedAt: string }[];
    nextSessionDate: string | null;
  };
};

export type SessionLogType = {
  id: number;
  userId: number;
  change: number;
  previousValue: number;
  newValue: number;
  description?: string;
  createdAt: string;
};

export type GetUserType = {
  id: number;
  firstName: string;
  lastName: string;
  phone: string;
  nationalId: string;
  sessions: number;
  logs: SessionLogType[];
};

export type RendererElectronAPI = {
  minimize: () => void;
  maximize: () => void;
  close: () => void;
  getApiBaseUrl: () => Promise<string | null>;
  openExternal: (url: string) => Promise<void>;
  getUsers: (
    page: number,
    limit: number
  ) => Promise<{
    data: UserType[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }>;
  getUser: (userid: number) => Promise<GetUserType>;
  addUser: (user: User) => Promise<UserType[]>;
  updateUser: (user: UserAttributes) => Promise<UserType[]>;
  deleteUser: (id: number) => Promise<UserType[]>;
};

declare global {
  interface Window {
    electronAPI?: RendererElectronAPI;
  }
}

export {};
