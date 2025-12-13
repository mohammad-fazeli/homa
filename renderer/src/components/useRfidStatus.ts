import { useEffect, useState } from "react";

export function useRfidStatus() {
  const [ping, setPing] = useState<"online" | "offline">("offline");

  useEffect(() => {
    const handler = (status: "online" | "offline") => {
      setPing(status);
    };

    window.electronAPI?.ipcRenderer.on("rfid:status", (e) => {
      handler(e);
    });

    return () => {
      window.electronAPI?.ipcRenderer.removeListener(
        "rfid:status",
        (e: any) => {
          handler(e);
        }
      );
    };
  }, []);

  return ping;
}
