export type UserType = {
  id: number;
  firstName: string;
  lastName: string;
  phone: string;
  nationalId: string;
  sessions: number;
};

export type RendererElectronAPI = {
  getApiBaseUrl: () => Promise<string | null>;
  openExternal: (url: string) => Promise<void>;
  getUsers: () => Promise<[]>;
  addUser: (user: User) => Promise<User[]>;
  updateUser: (user: UserAttributes) => Promise<User[]>;
  deleteUser: (id: number) => Promise<User[]>;
};

declare global {
  interface Window {
    electronAPI?: RendererElectronAPI;
  }
}

export {};
