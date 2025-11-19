export type RendererElectronAPI = {
  getApiBaseUrl: () => Promise<string | null>;
  openExternal: (url: string) => Promise<void>;
};

declare global {
  interface Window {
    electronAPI?: RendererElectronAPI;
  }
}

export {};

