import { contextBridge, ipcRenderer } from "electron";
import { UserAttributes } from "./model/UserModel";

contextBridge.exposeInMainWorld("electronAPI", {
  send: (channel: string, data: any) => ipcRenderer.send(channel, data),
  receive: (channel: string, func: (...args: any[]) => void) =>
    ipcRenderer.on(channel, (_, ...args) => func(...args)),
  getUsers: () => ipcRenderer.invoke("get-users"),
  getUser: (userId: number) => ipcRenderer.invoke("get-user", userId),
  addUser: (user: Omit<UserAttributes, "id">) =>
    ipcRenderer.invoke("add-user", user),
  updateUser: (user: UserAttributes) => ipcRenderer.invoke("update-user", user),
  deleteUser: (id: number) => ipcRenderer.invoke("delete-user", id),
  decreaseUserSessions: (userId: number, change: number) =>
    ipcRenderer.invoke("decrease-user-sessions", userId, change),
});
