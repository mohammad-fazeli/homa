import { create } from "zustand";
import { SessionResult } from "../global";
import { useUsersStore } from "./users";

interface CalendarStore {
  allEvents: SessionResult[];
  isLoading: boolean;
  loadEvents: (start: string, end: string) => Promise<void>;
}

export const useCalendarStore = create<CalendarStore>((set) => ({
  allEvents: [],
  isLoading: false,

  loadEvents: async (start: string, end: string) => {
    set({ isLoading: true });
    try {
      const data = await window.electronAPI?.getCalender(start, end);
      const user = useUsersStore.getState().user;
      const currentUserId = user?.id;

      const filteredEvents =
        data?.filter((event) => event.userId !== currentUserId) ?? [];

      set({
        isLoading: false,
        allEvents: filteredEvents,
      });
    } catch {
      set({ isLoading: false });
    }
  },
}));
