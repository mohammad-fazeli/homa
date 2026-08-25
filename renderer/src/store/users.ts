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
  capturingUid: boolean;

  setPage: (p: number) => void;
  setQuery: (q: string) => void;
  setUser: (v: UserFindByIdResult | null) => void;
  clearUser: () => void;

  setEditingUser: (u: boolean) => void;
  setDeleteUserId: (id: number | null) => void;
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
  deleteUser: (id: number) => Promise<void>;
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
  capturingUid: false,

  setPage: (p) => set({ page: p }),
  setQuery: (q) => set({ query: q, page: 1 }),
  setUser: (u) => set({ user: u }),
  clearUser: () => set({ user: null }),
  setEditingUser: (u) => set({ editingUser: u }),
  setDeleteUserId: (id) => set({ deleteUserId: id }),
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

  addUser: async (
    user: UserCreateInput,
    course?: { cost: number; sessions: number },
    sessions?: string[]
  ) => {
    await window.electronAPI?.addUser(user, course, sessions);
    await get().loadUsers();
  },

  getUser: async (userId) => {
    const result = await window.electronAPI?.getUser(userId);
    if (!result) return;
    set({ user: result });
  },

  updateUser: async (
    user: UserUpdateInput,
    course?: { cost: number; sessions: number; id: number },
    sessions?: SessionUpdateInput[]
  ) => {
    await window.electronAPI?.updateUser?.(user, course, sessions);
    await get().loadUsers();
    set({ editingUser: false });
  },

  deleteUser: async (id) => {
    await window.electronAPI?.deleteUser?.(id);
    await get().loadUsers();
    set({ deleteUserId: null });
  },
}));
