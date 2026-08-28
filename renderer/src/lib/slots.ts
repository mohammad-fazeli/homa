import { useEffect, useState } from "react";
import { DEFAULT_SLOT_MINUTES, normalizeSlotMinutes } from "@shared/dates";

export function useCalendarSlotMinutes(): number {
  const [slotMinutes, setSlotMinutes] = useState(DEFAULT_SLOT_MINUTES);

  useEffect(() => {
    void window.electronAPI?.settingsGet().then((settings) => {
      setSlotMinutes(normalizeSlotMinutes(settings?.attendanceToleranceMinutes));
    });
  }, []);

  return slotMinutes;
}
