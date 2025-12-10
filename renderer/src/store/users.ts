import { create } from "zustand";
import {
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

  setPage: (p: number) => void;
  setTotalPages: (p: number) => void;
  setQuery: (q: string) => void;
  setUser: (v: UserFindByIdResult | null) => void;

  setEditingUser: (u: boolean) => void;
  setDeleteUserId: (id: number | null) => void;

  loadUsers: () => Promise<void>;
  getUser: (id: number) => Promise<void>;
  addUser: (
    user: UserCreateInput,
    course?: { cost: number; sessions: number },
    sessions?: string[]
  ) => Promise<void>;
  updateUser: (payload: UserUpdateInput) => Promise<void>;
  deleteUser: (id: number) => Promise<void>;
  changeSessions: (id: number, delta: number) => Promise<void>;
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

  sessionLog: null,
  editingUser: false,
  deleteUserId: null,

  setPage: (p) => set({ page: p }),
  setTotalPages: (p) => set({ totalPages: p }),
  setQuery: (q) => set({ query: q }),
  setUser: (u) => set({ user: u }),
  setEditingUser: (u) => set({ editingUser: u }),
  setDeleteUserId: (id) => set({ deleteUserId: id }),

  loadUsers: async () => {
    set({ isLoading: true });
    try {
      const data = await window.electronAPI?.getUsers(get().page, get().limit);
      set({
        users: data?.data ?? [],
        total: data?.total,
        page: data?.page,
        limit: data?.limit,
        totalPages: data?.totalPages,
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
    console.log("🚀 ~ result:", result);
    if (!result) return;
    set({
      user: result,
    });
  },

  updateUser: async (payload) => {
    await window.electronAPI?.updateUser?.(payload);
    await get().loadUsers();
    set({
      editingUser: false,
    });
  },

  deleteUser: async (id) => {
    await window.electronAPI?.deleteUser?.(id);
    await get().loadUsers();
    set({ deleteUserId: null });
  },

  changeSessions: async (id, delta) => {
    const user = get().users.find((u) => u.id === id);
    if (!user) return;

    await get().loadUsers();
  },
}));
