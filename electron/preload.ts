import { contextBridge, ipcRenderer } from "electron";
import { User } from "./model/UserModel";

contextBridge.exposeInMainWorld("electronAPI", {
  send: (channel: string, data: any) => ipcRenderer.send(channel, data),
  receive: (channel: string, func: (...args: any[]) => void) =>
    ipcRenderer.on(channel, (_, ...args) => func(...args)),

  minimize: () => ipcRenderer.send("window:minimize"),
  maximize: () => ipcRenderer.send("window:maximize"),
  close: () => ipcRenderer.send("window:close"),

  getUsers: () => ipcRenderer.invoke("get-users"),
  getUser: (userId: number) => ipcRenderer.invoke("get-user", userId),
  addUser: (user: Omit<User, "id">) => ipcRenderer.invoke("add-user", user),
  updateUser: (user: User) => ipcRenderer.invoke("update-user", user),
  deleteUser: (id: number) => ipcRenderer.invoke("delete-user", id),
  decreaseUserSessions: (userId: number, change: number) =>
    ipcRenderer.invoke("decrease-user-sessions", userId, change),
});
