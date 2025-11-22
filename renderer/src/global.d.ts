export type UserType = {
  id: number;
  firstName: string;
  lastName: string;
  phone: string;
  nationalId: string;
  sessions: number;
};

export type SessionLogType = {
  id: number;
  userId: number;
  change: number;
  previousValue: number;
  newValue: number;
  description?: string;
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
  getApiBaseUrl: () => Promise<string | null>;
  openExternal: (url: string) => Promise<void>;
  getUsers: () => Promise<UserType[]>;
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
