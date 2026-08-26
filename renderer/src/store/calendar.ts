import { create } from "zustand";
import { SessionResult } from "../global";

interface CalendarStore {
  allEvents: SessionResult[];
  isLoading: boolean;
  lastStart: string | null;
  lastEnd: string | null;
  loadEvents: (start: string, end: string) => Promise<void>;
  refresh: () => Promise<void>;
}

export const useCalendarStore = create<CalendarStore>((set, get) => ({
  allEvents: [],
  isLoading: false,
  lastStart: null,
  lastEnd: null,

  loadEvents: async (start: string, end: string) => {
    set({ isLoading: true, lastStart: start, lastEnd: end });
    try {
      const data = await window.electronAPI?.getCalendar(start, end);
      set({ isLoading: false, allEvents: data ?? [] });
    } catch {
      set({ isLoading: false });
    }
  },

  refresh: async () => {
    const { lastStart, lastEnd, loadEvents } = get();
    if (lastStart && lastEnd) await loadEvents(lastStart, lastEnd);
  },
}));
