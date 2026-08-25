import { create } from "zustand";
import {
  SessionUpdateInput,
  UserCreateInput,
  UserFindAllItem,
  UserFindByIdResult,
  UserUpdateInput,
} from "../global";

interface UsersStore {
  users: UserFindAllItem[];
  user: UserFindByIdResult | null;
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  query: string;
  isLoading: boolean;
  editingUser: boolean;
  deleteUserId: number | null;
  viewUserId: number | null;
  pickSessionUserId: number | null;
  capturingUid: boolean;
  setPage: (p: number) => void;
  setQuery: (q: string) => void;
  setUser: (v: UserFindByIdResult | null) => void;
  clearUser: () => void;
  setEditingUser: (u: boolean) => void;
  setDeleteUserId: (id: number | null) => void;
  setViewUserId: (id: number | null) => void;
  setPickSessionUserId: (id: number | null) => void;
  setCapturingUid: (v: boolean) => void;
  loadUsers: () => Promise<void>;
  getUser: (id: number) => Promise<void>;
  addUser: (
    user: UserCreateInput,
    course?: { cost: number; sessions: number },
    sessions?: string[]
  ) => Promise<void>;
  updateUser: (
    user: UserUpdateInput,
    course?: { cost: number; sessions: number; id: number },
    sessions?: SessionUpdateInput[]
  ) => Promise<void>;
  saveCourse: (
    userId: number,
    course: { cost: number; sessions: number; id?: number },
    sessions?: SessionUpdateInput[]
  ) => Promise<void>;
  deleteCourse: (courseId: number) => Promise<void>;
  deleteUser: (id: number) => Promise<void>;
  addSession: (userId: number, dateIso: string) => Promise<void>;
  removeLastSession: (userId: number) => Promise<void>;
}

export const useUsersStore = create<UsersStore>((set, get) => ({
  users: [],
  user: null,
  total: 0,
  query: "",
  limit: 10,
  page: 1,
  totalPages: 1,
  isLoading: false,
  editingUser: false,
  deleteUserId: null,
  viewUserId: null,
  pickSessionUserId: null,
  capturingUid: false,
  setPage: (p) => set({ page: p }),
  setQuery: (q) => set({ query: q, page: 1 }),
  setUser: (u) => set({ user: u }),
  clearUser: () => set({ user: null }),
  setEditingUser: (u) => set({ editingUser: u }),
  setDeleteUserId: (id) => set({ deleteUserId: id }),
  setViewUserId: (id) => set({ viewUserId: id }),
  setPickSessionUserId: (id) => set({ pickSessionUserId: id }),
  setCapturingUid: (v) => set({ capturingUid: v }),

  loadUsers: async () => {
    set({ isLoading: true });
    try {
      const data = await window.electronAPI?.getUsers(
        get().page,
        get().limit,
        get().query
      );
      set({
        users: data?.data ?? [],
        total: data?.total ?? 0,
        page: data?.page ?? 1,
        limit: data?.limit ?? get().limit,
        totalPages: data?.totalPages ?? 1,
        isLoading: false,
      });
    } catch {
      set({ isLoading: false });
    }
  },

  addUser: async (user, course, sessions) => {
    await window.electronAPI?.addUser(user, course, sessions);
    await get().loadUsers();
  },

  getUser: async (userId) => {
    const result = await window.electronAPI?.getUser(userId);
    if (!result) return;
    set({ user: result });
  },

  updateUser: async (user, course, sessions) => {
    await window.electronAPI?.updateUser?.(user, course, sessions);
    await get().loadUsers();
  },

  saveCourse: async (userId, course, sessions) => {
    const result = await window.electronAPI?.saveCourse(
      userId,
      course,
      sessions
    );
    if (result) set({ user: result });
    await get().loadUsers();
  },

  deleteCourse: async (courseId) => {
    await window.electronAPI?.deleteCourse(courseId);
    const user = get().user;
    if (user) await get().getUser(user.id);
    await get().loadUsers();
  },

  deleteUser: async (id) => {
    await window.electronAPI?.deleteUser?.(id);
    await get().loadUsers();
    set({ deleteUserId: null });
  },

  addSession: async (userId, dateIso) => {
    await window.electronAPI?.addSession(userId, dateIso);
    await get().loadUsers();
  },

  removeLastSession: async (userId) => {
    await window.electronAPI?.removeLastSession(userId);
    await get().loadUsers();
  },
}));
