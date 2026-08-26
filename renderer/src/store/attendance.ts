import { create } from "zustand";
import type { UseSessionResult } from "../global";
import { emitAppDataChange } from "../lib/bus";
import { useUsersStore } from "./users";

interface PendingAttendance {
  uid: string;
  sessionId: number;
  message: string;
}

interface AttendanceStore {
  overlay: UseSessionResult | null;
  pending: PendingAttendance | null;
  showOverlay: (result: UseSessionResult) => void;
  clearOverlay: () => void;
  setPending: (pending: PendingAttendance | null) => void;
  applyCard: (uid: string) => Promise<void>;
  confirmPending: () => Promise<void>;
  markSession: (sessionId: number) => Promise<UseSessionResult | undefined>;
  unmarkSession: (sessionId: number) => Promise<UseSessionResult | undefined>;
}

let overlayTimer: number | null = null;

function playBeep(ok: boolean) {
  try {
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.value = ok ? 880 : 240;
    gain.gain.value = 0.05;
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.16);
  } catch {
    /* ignore */
  }
}

function refreshOpenUser() {
  const { viewUserId, getUser } = useUsersStore.getState();
  if (viewUserId) void getUser(viewUserId);
}

export const useAttendanceStore = create<AttendanceStore>((set, get) => ({
  overlay: null,
  pending: null,

  showOverlay: (result) => {
    if (overlayTimer) window.clearTimeout(overlayTimer);
    set({ overlay: result, pending: null });
    overlayTimer = window.setTimeout(() => set({ overlay: null }), 4200);
  },

  clearOverlay: () => {
    if (overlayTimer) window.clearTimeout(overlayTimer);
    set({ overlay: null });
  },

  setPending: (pending) => set({ pending }),

  applyCard: async (uid) => {
    const result = await window.electronAPI?.useSession(uid);
    if (!result) return;
    if (result.code === "OUT_OF_TOLERANCE" && result.sessionId) {
      set({
        pending: {
          uid,
          sessionId: result.sessionId,
          message: result.message,
        },
      });
      return;
    }
    get().showOverlay(result);
    if (result.success) {
      playBeep(result.code === "OK");
      emitAppDataChange();
      refreshOpenUser();
    }
  },

  confirmPending: async () => {
    const pending = get().pending;
    if (!pending) return;
    const result = await window.electronAPI?.useSession(pending.uid, {
      force: true,
      sessionId: pending.sessionId,
    });
    set({ pending: null });
    if (!result) return;
    get().showOverlay(result);
    if (result.success) {
      emitAppDataChange();
      refreshOpenUser();
    }
  },

  markSession: async (sessionId) => {
    const result = await window.electronAPI?.markSession(sessionId);
    if (!result) return;
    get().showOverlay(result);
    if (result.success) {
      emitAppDataChange();
      refreshOpenUser();
    }
    return result;
  },

  unmarkSession: async (sessionId) => {
    const result = await window.electronAPI?.unmarkSession(sessionId);
    if (!result) return;
    get().showOverlay(result);
    if (result.success) {
      emitAppDataChange();
      refreshOpenUser();
    }
    return result;
  },
}));
