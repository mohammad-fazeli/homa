import { contextBridge, ipcRenderer, IpcRendererEvent } from "electron";
import type {
  SessionUpdateInput,
  UserCreateInput,
  UserListFilter,
  UserUpdateInput,
  AppSettings,
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
  getUsers: (
    page: number = 1,
    limit: number = 10,
    search: string = "",
    filter: UserListFilter = "all"
  ) => ipcRenderer.invoke("get-users", page, limit, search, filter),
  getUserFilterCounts: () => ipcRenderer.invoke("get-user-filter-counts"),
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
  markSession: (sessionId: number) =>
    ipcRenderer.invoke("mark-session", sessionId),
  unmarkSession: (sessionId: number) =>
    ipcRenderer.invoke("unmark-session", sessionId),
  checkDevice: () => ipcRenderer.invoke("check-device"),
  rfidListPorts: () => ipcRenderer.invoke("rfid:listPorts"),
  rfidGetPort: () => ipcRenderer.invoke("rfid:getPort"),
  rfidSetPort: (portPath: string) =>
    ipcRenderer.invoke("rfid:setPort", portPath),
  dbBackup: () => ipcRenderer.invoke("db:backup"),
  dbRestore: () => ipcRenderer.invoke("db:restore"),
  dbAutoBackupStatus: () => ipcRenderer.invoke("db:autoBackupStatus"),
  dbChooseBackupFolder: () => ipcRenderer.invoke("db:chooseBackupFolder"),
  dbRunAutoBackup: () => ipcRenderer.invoke("db:runAutoBackup"),
  getCalendar: (start: string | Date, end: string | Date) =>
    ipcRenderer.invoke("get-calendar", start, end),
  getCalender: (start: string | Date, end: string | Date) =>
    ipcRenderer.invoke("get-calender", start, end),
  billingGetSummary: () => ipcRenderer.invoke("billing:getSummary"),
  billingGetRevenueByMonth: () =>
    ipcRenderer.invoke("billing:getRevenueByMonth"),
  billingGetSessionStats: () => ipcRenderer.invoke("billing:getSessionStats"),
  billingGetRecentLogs: (limit?: number) =>
    ipcRenderer.invoke("billing:getRecentLogs", limit),
  dashboardGetStats: () => ipcRenderer.invoke("dashboard:getStats"),
  dashboardGetOverview: () => ipcRenderer.invoke("dashboard:getOverview"),
  settingsGet: () => ipcRenderer.invoke("settings:get"),
  settingsSet: (partial: AppSettings) =>
    ipcRenderer.invoke("settings:set", partial),
  settingsSetPin: (pin: string) => ipcRenderer.invoke("settings:setPin", pin),
  settingsClearPin: () => ipcRenderer.invoke("settings:clearPin"),
  settingsVerifyPin: (pin: string) =>
    ipcRenderer.invoke("settings:verifyPin", pin),
  academySnapshot: () => ipcRenderer.invoke("academy:snapshot"),
  academySaveRoom: (data: any) => ipcRenderer.invoke("academy:saveRoom", data),
  academyDeleteRoom: (id: number) => ipcRenderer.invoke("academy:deleteRoom", id),
  academySaveInstructor: (data: any) =>
    ipcRenderer.invoke("academy:saveInstructor", data),
  academyDeleteInstructor: (id: number) =>
    ipcRenderer.invoke("academy:deleteInstructor", id),
  academySaveTemplate: (data: any) =>
    ipcRenderer.invoke("academy:saveTemplate", data),
  academyDeleteTemplate: (id: number) =>
    ipcRenderer.invoke("academy:deleteTemplate", id),
  academySaveGroup: (data: any) => ipcRenderer.invoke("academy:saveGroup", data),
  academyDeleteGroup: (id: number) =>
    ipcRenderer.invoke("academy:deleteGroup", id),
  academyAddGroupMember: (groupId: number, userId: number, paidNow?: boolean) =>
    ipcRenderer.invoke("academy:addGroupMember", groupId, userId, paidNow),
  academyRemoveGroupMember: (groupId: number, userId: number) =>
    ipcRenderer.invoke("academy:removeGroupMember", groupId, userId),
  academyGenerateGroupSessions: (input: unknown) =>
    ipcRenderer.invoke("academy:generateGroupSessions", input),
  academySaveHoliday: (data: { id?: number; dayKey: string; title?: string | null }) =>
    ipcRenderer.invoke("academy:saveHoliday", data),
  academyDeleteHoliday: (id: number) =>
    ipcRenderer.invoke("academy:deleteHoliday", id),
  academySetClosedWeekdays: (days: number[]) =>
    ipcRenderer.invoke("academy:setClosedWeekdays", days),
  remindersSnapshot: () => ipcRenderer.invoke("reminders:snapshot"),
  remindersCounts: () => ipcRenderer.invoke("reminders:counts"),
  remindersMarkSent: (input: unknown) =>
    ipcRenderer.invoke("reminders:markSent", input),
  remindersOpen: (payload: {
    channel: "whatsapp" | "sms";
    phone: string;
    message: string;
  }) => ipcRenderer.invoke("reminders:open", payload),
  importCustomersPreview: () => ipcRenderer.invoke("import:preview"),
  importCustomersCommit: () => ipcRenderer.invoke("import:commit"),
  importCustomersTemplate: () => ipcRenderer.invoke("import:template"),
  photosSave: (kind: "user" | "instructor", id: number, bytes: Uint8Array) =>
    ipcRenderer.invoke("photos:save", kind, id, bytes),
  photosRemove: (kind: "user" | "instructor", id: number) =>
    ipcRenderer.invoke("photos:remove", kind, id),
  billingListPayments: (filter?: unknown, userId?: number) =>
    ipcRenderer.invoke("billing:listPayments", filter, userId),
  billingCreatePayment: (data: any) =>
    ipcRenderer.invoke("billing:createPayment", data),
  billingUpdatePayment: (data: any) =>
    ipcRenderer.invoke("billing:updatePayment", data),
  billingDeletePayment: (id: number) =>
    ipcRenderer.invoke("billing:deletePayment", id),
  billingGetOverview: () => ipcRenderer.invoke("billing:getOverview"),
  billingListDebtors: () => ipcRenderer.invoke("billing:listDebtors"),
  billingGetRangeReport: (from: string, to: string) =>
    ipcRenderer.invoke("billing:getRangeReport", from, to),
  setSessionStatus: (sessionId: number, status: string) =>
    ipcRenderer.invoke("set-session-status", sessionId, status),
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
