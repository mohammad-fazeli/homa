import { contextBridge, ipcRenderer, IpcRendererEvent } from "electron";
import type {
  SessionUpdateInput,
  UserCreateInput,
  UserUpdateInput,
} from "./db/types";

const RFID_CHANNELS = new Set([
  "rfid-card-present",
  "rfid-card-removed",
  "rfid:status",
]);

const listenerMap = new WeakMap<
  (...args: any[]) => void,
  (event: IpcRendererEvent, ...args: any[]) => void
>();

contextBridge.exposeInMainWorld("electronAPI", {
  minimize: () => ipcRenderer.send("window:minimize"),
  maximize: () => ipcRenderer.send("window:maximize"),
  close: () => ipcRenderer.send("window:close"),
  getUsers: (page: number = 1, limit: number = 10, search: string = "") =>
    ipcRenderer.invoke("get-users", page, limit, search),
  getUser: (userId: number) => ipcRenderer.invoke("get-user", userId),
  addUser: (
    user: UserCreateInput,
    course?: { cost: number; sessions: number },
    sessions?: string[]
  ) => ipcRenderer.invoke("add-user", user, course, sessions),
  updateUser: (
    user: UserUpdateInput,
    course?: { cost: number; sessions: number; id: number },
    sessions?: SessionUpdateInput[]
  ) => ipcRenderer.invoke("update-user", user, course, sessions),
  deleteUser: (userId: number) => ipcRenderer.invoke("delete-user", userId),
  useSession: (uidCart: string) => ipcRenderer.invoke("use-session", uidCart),
  checkDevice: () => ipcRenderer.invoke("check-device"),
  getCalender: (start: string | Date, end: string | Date) =>
    ipcRenderer.invoke("get-calender", start, end),
  billingGetSummary: () => ipcRenderer.invoke("billing:getSummary"),
  billingGetRevenueByMonth: () =>
    ipcRenderer.invoke("billing:getRevenueByMonth"),
  billingGetSessionStats: () => ipcRenderer.invoke("billing:getSessionStats"),
  billingGetRecentLogs: () => ipcRenderer.invoke("billing:getRecentLogs"),
  dashboardGetStats: () => ipcRenderer.invoke("dashboard:getStats"),
  ipcRenderer: {
    on: (channel: string, listener: (...args: any[]) => void) => {
      if (!RFID_CHANNELS.has(channel)) return;
      const wrapped = (_event: IpcRendererEvent, ...args: any[]) =>
        listener(...args);
      listenerMap.set(listener, wrapped);
      ipcRenderer.on(channel, wrapped);
    },
    removeListener: (channel: string, listener: (...args: any[]) => void) => {
      if (!RFID_CHANNELS.has(channel)) return;
      const wrapped = listenerMap.get(listener);
      if (wrapped) {
        ipcRenderer.removeListener(channel, wrapped);
        listenerMap.delete(listener);
      }
    },
  },
});
