import { create } from "zustand";
import { UserType } from "../global";

interface UsersStore {
  users: UserType[];
  query: string;
  isLoading: boolean;

  showModal: boolean;
  editingUser: UserType | null;
  deleteUserId: number | null;

  setQuery: (q: string) => void;
  setShowModal: (v: boolean) => void;
  setEditingUser: (u: UserType | null) => void;
  setDeleteUserId: (id: number | null) => void;

  loadUsers: () => Promise<void>;
  addUser: (payload: Omit<UserType, "id">) => Promise<void>;
  updateUser: (payload: UserType) => Promise<void>;
  deleteUser: (id: number) => Promise<void>;
  changeSessions: (id: number, delta: number) => Promise<void>;
}

export const useUsersStore = create<UsersStore>((set, get) => ({
  users: [],
  query: "",
  isLoading: false,

  showModal: false,
  editingUser: null,
  deleteUserId: null,

  setQuery: (q) => set({ query: q }),
  setShowModal: (v) => set({ showModal: v }),
  setEditingUser: (u) => set({ editingUser: u }),
  setDeleteUserId: (id) => set({ deleteUserId: id }),

  loadUsers: async () => {
    set({ isLoading: true });
    try {
      const data = await window.electronAPI?.getUsers?.();
      set({ users: data ?? [], isLoading: false });
    } catch {
      set({ isLoading: false });
    }
  },

  addUser: async (payload) => {
    await window.electronAPI?.addUser?.(payload);
    await get().loadUsers();
    set({ showModal: false });
  },

  updateUser: async (payload) => {
    await window.electronAPI?.updateUser?.(payload);
    await get().loadUsers();
    set({
      showModal: false,
      editingUser: null,
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

    const updated = { ...user, sessions: user.sessions + delta };
    await window.electronAPI?.updateUser?.(updated);
    await get().loadUsers();
  },
}));
