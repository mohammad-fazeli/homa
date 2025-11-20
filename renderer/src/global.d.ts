export type RendererElectronAPI = {
  getApiBaseUrl: () => Promise<string | null>;
  openExternal: (url: string) => Promise<void>;
  getUsers: () => Promise<[]>;
  addUser: (user: {
    firstName: string;
    lastName: string;
    phone: string;
    nationalId: string;
    sessions: number;
  }) => Promise<[]>;
};

declare global {
  interface Window {
    electronAPI?: RendererElectronAPI;
  }
}

export {};
