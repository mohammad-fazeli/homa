import { useEffect, useState } from "react";

type RfidStatus = "online" | "offline";

function isRfidStatus(value: unknown): value is RfidStatus {
  return value === "online" || value === "offline";
}

let current: RfidStatus = "offline";
const listeners = new Set<(status: RfidStatus) => void>();
let refCount = 0;
let intervalId: number | undefined;
let ipcHandler: ((status: unknown) => void) | undefined;

function emit(status: RfidStatus) {
  current = status;
  listeners.forEach((listener) => listener(status));
}

function apply(value: unknown) {
  if (isRfidStatus(value)) emit(value);
}

function startBridge() {
  if (refCount++ > 0) return;

  ipcHandler = (status: unknown) => apply(status);
  window.electronAPI?.ipcRenderer.on("rfid:status", ipcHandler);

  const poll = () => {
    window.electronAPI?.checkDevice().then(apply, () => apply("offline"));
  };
  poll();
  intervalId = window.setInterval(poll, 2500);
}

function stopBridge() {
  if (--refCount > 0) return;
  if (intervalId !== undefined) {
    window.clearInterval(intervalId);
    intervalId = undefined;
  }
  if (ipcHandler) {
    window.electronAPI?.ipcRenderer.removeListener("rfid:status", ipcHandler);
    ipcHandler = undefined;
  }
}

export function useRfidStatus() {
  const [ping, setPing] = useState<RfidStatus>(current);

  useEffect(() => {
    const listener = (status: RfidStatus) => setPing(status);
    listeners.add(listener);
    setPing(current);
    startBridge();
    return () => {
      listeners.delete(listener);
      stopBridge();
    };
  }, []);

  return ping;
}
