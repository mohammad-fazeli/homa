import { create } from "zustand";

interface CalendarStore {
  allEvents: {
    id: number;
    date: string;
    used: boolean;
    usedAt: string | null;
    userId: number;
  }[];
  userEvents: {
    id: number;
    date: string;
    used: boolean;
    usedAt: string | null;
    userId: number;
  }[];
  isLoading: boolean;

  loadEvents: () => Promise<void>;
}

export const calendarStore = create<CalendarStore>((set, get) => ({
  allEvents: [],
  userEvents: [],
  isLoading: false,

  loadEvents: async () => {
    // set({ isLoading: true });
  },
}));
