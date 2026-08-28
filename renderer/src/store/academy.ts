import { create } from "zustand";
import type {
  AcademySnapshot,
  CourseTemplateAttributes,
  InstructorAttributes,
  RoomAttributes,
  ClassGroupDetail,
  AcademyHoliday,
} from "../global";

const empty: AcademySnapshot = {
  rooms: [],
  instructors: [],
  templates: [],
  groups: [],
  holidays: [],
  closedWeekdays: [],
};

interface AcademyStore extends AcademySnapshot {
  loading: boolean;
  load: () => Promise<void>;
}

export const useAcademyStore = create<AcademyStore>((set) => ({
  ...empty,
  loading: false,
  load: async () => {
    set({ loading: true });
    try {
      const snapshot = await window.electronAPI?.academySnapshot();
      set({ ...empty, ...(snapshot ?? {}), loading: false });
    } catch {
      set({ loading: false });
    }
  },
}));

export type {
  RoomAttributes,
  InstructorAttributes,
  CourseTemplateAttributes,
  ClassGroupDetail,
  AcademyHoliday,
};
