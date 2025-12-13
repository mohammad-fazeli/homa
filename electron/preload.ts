import { contextBridge, ipcRenderer } from "electron";
import {
  SessionUpdateInput,
  UserCreateInput,
  UserUpdateInput,
} from "./db/types";

contextBridge.exposeInMainWorld("electronAPI", {
  send: (channel: string, data: any) => ipcRenderer.send(channel, data),
  receive: (channel: string, func: (...args: any[]) => void) =>
    ipcRenderer.on(channel, (_, ...args) => func(...args)),

  minimize: () => ipcRenderer.send("window:minimize"),
  maximize: () => ipcRenderer.send("window:maximize"),
  close: () => ipcRenderer.send("window:close"),
  //user
  getUsers: (page: number = 1, limit: number = 10) =>
    ipcRenderer.invoke("get-users", page, limit),
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
  //calender
  getCalender: (start: string | Date, end: string | Date) =>
    ipcRenderer.invoke("get-calender", start, end),
});
