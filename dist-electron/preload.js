"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
electron_1.contextBridge.exposeInMainWorld("electronAPI", {
    send: (channel, data) => electron_1.ipcRenderer.send(channel, data),
    receive: (channel, func) => electron_1.ipcRenderer.on(channel, (_, ...args) => func(...args)),
    getUsers: () => electron_1.ipcRenderer.invoke("get-users"),
    addUser: (user) => electron_1.ipcRenderer.invoke("add-user", user),
});
