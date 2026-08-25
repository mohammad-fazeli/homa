import { useEffect, useState } from "react";

export function useRfidStatus() {
  const [ping, setPing] = useState<"online" | "offline">("offline");

  useEffect(() => {
    const handler = (status: "online" | "offline") => {
      setPing(status);
    };

    window.electronAPI?.checkDevice().then((status) => {
      if (status) setPing(status);
    });

    window.electronAPI?.ipcRenderer.on("rfid:status", handler);

    return () => {
      window.electronAPI?.ipcRenderer.removeListener("rfid:status", handler);
    };
  }, []);

  return ping;
}
