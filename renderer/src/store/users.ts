import { create } from "zustand";
import {
  SessionUpdateInput,
  UserCreateInput,
  UserFilterCounts,
  UserFindAllItem,
  UserFindByIdResult,
  UserListFilter,
  UserUpdateInput,
  CourseWriteInput,
} from "../global";
import { emitAppDataChange } from "../lib/bus";

interface UsersStore {
  users: UserFindAllItem[];
  user: UserFindByIdResult | null;
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  query: string;
  filter: UserListFilter;
  filterCounts: UserFilterCounts;
  isLoading: boolean;
  editingUser: boolean;
  deleteUserId: number | null;
  viewUserId: number | null;
  pickSessionUserId: number | null;
  capturingUid: boolean;
  setPage: (p: number) => void;
  setQuery: (q: string) => void;
  setFilter: (filter: UserListFilter) => void;
  openUser: (id: number) => void;
  closeUser: () => void;
  setUser: (v: UserFindByIdResult | null) => void;
  clearUser: () => void;
  setEditingUser: (u: boolean) => void;
  setDeleteUserId: (id: number | null) => void;
  setViewUserId: (id: number | null) => void;
  setPickSessionUserId: (id: number | null) => void;
  setCapturingUid: (v: boolean) => void;
  loadUsers: () => Promise<void>;
  loadFilterCounts: () => Promise<void>;
  getUser: (id: number) => Promise<void>;
  addUser: (
    user: UserCreateInput,
    course?: CourseWriteInput,
    sessions?: string[]
  ) => Promise<void>;
  updateUser: (
    user: UserUpdateInput,
    course?: CourseWriteInput & { id: number },
    sessions?: SessionUpdateInput[]
  ) => Promise<void>;
  saveCourse: (
    userId: number,
    course: CourseWriteInput,
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
  filter: "all",
  filterCounts: {
    all: 0,
    no_card: 0,
    low_credit: 0,
    today: 0,
    expired: 0,
    debt: 0,
  },
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
  setFilter: (filter) => set({ filter, page: 1 }),
  openUser: (id) => {
    set({ viewUserId: id, user: null });
    void get().getUser(id);
  },
  closeUser: () => set({ viewUserId: null, user: null }),
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
        get().query,
        get().filter
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
    void get().loadFilterCounts();
  },

  loadFilterCounts: async () => {
    const counts = await window.electronAPI?.getUserFilterCounts();
    if (counts) set({ filterCounts: counts });
  },

  addUser: async (user, course, sessions) => {
    await window.electronAPI?.addUser(user, course, sessions);
    await get().loadUsers();
    emitAppDataChange();
  },

  getUser: async (userId) => {
    const result = await window.electronAPI?.getUser(userId);
    if (!result) return;
    set({ user: result });
  },

  updateUser: async (user, course, sessions) => {
    await window.electronAPI?.updateUser?.(user, course, sessions);
    await get().loadUsers();
    emitAppDataChange();
  },

  saveCourse: async (userId, course, sessions) => {
    const result = await window.electronAPI?.saveCourse(
      userId,
      course,
      sessions
    );
    if (result) set({ user: result });
    await get().loadUsers();
    emitAppDataChange();
  },

  deleteCourse: async (courseId) => {
    await window.electronAPI?.deleteCourse(courseId);
    const user = get().user;
    if (user) await get().getUser(user.id);
    await get().loadUsers();
    emitAppDataChange();
  },

  deleteUser: async (id) => {
    await window.electronAPI?.deleteUser?.(id);
    await get().loadUsers();
    set({ deleteUserId: null });
    emitAppDataChange();
  },

  addSession: async (userId, dateIso) => {
    await window.electronAPI?.addSession(userId, dateIso);
    await get().loadUsers();
    emitAppDataChange();
  },

  removeLastSession: async (userId) => {
    await window.electronAPI?.removeLastSession(userId);
    await get().loadUsers();
    emitAppDataChange();
  },
}));
