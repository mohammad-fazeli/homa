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
  saveCourse: (
    userId: number,
    course: { cost: number; sessions: number; id?: number },
    sessions?: SessionUpdateInput[]
  ) => ipcRenderer.invoke("save-course", userId, course, sessions),
  deleteCourse: (courseId: number) =>
    ipcRenderer.invoke("delete-course", courseId),
  deleteUser: (userId: number) => ipcRenderer.invoke("delete-user", userId),
  addSession: (userId: number, dateIso: string) =>
    ipcRenderer.invoke("add-session", userId, dateIso),
  removeLastSession: (userId: number) =>
    ipcRenderer.invoke("remove-last-session", userId),
  useSession: (
    uidCart: string,
    options?: { force?: boolean; sessionId?: number }
  ) => ipcRenderer.invoke("use-session", uidCart, options),
  checkDevice: () => ipcRenderer.invoke("check-device"),
  rfidListPorts: () => ipcRenderer.invoke("rfid:listPorts"),
  rfidGetPort: () => ipcRenderer.invoke("rfid:getPort"),
  rfidSetPort: (portPath: string) =>
    ipcRenderer.invoke("rfid:setPort", portPath),
  dbBackup: () => ipcRenderer.invoke("db:backup"),
  dbRestore: () => ipcRenderer.invoke("db:restore"),
  getCalendar: (start: string | Date, end: string | Date) =>
    ipcRenderer.invoke("get-calendar", start, end),
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
