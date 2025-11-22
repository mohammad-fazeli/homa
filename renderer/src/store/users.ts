import { create } from "zustand";
import { SessionLogType, UserType } from "../global";

interface UsersStore {
  users: UserType[];
  query: string;
  isLoading: boolean;

  showModal: boolean;
  showUser: UserType | null;
  sessionLog: SessionLogType[] | null;
  editingUser: UserType | null;
  deleteUserId: number | null;

  setQuery: (q: string) => void;
  setShowModal: (v: boolean) => void;
  setShowUser: (v: UserType | null) => void;
  setSessionLog: (v: SessionLogType[] | null) => void;
  setEditingUser: (u: UserType | null) => void;
  setDeleteUserId: (id: number | null) => void;

  loadUsers: () => Promise<void>;
  getUser: (id: number) => Promise<void>;
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
  showUser: null,
  sessionLog: null,
  editingUser: null,
  deleteUserId: null,

  setQuery: (q) => set({ query: q }),
  setShowModal: (v) => set({ showModal: v }),
  setShowUser: (u) => set({ showUser: u }),
  setSessionLog: (u) => set({ sessionLog: u }),
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

  getUser: async (userId) => {
    const result = await window.electronAPI?.getUser(userId);
    if (!result) return;
    set({
      showUser: {
        id: result.id,
        firstName: result.firstName,
        lastName: result.lastName,
        nationalId: result.nationalId,
        phone: result.phone,
        sessions: result.sessions,
      },
      sessionLog: result.logs,
    });
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
