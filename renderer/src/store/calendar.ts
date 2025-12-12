import { create } from "zustand";
import { SessionResult } from "../global";

interface CalendarStore {
  allEvents: SessionResult[];
  userEvents: SessionResult[];
  isLoading: boolean;

  loadEvents: (start: string, end: string) => Promise<void>;
}

export const useCalendarStore = create<CalendarStore>((set, get) => ({
  allEvents: [],
  userEvents: [],
  isLoading: false,

  loadEvents: async (start: string, end: string) => {
    set({ isLoading: true });
    try {
      const data = await window.electronAPI?.getCalender(start, end);
      console.log("🚀 ~ data:", data);
      set({
        isLoading: false,
        allEvents: data,
      });
    } catch (e) {
      console.log("🚀 ~ e:", e);
      set({ isLoading: false });
    }
  },
}));
