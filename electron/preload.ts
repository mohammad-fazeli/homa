import { contextBridge, ipcRenderer } from "electron";
import { UserAttributes } from "./model";

contextBridge.exposeInMainWorld("electronAPI", {
  send: (channel: string, data: any) => ipcRenderer.send(channel, data),
  receive: (channel: string, func: (...args: any[]) => void) =>
    ipcRenderer.on(channel, (_, ...args) => func(...args)),
  getUsers: () => ipcRenderer.invoke("get-users"),
  addUser: (user: Omit<UserAttributes, "id">) =>
    ipcRenderer.invoke("add-user", user),
  updateUser: (user: UserAttributes) =>
    ipcRenderer.invoke("update-user", user),
  deleteUser: (id: number) =>
    ipcRenderer.invoke("delete-user", id),
});
