import { create } from "zustand";
import type {
  AcademySnapshot,
  CourseTemplateAttributes,
  InstructorAttributes,
  RoomAttributes,
} from "../global";

const empty: AcademySnapshot = { rooms: [], instructors: [], templates: [] };

interface AcademyStore extends AcademySnapshot {
  loading: boolean;
  load: () => Promise<void>;
}

export const useAcademyStore = create<AcademyStore>((set) => ({
  ...empty,
  loading: false,
  load: async () => {
    set({ loading: true });
    const snapshot = await window.electronAPI?.academySnapshot();
    set({ ...(snapshot ?? empty), loading: false });
  },
}));

export type { RoomAttributes, InstructorAttributes, CourseTemplateAttributes };
