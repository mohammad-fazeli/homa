import { create } from "zustand";
import { SessionResult } from "../global";
import { useUsersStore } from "./users";

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

      const user = useUsersStore.getState().user;
      const userSessions = user?.course?.sessions?.map((s) => s.date) ?? [];

      const filteredEvents =
        data?.filter((event) => !userSessions.includes(event.date)) ?? [];
      set({
        isLoading: false,
        allEvents: filteredEvents,
      });
    } catch (e) {
      set({ isLoading: false });
    }
  },
}));
